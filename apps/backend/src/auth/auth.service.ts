import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRole } from '@housy/shared';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async sendOtp(phone: string) {
    // Normalize phone number to E.164 format
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`;

    const { error } = await this.supabase.db.auth.signInWithOtp({
      phone: normalized,
    });

    if (error) throw new BadRequestException(error.message);

    return { message: 'OTP sent successfully', phone: normalized };
  }

  async verifyOtp(phone: string, otp: string, name?: string, role?: UserRole) {
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`;

    const { data, error } = await this.supabase.db.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: 'sms',
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Upsert user profile in public.users table
    const userId = data.user?.id;
    if (userId) {
      await this.supabase.db.from('users').upsert({
        id: userId,
        phone: normalized,
        name: name || '',
        role: role || 'homeowner',
        phone_verified: true,
        language_pref: 'en',
        city: '',
        aadhaar_verified: false,
      }, { onConflict: 'id' });
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user_id: userId,
      role: role || 'homeowner',
    };
  }
}
