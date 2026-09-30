import { NextResponse } from 'next/server';
import { requestOtp } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';

export async function POST(req: Request) {
  try {
    // Behind a trusted proxy/CDN the first x-forwarded-for entry is the client. Without one it can be spoofed, so the per-phone cap still applies.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const d = await requestOtp((await readBody(req)).phone, ip);
    // `devCode` exists only in demo mode (non-production, or HOUSY_DEV_OTP=1) and is never sent when a real SMS goes out.
    return NextResponse.json(d.mode === 'demo' ? { sent: true, devCode: d.code } : { sent: true });
  } catch (e) { return errorResponse(e); }
}
