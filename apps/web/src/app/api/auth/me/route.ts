import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { getProfile } from '@/lib/profile';
import { isAdmin } from '@/lib/admin';
import { getPartnerByPhone } from '@/lib/partners';

export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await currentSession();
  if (!s) return NextResponse.json({ user: null });
  const [profile, partner] = await Promise.all([getProfile(s.phone), getPartnerByPhone(s.phone)]);
  return NextResponse.json({ user: { phone: s.phone, name: profile?.name ?? s.name, onboarded: !!profile, profile, isAdmin: isAdmin(s.phone), partner: partner ? { kind: partner.kind, status: partner.status } : null } });
}
