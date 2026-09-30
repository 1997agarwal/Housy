import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { voiceFile } from '@/lib/chat';
import { NotFoundError } from '@/lib/projects';
import { AUDIO_MIME } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// Voice notes are private to the project's owner and always served as audio (never sniffed into something executable).
export async function GET(_: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const s = await requireSession();
    const { id, messageId } = await params;
    const f = await voiceFile(id, s.phone, messageId);
    if (!f) throw new NotFoundError('Voice note not found');
    return new NextResponse(new Uint8Array(f.buf), { headers: { 'Content-Type': AUDIO_MIME[f.ext], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600', 'Content-Length': String(f.buf.length) } });
  } catch (e) { return errorResponse(e); }
}
