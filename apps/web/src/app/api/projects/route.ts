import { NextResponse } from 'next/server';
import { NoCoverageError } from '@/lib/pros';
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
    if (e instanceof NoCoverageError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
