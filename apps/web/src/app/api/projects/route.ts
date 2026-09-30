import { NextResponse } from 'next/server';
import { createProject, listProjects, validateCreate, ValidationError } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(req: Request) {
  try {
    const input = validateCreate(await req.json());
    return NextResponse.json(await createProject(input), { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError || e instanceof SyntaxError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
