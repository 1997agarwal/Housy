import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { getPlan, savePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json({ plan: await getPlan((await requireSession()).phone) }); } catch (e) { return errorResponse(e); }
}

export async function PUT(req: Request) {
  try {
    const s = await requireSession();
    return NextResponse.json({ plan: await savePlan(s.phone, await readBody(req)) });
  } catch (e) { return errorResponse(e); }
}
