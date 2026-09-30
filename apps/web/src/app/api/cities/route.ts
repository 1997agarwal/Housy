import { NextResponse } from 'next/server';
import { CITIES } from '@/lib/cities';
import { PROS } from '@/lib/pros';
import { approvedPartnerCount } from '@/lib/partners';

export async function GET() {
  const partners = await approvedPartnerCount();
  return NextResponse.json(CITIES.map((c) => ({ ...c, crews: PROS.filter((p) => p.city === c.id).length + (partners[c.id] ?? 0) })));
}
