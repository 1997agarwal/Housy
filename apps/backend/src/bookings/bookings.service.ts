import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { BookingStatus } from '@housy/shared';

@Injectable()
export class BookingsService {
  private platformFeePct: number;

  constructor(
    private supabase: SupabaseService,
    private whatsapp: WhatsAppService,
    private config: ConfigService,
  ) {
    this.platformFeePct = Number(this.config.get<number>('PLATFORM_FEE_PCT')) || 12;
  }

  async create(homeownerId: string, dto: CreateBookingDto) {
    // 1. Calculate duration in days
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) {
      throw new BadRequestException('End date must be greater than or equal to start date');
    }
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // 2. Fetch Homeowner details
    const { data: homeowner, error: homeErr } = await this.supabase.db
      .from('users')
      .select('name, phone')
      .eq('id', homeownerId)
      .single();

    if (homeErr || !homeowner) {
      throw new BadRequestException('Homeowner user record not found');
    }

    // 3. Fetch POC details and associated user phone/name
    const { data: poc, error: pocErr } = await this.supabase.db
      .from('poc_profiles')
      .select('*, users!inner(name, phone)')
      .eq('id', dto.poc_id)
      .single();

    if (pocErr || !poc) {
      throw new NotFoundException(`POC with ID ${dto.poc_id} not found`);
    }

    const totalLabor = dto.daily_rate * daysCount;
    const platformFee = Math.round((totalLabor * this.platformFeePct) / 100);
    const grandTotal = totalLabor + platformFee;

    // 4. Insert booking record into Supabase
    const { data: booking, error: insertErr } = await this.supabase.db
      .from('bookings')
      .insert({
        project_id: dto.project_id,
        poc_id: dto.poc_id,
        homeowner_id: homeownerId,
        skills_required: dto.skills_required,
        start_date: dto.start_date,
        end_date: dto.end_date,
        daily_rate: dto.daily_rate,
        status: 'pending',
        work_description: dto.work_description,
        platform_fee_pct: this.platformFeePct,
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // 5. Trigger WhatsApp Notification to POC
    const primarySkill = dto.skills_required[0] || poc.primary_skill;
    await this.whatsapp.sendBookingRequestToPoc({
      pocName: poc.users.name || 'Contractor',
      pocPhone: poc.users.phone,
      homeownerName: homeowner.name || 'Homeowner',
      homeownerPhone: homeowner.phone,
      skillRequired: primarySkill.replace('_', ' ').toUpperCase(),
      startDate: dto.start_date,
      endDate: dto.end_date,
      daysCount,
      dailyRate: dto.daily_rate,
      totalLaborAmount: totalLabor,
      workDescription: dto.work_description,
      bookingId: booking.id,
    });

    return {
      data: booking,
      summary: {
        days_count: daysCount,
        daily_rate: dto.daily_rate,
        labor_total: totalLabor,
        platform_fee: platformFee,
        platform_fee_pct: this.platformFeePct,
        grand_total: grandTotal,
      },
      message: 'Booking request sent to POC via WhatsApp',
    };
  }

  async findByHomeowner(homeownerId: string) {
    const { data, error } = await this.supabase.db
      .from('bookings')
      .select('*, poc_profiles(*, users!inner(name, phone)), projects(title)')
      .eq('homeowner_id', homeownerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findOne(id: string, requesterId: string) {
    const { data: booking, error } = await this.supabase.db
      .from('bookings')
      .select('*, poc_profiles(*, users!inner(name, phone)), projects(title, property_id)')
      .eq('id', id)
      .single();

    if (error || !booking) throw new NotFoundException('Booking not found');

    // Only the homeowner or the booked POC can access
    const isOwner = booking.homeowner_id === requesterId;
    const isPoc = booking.poc_profiles?.user_id === requesterId;
    if (!isOwner && !isPoc) throw new ForbiddenException();

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus, requesterId: string) {
    const { data: booking, error: fetchErr } = await this.supabase.db
      .from('bookings')
      .select('*, poc_profiles(*, users!inner(name, phone)), users!homeowner_id(name, phone)')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) throw new NotFoundException('Booking not found');

    // Update status
    const { data: updated, error: updateErr } = await this.supabase.db
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);

    // Notify homeowner via WhatsApp
    await this.whatsapp.sendStatusUpdateToHomeowner({
      homeownerPhone: booking.users.phone,
      homeownerName: booking.users.name,
      pocName: booking.poc_profiles.users.name,
      status,
      bookingId: id,
    });

    return updated;
  }
}
