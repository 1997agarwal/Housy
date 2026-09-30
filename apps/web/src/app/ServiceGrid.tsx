'use client';

import Link from 'next/link';
import { PROJECT_TYPES, estimate, inrShort, type Category } from '@/lib/catalog';
import { cityName, typeTagline, typeTitle, useT } from '@/lib/i18n';
import { useCity } from '@/lib/city-context';
import { useAuth } from '@/lib/auth-context';

export function ServiceGrid() {
  const { city } = useCity();
  const { user } = useAuth();
  const { t, lang } = useT();
  const goals = user?.profile?.goals ?? [];
  const cats: Category[] = ['build', 'renovate', 'interiors'];
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-slate-700">{t('grid.showing', { city: cityName(city, lang) })}</span>
        {city.status === 'live'
          ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{t('grid.live')}</span>
          : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{t('grid.soon')}</span>}
      </div>
      {cats.map((c, ci) => (
        <div key={c} className="mt-8" id={c}>
          <div className="flex items-baseline gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-[#E05A2B]">{ci + 1}</span>
            <h3 className="text-xl font-extrabold text-slate-900">{t(`cat.${c}`)}</h3>
            {goals.includes(c) && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#C44519]">{t('grid.goal')}</span>}
          </div>
          <p className="ml-10 text-sm text-slate-600">{t(`cat.${c}.d` as const)}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECT_TYPES.filter((pt) => pt.category === c).map((pt) => {
              const e = estimate({ typeId: pt.id, city: city.id, area: pt.defaultArea, tier: 'standard', drainFt: pt.askDrain ? 15 : undefined });
              return (
                <Link key={pt.id} href={`/plan/${pt.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
                  <div className="text-3xl">{pt.emoji}</div>
                  <h4 className="mt-3 text-lg font-bold text-slate-900">{typeTitle(pt, lang)}</h4>
                  <p className="mt-1 text-sm text-slate-600">{typeTagline(pt, lang)}</p>
                  <p className="mt-4 text-sm font-semibold text-[#E05A2B]">
                    {t('grid.from', { price: inrShort(e.low), days: e.days })} <span className="ml-1 transition group-hover:ml-2">→</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <p className="mt-4 text-xs text-slate-500">{t('grid.note')}</p>
    </>
  );
}
