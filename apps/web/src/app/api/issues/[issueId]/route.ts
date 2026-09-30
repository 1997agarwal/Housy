import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { errorResponse, readBody } from '@/lib/http';
import { ownerAct, type OwnerAction } from '@/lib/issues';
import { ValidationError } from '@/lib/projects';

export async function POST(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const s = await requireSession();
    const b = (await readBody(req)) as OwnerAction;
    if (!['message', 'resolve', 'reopen'].includes(b?.action)) throw new ValidationError('Unknown action');
    return NextResponse.json(await ownerAct((await params).issueId, s.phone, b));
  } catch (e) { return errorResponse(e); }
}
