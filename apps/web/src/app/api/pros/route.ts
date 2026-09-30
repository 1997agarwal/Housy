import { NextResponse } from 'next/server';
import { getCity } from '@/lib/cities';
import { prosIn } from '@/lib/pros';
import { directoryPartners } from '@/lib/partners';
import { withStats } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const city = getCity(q.get('city'));
  if (!city) return NextResponse.json({ error: 'Unknown city' }, { status: 400 });
  const trade = q.get('trade') ?? undefined;
  const pros = (await withStats([...prosIn(city.id, trade), ...(await directoryPartners(city.id, trade))])).sort((a, b) => b.avgRating - a.avgRating);
  return NextResponse.json({ city, status: city.status, pros });
}
