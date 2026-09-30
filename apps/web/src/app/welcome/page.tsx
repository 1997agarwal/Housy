'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCity } from '@/lib/city-context';
import { LoginForm } from '@/lib/LoginForm';
import { ProfileForm } from '@/lib/ProfileForm';
import { PROJECT_TYPES, estimate, inrShort, interiorBudgetGuide, type Category } from '@/lib/catalog';
import { cityOrDefault } from '@/lib/cities';
import { cityName, typeTitle, useT } from '@/lib/i18n';
import type { Profile } from '@/lib/profile-shared';

export default function Welcome() {
  const { user } = useAuth();
  const { city, setCity } = useCity();
  const router = useRouter();
  const { t, lang } = useT();
  const [done, setDone] = useState<Profile | null>(null);

  // Someone who already finished sign-up has nothing to do here.
  useEffect(() => { if (user?.onboarded && !done) router.replace('/'); }, [user, done, router]);

  if (user === undefined) return <div className="mx-auto max-w-2xl px-4 py-12 text-slate-500">Loading…</div>;
  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Create your Housy account</h1>
      <p className="mt-1 text-slate-600">Verify your mobile number to get started.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><LoginForm /></div>
    </div>
  );

  if (done) {
    const c = cityOrDefault(done.city);
    const types = PROJECT_TYPES.filter((t) => t.featured && done.goals.includes(t.category as Category));
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#E05A2B]">{t('welcome.you')}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{t('welcome.hi', { name: done.name.split(' ')[0] })}</h1>
        <p className="mt-1 text-slate-600">{t('welcome.where', { city: cityName(c, lang) })}</p>
        {c.status === 'soon' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t('welcome.soon', { city: cityName(c, lang) })}</p>}
        {done.goals.includes('interiors') && done.propertyValueLakh && (() => { const g = interiorBudgetGuide(done.propertyValueLakh); return (
          <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{t('welcome.guide', { value: done.propertyValueLakh!, low: inrShort(g.low), high: inrShort(g.high) })}</p>
        ); })()}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {types.map((pt) => {
            const e = estimate({ typeId: pt.id, city: c.id, area: done.propertyAreaSqft && pt.category !== 'renovate' ? done.propertyAreaSqft : pt.defaultArea, tier: 'standard', drainFt: pt.askDrain ? 15 : undefined });
            return (
              <Link key={pt.id} href={`/plan/${pt.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-orange-300">
                <div className="text-2xl">{pt.emoji}</div>
                <h2 className="mt-2 font-bold text-slate-900">{typeTitle(pt, lang)}</h2>
                <p className="mt-1 text-sm text-[#E05A2B] font-semibold">{t('grid.from', { price: inrShort(e.low), days: e.days })} →</p>
              </Link>
            );
          })}
        </div>
        <div className="mt-8"><Link href="/" className="font-bold text-[#E05A2B]">{t('welcome.explore')}</Link></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('onb.title')}</h1>
      <p className="mt-1 text-slate-600">{t('onb.sub')}</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <ProfileForm mode="onboard" defaultCity={city.id} onSaved={(p) => { setCity(p.city); setDone(p); }} />
      </div>
    </div>
  );
}
