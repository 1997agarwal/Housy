'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCity } from '@/lib/city-context';
import { TRADES, TRADE_LABEL } from '@/lib/pros';
import type { ProWithStats } from '@/lib/reviews';
import { inr } from '@/lib/catalog';

export default function Workers() {
  const { city } = useCity();
  const [trade, setTrade] = useState('');
  const [pros, setPros] = useState<ProWithStats[] | null>(null);

  useEffect(() => {
    let live = true;
    setPros(null);
    fetch(`/api/pros?city=${city.id}${trade ? `&trade=${trade}` : ''}`).then((r) => r.json()).then((d) => live && setPros(d.pros ?? []));
    return () => { live = false; };
  }, [city.id, trade]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Verified crews in {city.name}</h1>
      <p className="mt-1 text-slate-600">Field-agent verified masons, plumbers, electricians and engineers. On Housy projects they are assigned to your phases — you don’t have to chase them.</p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by trade">
        {['', ...TRADES].map((t) => (
          <button key={t || 'all'} onClick={() => setTrade(t)} aria-pressed={trade === t}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${trade === t ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>
            {t ? TRADE_LABEL[t as keyof typeof TRADE_LABEL] : 'All'}
          </button>
        ))}
      </div>

      {pros === null ? <p className="mt-8 text-slate-500">Loading…</p> : pros.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">{city.status === 'live' ? `No ${trade ? TRADE_LABEL[trade as keyof typeof TRADE_LABEL].toLowerCase() : 'crew'} listed in ${city.name} yet.` : `We’re onboarding crews in ${city.name}.`}</p>
          <p className="mt-1 text-sm text-slate-600">Our field agents register Mistris and contractors in person. Join the waitlist and you’ll hear first.</p>
          <Link href="/#services" className="mt-3 inline-block font-bold text-[#E05A2B]">Get an estimate for {city.name} →</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {pros.map((p) => (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-sm text-slate-600">{p.role} · {p.locality}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">✔ Verified</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">⭐ {p.avgRating} ({p.reviewCount} reviews{p.realReviews ? `, ${p.realReviews} on Housy` : ''}) · {p.years} yrs · crew of {p.crew}</p>
              <p className="mt-1 text-sm text-slate-700">{p.dayRate ? `${inr(p.dayRate)}/day` : 'Per-visit fee'} · Housy ID {p.housyId}</p>
              {p.recent.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-semibold text-[#E05A2B]">Recent Housy reviews</summary>
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
