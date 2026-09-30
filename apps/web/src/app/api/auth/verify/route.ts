import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth';
import { errorResponse } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const b = await req.json();
    return NextResponse.json(await verifyOtp(b.phone, b.code, b.name));
  } catch (e) { return errorResponse(e); }
}
