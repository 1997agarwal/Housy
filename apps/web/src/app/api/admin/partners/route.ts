import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { assertAdmin } from '@/lib/admin';
import { errorResponse, readBody } from '@/lib/http';
import { listPartners, opsView, setPartnerStatus, PartnerError, type PartnerStatus } from '@/lib/partners';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { assertAdmin((await requireSession()).phone); return NextResponse.json((await listPartners()).map(opsView)); } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    assertAdmin((await requireSession()).phone);
    const b = await readBody(req);
    if (b.status !== 'approved' && b.status !== 'suspended' && b.status !== 'pending') throw new PartnerError('Unknown status');
    return NextResponse.json(opsView(await setPartnerStatus(String(b.id ?? ''), b.status as PartnerStatus, typeof b.note === 'string' ? b.note : undefined)));
  } catch (e) { return errorResponse(e); }
}
