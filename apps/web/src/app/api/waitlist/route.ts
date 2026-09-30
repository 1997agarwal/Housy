import { NextResponse } from 'next/server';
import { addToWaitlist } from '@/lib/waitlist';
import { ValidationError } from '@/lib/projects';

export async function POST(req: Request) {
  try {
    const e = await addToWaitlist(await req.json());
    return NextResponse.json({ id: e.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError || err instanceof SyntaxError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
