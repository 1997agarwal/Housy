import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { crewReply } from '@/lib/chat';
import { isDemoMode } from '@/lib/demo';
import { NotFoundError } from '@/lib/projects';

// DEMO ONLY: lets the project owner play the crew's side until crews have their own app / WhatsApp bridge.
// In production this route must be replaced by an endpoint authenticated as the crew (e.g. a WhatsApp webhook with a signed secret).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isDemoMode()) throw new NotFoundError('Not found');   // in production this simulator does not exist
    const s = await requireSession();
    const b = await readBody(req);
    return NextResponse.json(await crewReply((await params).id, s.phone, typeof b.proId === 'string' ? b.proId : '', b.text), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
