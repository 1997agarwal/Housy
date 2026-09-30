'use client';

import { useState } from 'react';
import { CITIES } from './cities';
import { useAuth } from './auth-context';
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
export function ProfileForm({ mode, defaultCity, onSaved }: { mode: 'onboard' | 'edit'; defaultCity?: string; onSaved: (p: Profile) => void }) {
  const { user, refresh } = useAuth();
  const [d, setD] = useState<Draft>(() => fromProfile(user?.profile, user?.name, defaultCity));
  const [step, setStep] = useState(mode === 'onboard' ? 1 : 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
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
      onSaved(j.profile);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const about = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={lab} htmlFor="pname">Full name</label><input id="pname" className={field} value={d.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></div>
        <div><label className={lab} htmlFor="pemail">Email <span className="font-normal text-slate-500">(optional)</span></label><input id="pemail" type="email" className={field} value={d.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></div>
      </div>
      <div>
        <span className={lab}>Where do you live?</span>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {Object.entries(PERSONAS).map(([k, v]) => <button key={k} type="button" aria-pressed={d.persona === k} onClick={() => set('persona', k)} className={chip(d.persona === k)}>{v}</button>)}
        </div>
      </div>
      <div>
        <label className={lab} htmlFor="plang">Preferred language</label>
        <select id="plang" className={field} value={d.language} onChange={(e) => set('language', e.target.value)}>
          {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <p className="mt-1 text-xs text-slate-500">We’re saving your preference now; the Hindi interface is coming.</p>
      </div>
    </div>
  );

  const property = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={lab} htmlFor="pcity">City where the property is</label>
          <select id="pcity" className={field} value={d.city} onChange={(e) => set('city', e.target.value)}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status === 'soon' ? ' (coming soon)' : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={lab} htmlFor="ptype">Property type</label>
          <select id="ptype" className={field} value={d.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            <option value="">Select…</option>
            {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={lab} htmlFor="parea">Approx. area (sq ft) <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="parea" type="number" min={50} className={field} value={d.propertyAreaSqft} onChange={(e) => set('propertyAreaSqft', e.target.value)} />
        </div>
        <div>
          <label className={lab} htmlFor="pvalue">Approx. property value (₹ lakh) <span className="font-normal text-slate-500">(optional)</span></label>
          <input id="pvalue" type="number" min={1} className={field} value={d.propertyValueLakh} onChange={(e) => set('propertyValueLakh', e.target.value)} placeholder="e.g. 100 for ₹1 crore" />
          <p className="mt-1 text-xs text-slate-500">Helps us suggest a realistic interiors budget.</p>
        </div>
      </div>
      <div>
        <span className={lab}>What do you want to do? <span className="font-normal text-slate-500">(pick all that apply)</span></span>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {(Object.entries(GOALS) as [Goal, string][]).map(([k, v]) => <button key={k} type="button" aria-pressed={d.goals.includes(k)} onClick={() => toggle(k)} className={chip(d.goals.includes(k))}>{d.goals.includes(k) ? '✓ ' : ''}{v}</button>)}
        </div>
      </div>
      <div>
        <span className={lab}>When do you want to start?</span>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {Object.entries(TIMELINES).map(([k, v]) => <button key={k} type="button" aria-pressed={d.timeline === k} onClick={() => set('timeline', k)} className={chip(d.timeline === k)}>{v}</button>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {mode === 'onboard' && <p className="text-sm font-semibold text-slate-500">Step {step} of 2 · {step === 1 ? 'About you' : 'Your property & plans'}</p>}
      {(mode === 'edit' || step === 1) && about}
      {(mode === 'edit' || step === 2) && property}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
      <div className="flex gap-3">
        {mode === 'onboard' && step === 2 && <button type="button" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700" onClick={() => { setStep(1); setError(''); }}>Back</button>}
        {mode === 'onboard' && step === 1
          ? <button type="button" className={btn} onClick={next}>Continue</button>
          : <button type="button" className={btn} disabled={busy} onClick={save}>{busy ? 'Saving…' : mode === 'onboard' ? 'Finish sign-up' : 'Save changes'}</button>}
      </div>
    </div>
  );
}
