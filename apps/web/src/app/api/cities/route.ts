import { NextResponse } from 'next/server';
import { CITIES } from '@/lib/cities';
import { PROS } from '@/lib/pros';

export async function GET() {
  return NextResponse.json(CITIES.map((c) => ({ ...c, crews: PROS.filter((p) => p.city === c.id).length })));
}
