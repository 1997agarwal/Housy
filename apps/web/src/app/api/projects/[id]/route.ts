import { NextResponse } from 'next/server';
import { act, ConflictError, getProject, ValidationError, type Action } from '@/lib/projects';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const p = await getProject((await params).id);
  return p ? NextResponse.json(p) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const ACTIONS = ['complete_visit', 'accept_quote', 'start', 'submit', 'approve'];

export async function POST(req: Request, { params }: Ctx) {
  try {
    const body = (await req.json()) as Action;
    if (!ACTIONS.includes(body?.action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    return NextResponse.json(await act((await params).id, body));
  } catch (e) {
    if (e instanceof ValidationError || e instanceof SyntaxError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
