import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const b = await readBody(req);
    return NextResponse.json(await verifyOtp(b.phone, b.code, typeof b.name === 'string' ? b.name : undefined));
  } catch (e) { return errorResponse(e); }
}
