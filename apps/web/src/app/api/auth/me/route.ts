import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';
import { getProfile } from '@/lib/profile';

export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await currentSession();
  if (!s) return NextResponse.json({ user: null });
  const profile = await getProfile(s.phone);
  return NextResponse.json({ user: { phone: s.phone, name: profile?.name ?? s.name, onboarded: !!profile, profile } });
}
