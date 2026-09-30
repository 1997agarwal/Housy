import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { assertAdmin } from '@/lib/admin';
import { errorResponse, readBody } from '@/lib/http';
import { opsAct, type OpsAction } from '@/lib/issues';
import { ValidationError } from '@/lib/projects';

export async function POST(req: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    assertAdmin((await requireSession()).phone);
    const b = (await readBody(req)) as OpsAction;
    if (!['reply', 'resolve'].includes(b?.action)) throw new ValidationError('Unknown action');
    return NextResponse.json(await opsAct((await params).issueId, b));
  } catch (e) { return errorResponse(e); }
}
