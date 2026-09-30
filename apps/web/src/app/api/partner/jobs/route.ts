import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { getPartnerByPhone, PartnerError } from '@/lib/partners';
import { jobsFor, respondToOffer } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

async function me() {
  const p = await getPartnerByPhone((await requireSession()).phone);
  if (!p) throw new PartnerError('Register your listing first');
  return p;
}

export async function GET() {
  try { const p = await me(); return NextResponse.json({ status: p.status, jobs: p.status === 'approved' ? await jobsFor(p.id) : [] }); } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const p = await me();
    if (p.status !== 'approved') throw new PartnerError('Your listing is not approved yet');
    const b = await readBody(req);
    const jobs = await respondToOffer(p.id, String(b.projectId ?? ''), String(b.milestoneId ?? ''), b.decision as 'accept' | 'decline');
    return NextResponse.json({ status: p.status, jobs });
  } catch (e) { return errorResponse(e); }
}
