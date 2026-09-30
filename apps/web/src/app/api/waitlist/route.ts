import { NextResponse } from 'next/server';
import { addToWaitlist } from '@/lib/waitlist';
import { errorResponse, readBody } from '@/lib/http';
import { rateLimit } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    // Unauthenticated and every insert rewrites a file, so cap sign-ups per client. (Behind a trusted proxy the first
    // x-forwarded-for entry is the client; without one it can be spoofed, but the ratelimit store is size-bounded.)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const wait = await rateLimit([[`waitlist:${ip}`, 10]], 3_600_000);
    if (wait) return NextResponse.json({ error: `Too many sign-ups from your network. Try again in ${Math.ceil(wait / 60)} min` }, { status: 429 });
    const e = await addToWaitlist(await readBody(req));
    return NextResponse.json({ id: e.id }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
