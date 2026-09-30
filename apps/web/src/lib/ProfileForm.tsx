'use client';

import { useState } from 'react';
import { CITIES } from './cities';
import { useAuth } from './auth-context';
import { cityName, useT } from './i18n';
import { GOALS, LANGUAGES, PERSONAS, PROPERTY_TYPES, TIMELINES, type Goal, type Profile } from './profile-shared';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200';
const lab = 'block text-sm font-semibold text-slate-700';
const btn = 'rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const chip = (on: boolean) => `rounded-xl border px-3 py-2.5 text-left text-sm font-semibold ${on ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`;

type Draft = {
  name: string; email: string; language: string; persona: string; city: string; propertyType: string;
  propertyAreaSqft: string; propertyValueLakh: string; goals: Goal[]; timeline: string;
};
const fromProfile = (p: Profile | null | undefined, name = '', city = 'bareilly'): Draft => ({
  name: p?.name ?? name, email: p?.email ?? '', language: p?.language ?? 'en', persona: p?.persona ?? '', city: p?.city ?? city,
  propertyType: p?.propertyType ?? '', propertyAreaSqft: p?.propertyAreaSqft?.toString() ?? '', propertyValueLakh: p?.propertyValueLakh?.toString() ?? '',
  goals: p?.goals ?? [], timeline: p?.timeline ?? '',
});

// mode 'onboard' = two guided steps for new users; 'edit' = everything on one page.
export function ProfileForm({ mode, defaultCity, onSaved, onEdit }: { mode: 'onboard' | 'edit'; defaultCity?: string; onSaved: (p: Profile) => void; onEdit?: () => void }) {
  const { user, refresh } = useAuth();
  const { t, lang, setLang } = useT();
  const [d, setD] = useState<Draft>(() => fromProfile(user?.profile, user?.name, defaultCity));
  const [step, setStep] = useState(mode === 'onboard' ? 1 : 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); onEdit?.(); };
  const toggle = (g: Goal) => set('goals', d.goals.includes(g) ? d.goals.filter((x) => x !== g) : [...d.goals, g]);

  function next() {
    if (d.name.trim().length < 2) return setError('Enter your full name');
    if (!d.persona) return setError('Tell us where you live relative to the property');
    setError(''); setStep(2);
  }
  async function save() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not save');
      await refresh();
      if (j.profile.language === 'hi' || j.profile.language === 'en') setLang(j.profile.language);   // the language they just picked applies now, even if they toggled the header earlier
      onSaved(j.profile);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const about = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lab} htmlFor="pname">{t('onb.fullName')}</label><input id="pname" className={field} value={d.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></div>
        <div><label className={lab} htmlFor="pemail">{t('onb.email')} <span className="font-normal text-slate-500">{t('onb.optional')}</span></label><input id="pemail" type="email" className={field} value={d.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></div>
      </div>
      <div>
        <span className={lab}>{t('onb.where')}</span>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {Object.keys(PERSONAS).map((k) => <button key={k} type="button" aria-pressed={d.persona === k} onClick={() => set('persona', k)} className={chip(d.persona === k)}>{t(`persona.${k}` as never)}</button>)}
        </div>
      </div>
      <div>
        <label className={lab} htmlFor="plang">{t('onb.lang')}</label>
        <select id="plang" className={field} value={d.language} onChange={(e) => set('language', e.target.value)}>
          {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">{t('onb.langHint')}</p>
      </div>
    </div>
  );

  const property = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lab} htmlFor="pcity">{t('onb.city')}</label>
          <select id="pcity" className={field} value={d.city} onChange={(e) => set('city', e.target.value)}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{cityName(c, lang)}{c.status === 'soon' ? ` (${t('city.soon')})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={lab} htmlFor="ptype">{t('onb.ptype')}</label>
          <select id="ptype" className={field} value={d.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            <option value="">{t('onb.select')}</option>
            {Object.keys(PROPERTY_TYPES).map((k) => <option key={k} value={k}>{t(`ptype.${k}` as never)}</option>)}
          </select>
        </div>
        <div>
          <label className={lab} htmlFor="parea">{t('onb.area')} <span className="font-normal text-slate-500">{t('onb.optional')}</span></label>
          <input id="parea" type="number" min={50} className={field} value={d.propertyAreaSqft} onChange={(e) => set('propertyAreaSqft', e.target.value)} />
        </div>
        <div>
          <label className={lab} htmlFor="pvalue">{t('onb.value')} <span className="font-normal text-slate-500">{t('onb.optional')}</span></label>
          <input id="pvalue" type="number" min={1} className={field} value={d.propertyValueLakh} onChange={(e) => set('propertyValueLakh', e.target.value)} placeholder={t('plan.valuePh')} />
          <p className="mt-1 text-xs text-slate-500">{t('onb.valueHint')}</p>
        </div>
      </div>
      <div>
        <span className={lab}>{t('onb.goals')} <span className="font-normal text-slate-500">{t('onb.goalsHint')}</span></span>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {(Object.keys(GOALS) as Goal[]).map((k) => <button key={k} type="button" aria-pressed={d.goals.includes(k)} onClick={() => toggle(k)} className={chip(d.goals.includes(k))}>{d.goals.includes(k) ? '✓ ' : ''}{t(`goal.${k}` as never)}</button>)}
        </div>
      </div>
      <div>
        <span className={lab}>{t('onb.when')}</span>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {Object.keys(TIMELINES).map((k) => <button key={k} type="button" aria-pressed={d.timeline === k} onClick={() => set('timeline', k)} className={chip(d.timeline === k)}>{t(`when.${k}` as never)}</button>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {mode === 'onboard' && <p className="text-sm font-semibold text-slate-500">{t('onb.step', { n: step })} · {step === 1 ? t('onb.about') : t('onb.property')}</p>}
      {(mode === 'edit' || step === 1) && about}
      {(mode === 'edit' || step === 2) && property}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
      <div className="flex gap-3">
        {mode === 'onboard' && step === 2 && <button type="button" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700" onClick={() => { setStep(1); setError(''); }}>{t('onb.back')}</button>}
        {mode === 'onboard' && step === 1
          ? <button type="button" className={btn} onClick={next}>{t('onb.continue')}</button>
          : <button type="button" className={btn} disabled={busy} onClick={save}>{busy ? t('onb.saving') : mode === 'onboard' ? t('onb.finish') : t('onb.save')}</button>}
      </div>
    </div>
  );
}
