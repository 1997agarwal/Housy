import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { QueryPocDto } from './dto/poc.dto';

@Injectable()
export class PocService {
  constructor(private supabase: SupabaseService) {}

  async findAll(query: QueryPocDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = this.supabase.db
      .from('poc_profiles')
      .select('*, users!inner(id, name, phone, city)', { count: 'exact' })
      .eq('is_available', true);

    if (query.skill) {
      dbQuery = dbQuery.contains('skills_available', [query.skill]);
    }

    if (query.area) {
      dbQuery = dbQuery.contains('areas_served', [query.area]);
    }

    if (query.max_rate) {
      dbQuery = dbQuery.lte('daily_rate_min', query.max_rate);
    }

    if (query.min_rating) {
      dbQuery = dbQuery.gte('rating_avg', query.min_rating);
    }

    dbQuery = dbQuery
      .order('rating_avg', { ascending: false })
      .range(from, to);

    const { data, count, error } = await dbQuery;
    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    };
  }

  async findOne(id: string) {
    const { data: poc, error } = await this.supabase.db
      .from('poc_profiles')
      .select('*, users!inner(id, name, phone, city)')
      .eq('id', id)
      .single();

    if (error || !poc) {
      throw new NotFoundException(`POC profile with ID ${id} not found`);
    }

    // Fetch verified reviews for this POC
    const { data: reviews } = await this.supabase.db
      .from('reviews')
      .select('*, users!reviewer_id(name)')
      .eq('reviewee_id', poc.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      ...poc,
      reviews: reviews || [],
    };
  }

  async getFeatured(city = 'Bareilly') {
    const { data, error } = await this.supabase.db
      .from('poc_profiles')
      .select('*, users!inner(id, name, phone, city)')
      .eq('is_verified', true)
      .eq('is_available', true)
      .order('rating_avg', { ascending: false })
      .limit(6);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
