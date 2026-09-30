import { NextResponse } from 'next/server';
import { requireSession, setSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getProfile, saveProfile } from '@/lib/profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json({ profile: await getProfile((await requireSession()).phone) }); } catch (e) { return errorResponse(e); }
}

export async function PUT(req: Request) {
  try {
    const s = await requireSession();
    const profile = await saveProfile(s.phone, await req.json());
    await setSession({ phone: s.phone, name: profile.name }); // keep the cookie's display name in step with the profile
    return NextResponse.json({ profile });
  } catch (e) { return errorResponse(e); }
}
