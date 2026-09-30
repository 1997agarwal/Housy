import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { assertAdmin, summary } from '@/lib/admin';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    assertAdmin((await requireSession()).phone);
    return NextResponse.json(await summary());
  } catch (e) { return errorResponse(e); }
}
