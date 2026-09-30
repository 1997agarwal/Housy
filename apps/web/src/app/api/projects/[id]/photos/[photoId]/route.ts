import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getProject, NotFoundError } from '@/lib/projects';
import { MIME, readImage } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string; photoId: string }> };

// Photos are private: only the project's owner can fetch them, and they are always served as images.
export async function GET(_: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const { id, photoId } = await params;
    const p = await getProject(id, s.phone);
    const photo = p?.photos?.find((x) => x.id === photoId);
    const buf = photo && (await readImage(id, photo.id, photo.ext));
    if (!photo || !buf) throw new NotFoundError('Photo not found');
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': MIME[photo.ext], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (e) { return errorResponse(e); }
}
