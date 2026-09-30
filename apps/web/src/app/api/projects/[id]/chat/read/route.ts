import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { markRead } from '@/lib/chat';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession();
    const b = await readBody(req);
    await markRead((await params).id, s.phone, typeof b.proId === 'string' ? b.proId : '');
    return NextResponse.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
