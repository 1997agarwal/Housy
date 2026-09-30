import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { createProject, listProjects, validateCreate } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { return NextResponse.json(await listProjects((await requireSession()).phone)); } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const s = await requireSession();
    return NextResponse.json(await createProject(validateCreate(await req.json()), s.phone), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
