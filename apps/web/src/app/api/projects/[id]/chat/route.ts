import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { getMessages, listThreads, sendText, sendVoice } from '@/lib/chat';
import { isDemoMode } from '@/lib/demo';
import { ValidationError } from '@/lib/projects';
import { decodeAudioDataUrl } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

// Threads (with unread counts) and, when ?pro= is given, that thread's messages. ?since= returns only newer ones (polling).
export async function GET(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const { id } = await params;
    const q = new URL(req.url).searchParams;
    const pro = q.get('pro');
    const since = q.get('since') ?? undefined;
    return NextResponse.json({ threads: await listThreads(id, s.phone), messages: pro ? await getMessages(id, s.phone, pro, since) : [], demo: isDemoMode() });
  } catch (e) { return errorResponse(e); }
}

// Send a text message ({proId, text}) or a voice note ({proId, voice: data-URL, seconds}).
export async function POST(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const { id } = await params;
    const b = await readBody(req, 2_200_000);
    const proId = typeof b.proId === 'string' ? b.proId : '';
    if (b.voice !== undefined) {
      let audio;
      try { audio = decodeAudioDataUrl(b.voice); } catch (e) { throw new ValidationError((e as Error).message); }
      return NextResponse.json(await sendVoice(id, s.phone, proId, audio.buf, audio.ext, b.seconds), { status: 201 });
    }
    return NextResponse.json(await sendText(id, s.phone, proId, b.text), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
