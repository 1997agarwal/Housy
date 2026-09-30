'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCity } from '@/lib/city-context';
import { LoadError } from '@/lib/LoadError';
import { cityName, useT } from '@/lib/i18n';
import type { Key } from '@/lib/messages';
import { TRADES } from '@/lib/pros';
import type { ProWithStats } from '@/lib/reviews';
import { inr } from '@/lib/catalog';

export default function Workers() {
  const { city } = useCity();
  const { t, lang } = useT();
  const [err, setErr] = useState(false);
  const [tick, setTick] = useState(0);
  const [trade, setTrade] = useState('');
  const [pros, setPros] = useState<ProWithStats[] | null>(null);

  useEffect(() => {
    let live = true;
    setPros(null); setErr(false);
    fetch(`/api/pros?city=${city.id}${trade ? `&trade=${trade}` : ''}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => live && setPros(d.pros ?? []))
      .catch(() => live && setErr(true));
    return () => { live = false; };
  }, [city.id, trade, tick]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('wk.title', { city: cityName(city, lang) })}</h1>
      <p className="mt-1 text-slate-600">{t('wk.desc')}</p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t('wk.filter')}>
        {['', ...TRADES].map((tr) => (
          <button key={tr || 'all'} onClick={() => setTrade(tr)} aria-pressed={trade === tr}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${trade === tr ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>
            {tr ? t(`trade.${tr}` as Key) : t('common.all')}
          </button>
        ))}
      </div>

      {err ? <LoadError message={t('wk.loadFail')} onRetry={() => setTick((n) => n + 1)} /> : pros === null ? <p className="mt-8 text-slate-500">{t('common.loading')}</p> : pros.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">{city.status === 'live' ? (trade ? t('wk.noneTrade', { trade: t(`trade.${trade}` as Key).toLowerCase(), city: cityName(city, lang) }) : t('wk.noneAny', { city: cityName(city, lang) })) : t('wk.onboarding', { city: cityName(city, lang) })}</p>
          <p className="mt-1 text-sm text-slate-600">{t('wk.agents')}</p>
          <Link href="/#services" className="mt-3 inline-block font-bold text-[#E05A2B]">{t('wk.estimate', { city: cityName(city, lang) })}</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {pros.map((p) => (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-sm text-slate-600">{lang === 'hi' ? t(`trade.${p.trade}` as Key) : p.role} · {p.locality}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{t('wk.verified')}</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{p.realReviews ? t('wk.statsReal', { rating: p.avgRating, n: p.reviewCount, real: p.realReviews, yrs: p.years, crew: p.crew }) : t('wk.stats', { rating: p.avgRating, n: p.reviewCount, yrs: p.years, crew: p.crew })}</p>
              <p className="mt-1 text-sm text-slate-700">{p.dayRate ? t('wk.perDay', { rate: inr(p.dayRate) }) : t('wk.perVisit')} · {t('wk.id', { id: p.housyId })}</p>
              {p.recent.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-[#E05A2B]">{t('wk.recent')}</summary>
                  <ul className="mt-2 space-y-2">
                    {p.recent.map((r) => (
                      <li key={r.id} className="rounded-lg bg-slate-50 p-2"><span className="font-semibold">{r.overall} ★</span> · {r.reviewerName}{r.text ? <p className="text-slate-700">“{r.text}”</p> : null}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
