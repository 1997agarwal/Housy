'use client';

import Link from 'next/link';
import { ServiceGrid } from './ServiceGrid';
import { useT } from '@/lib/i18n';

export default function Home() {
  const { t } = useT();
  return (
    <div>
      <section className="bg-gradient-to-b from-orange-50 to-[#FAF9F6]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E05A2B]">{t('home.eyebrow')}</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl font-black tracking-tight text-slate-900">{t('home.title')}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">{t('home.desc')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/welcome" className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-[#C44519]">{t('home.getStarted')}</Link>
            <Link href="/workers" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:border-slate-400">{t('home.findCrews')}</Link>
            <a href="#services" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:border-slate-400">{t('home.seeAll')}</a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900">{t('home.journey')}</h2>
        <ServiceGrid />
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-extrabold text-slate-900">{t('home.how')}</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([1, 2, 3, 4] as const).map((i) => (
              <li key={i}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-black text-[#E05A2B]">{i}</span>
                <h3 className="mt-3 font-bold text-slate-900">{t(`how.${i}.t`)}</h3>
                <p className="mt-1 text-sm text-slate-600">{t(`how.${i}.d`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
