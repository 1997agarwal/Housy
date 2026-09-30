'use client';

import Link from 'next/link';
import { PROJECT_TYPES, estimate, inrShort } from '@/lib/catalog';
import { useCity } from '@/lib/city-context';

export function ServiceGrid() {
  const { city } = useCity();
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-700">Showing prices for {city.name}</span>
        {city.status === 'live'
          ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Live · verified crews available</span>
          : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Coming soon · estimates now, booking via waitlist</span>}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TYPES.map((t) => {
          const e = estimate({ typeId: t.id, city: city.id, area: t.defaultArea, tier: 'standard', drainFt: t.askDrain ? 15 : undefined });
          return (
            <Link key={t.id} href={`/plan/${t.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
              <div className="text-3xl">{t.emoji}</div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.tagline}</p>
              <p className="mt-4 text-sm font-semibold text-[#E05A2B]">
                from ~{inrShort(e.low)} · ~{e.days} days <span className="ml-1 transition group-hover:ml-2">→</span>
              </p>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">Indicative: standard tier, typical size. Your plan page estimates your own home.</p>
    </>
  );
}
