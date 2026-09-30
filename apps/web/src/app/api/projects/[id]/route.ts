import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { act, getProject, NotFoundError, type Action } from '@/lib/projects';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
const ACTIONS = ['complete_visit', 'accept_quote', 'start', 'submit', 'approve', 'reschedule', 'cancel', 'request_changes', 'request_change', 'price_change', 'approve_change', 'decline_change', 'add_expense', 'delete_expense', 'set_budget'];

export async function GET(_: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const p = await getProject((await params).id, s.phone);
    if (!p) throw new NotFoundError('Project not found');
    return NextResponse.json(p);
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const body = (await readBody(req)) as Action;
    if (!ACTIONS.includes(body?.action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    return NextResponse.json(await act((await params).id, body, s.phone));
  } catch (e) { return errorResponse(e); }
}
