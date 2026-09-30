import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { createProject, listProjects, validateCreate } from '@/lib/projects';
import { unreadCounts } from '@/lib/chat';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const owner = (await requireSession()).phone;
    const [projects, unread] = await Promise.all([listProjects(owner), unreadCounts(owner)]);
    return NextResponse.json(projects.map((p) => ({ ...p, unreadChat: unread[p.id] ?? 0 })));   // badge on the projects list
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const s = await requireSession();
    return NextResponse.json(await createProject(validateCreate(await readBody(req)), s.phone), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
