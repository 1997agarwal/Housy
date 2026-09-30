import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { addPhoto, ValidationError } from '@/lib/projects';
import { decodeDataUrl } from '@/lib/uploads';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const b = await req.json();
    let img;
    try { img = decodeDataUrl(b.image); } catch (e) { throw new ValidationError((e as Error).message); }
    const photo = await addPhoto((await params).id, s.phone, String(b.milestoneId ?? ''), img.buf, img.ext, typeof b.caption === 'string' ? b.caption : undefined);
    return NextResponse.json(photo, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
