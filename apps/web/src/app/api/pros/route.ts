import { NextResponse } from 'next/server';
import { getCity } from '@/lib/cities';
import { prosIn } from '@/lib/pros';
import { withStats } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const city = getCity(q.get('city'));
  if (!city) return NextResponse.json({ error: 'Unknown city' }, { status: 400 });
  const pros = (await withStats(prosIn(city.id, q.get('trade') ?? undefined))).sort((a, b) => b.avgRating - a.avgRating);
  return NextResponse.json({ city, status: city.status, pros });
}
