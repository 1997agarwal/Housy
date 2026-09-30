import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ user: await currentSession() });
}
