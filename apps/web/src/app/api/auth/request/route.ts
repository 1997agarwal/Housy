import { NextResponse } from 'next/server';
import { requestOtp } from '@/lib/auth';
import { errorResponse } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const d = await requestOtp((await req.json()).phone);
    // `devCode` exists only in demo mode (non-production, or HOUSY_DEV_OTP=1) and is never sent when a real SMS goes out.
    return NextResponse.json(d.mode === 'demo' ? { sent: true, devCode: d.code } : { sent: true });
  } catch (e) { return errorResponse(e); }
}
