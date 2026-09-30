import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { getPartnerByPhone, savePartner } from '@/lib/partners';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json({ partner: await getPartnerByPhone((await requireSession()).phone) }); } catch (e) { return errorResponse(e); }
}

// Register a crew/designer listing, or update your own. New listings start "pending" until ops verifies them.
export async function PUT(req: Request) {
  try {
    const s = await requireSession();
    return NextResponse.json({ partner: await savePartner(s.phone, await readBody(req)) });
  } catch (e) { return errorResponse(e); }
}
