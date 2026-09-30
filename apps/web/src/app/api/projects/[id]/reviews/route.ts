import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getProject, NotFoundError } from '@/lib/projects';
import { createReview, reviewablePros, reviewsForProject } from '@/lib/reviews';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

// Who I can review on this project + the reviews I've already left.
export async function GET(_: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const { id } = await params;
    const p = await getProject(id, s.phone);
    if (!p) throw new NotFoundError('Project not found');
    return NextResponse.json({ canReview: p.status === 'completed', pros: reviewablePros(p), reviews: await reviewsForProject(id, s.phone) });
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    return NextResponse.json(await createReview((await params).id, s.phone, await req.json()), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
