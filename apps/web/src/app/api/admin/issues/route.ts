import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { assertAdmin } from '@/lib/admin';
import { errorResponse } from '@/lib/http';
import { opsIssues } from '@/lib/issues';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { assertAdmin((await requireSession()).phone); return NextResponse.json(await opsIssues()); } catch (e) { return errorResponse(e); }
}
