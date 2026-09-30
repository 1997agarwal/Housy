import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { getProject, NotFoundError } from '@/lib/projects';
import { createIssue, issuesForProject } from '@/lib/issues';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    const { id } = await params;
    if (!(await getProject(id, s.phone))) throw new NotFoundError('Project not found');
    return NextResponse.json(await issuesForProject(id, s.phone));
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const s = await requireSession();
    return NextResponse.json(await createIssue((await params).id, s.phone, await req.json()), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
