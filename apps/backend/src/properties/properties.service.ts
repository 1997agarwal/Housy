import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(private supabase: SupabaseService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const { data, error } = await this.supabase.db
      .from('properties')
      .insert({ ...dto, owner_id: ownerId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  }

  async findByOwner(ownerId: string) {
    const { data, error } = await this.supabase.db
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { data };
  }

  async findOne(id: string, requesterId: string) {
    const { data, error } = await this.supabase.db
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Property not found');
    if (data.owner_id !== requesterId) throw new ForbiddenException();
    return { data };
  }

  async update(id: string, requesterId: string, dto: UpdatePropertyDto) {
    // Verify ownership
    await this.findOne(id, requesterId);

    const { data, error } = await this.supabase.db
      .from('properties')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data };
  }
}
