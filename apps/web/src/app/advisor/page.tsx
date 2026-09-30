'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DISCLAIMER, checkBathroom, checkWall, type BathInput, type Level, type Verdict, type WallInput } from '@/lib/advisor';
import { estimate, inrShort } from '@/lib/catalog';
import { useCity } from '@/lib/city-context';
import { cityName, useT } from '@/lib/i18n';
import type { Key } from '@/lib/messages';
import { DISCLAIMER_HI, localizeVerdict } from '@/lib/advisor-hi';

const LEVEL_STYLE: Record<Level, { box: string; chip: string; label: string; icon: string }> = {
  green: { box: 'border-emerald-300 bg-emerald-50', chip: 'bg-emerald-600', label: 'GREEN', icon: '✅' },
  amber: { box: 'border-amber-300 bg-amber-50', chip: 'bg-amber-500', label: 'AMBER', icon: '⚠️' },
  red: { box: 'border-red-300 bg-red-50', chip: 'bg-red-600', label: 'RED', icon: '🛑' },
};

function Choice<T extends string>({ label, value, options, onChange, hint }: { label: string; value: T; options: [T, Key][]; onChange: (v: T) => void; hint?: string }) {
  const { t } = useT();
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map(([v, key]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${value === v ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'} ${v === ('unsure' as T) ? 'italic' : ''}`}>{t(key)}</button>
        ))}
      </div>
    </fieldset>
  );
}

function Result({ v: verdict, cta }: { v: Verdict; cta: React.ReactNode }) {
  const { t, lang } = useT();
  const v = localizeVerdict(verdict, lang);
  const s = LEVEL_STYLE[v.level];
  return (
    <div className={`mt-6 rounded-2xl border-2 p-5 ${s.box}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2 py-1 text-xs font-black tracking-widest text-white ${s.chip}`}>{t(`adv.${s.label}` as Key)}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{s.icon} {v.headline}</h2>
      </div>
      <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('adv.why')}</h3>
      <ul className="mt-1 space-y-1 text-sm text-slate-800">
        {v.reasons.map((r, i) => <li key={i}>{LEVEL_STYLE[r.level].icon} {r.text}</li>)}
      </ul>
      <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('adv.next')}</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-800">{v.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
      <div className="mt-5">{cta}</div>
      <p className="mt-4 text-xs text-slate-600">{lang === 'hi' ? DISCLAIMER_HI : DISCLAIMER}</p>
    </div>
  );
}

function WallCheck() {
  const { t } = useT();
  const [w, setW] = useState<WallInput>({ construction: 'unsure', position: 'interior', thickness: 'unsure', above: 'unsure', beamAbove: 'unsure', services: 'unsure', age: 'mid', opening: 'door' });
  const [done, setDone] = useState(false);
  const set = <K extends keyof WallInput>(k: K, v: WallInput[K]) => { setW((x) => ({ ...x, [k]: v })); setDone(false); };
  const v = useMemo(() => checkWall(w), [w]);
  return (
    <div>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <Choice label={t('adv.q.construction')} hint={t('adv.q.constructionHint')} value={w.construction}
          options={[['rcc', 'adv.o.rcc'], ['masonry', 'adv.o.masonry'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('construction', x)} />
        <Choice label={t('adv.q.position')} value={w.position} options={[['interior', 'adv.o.interior'], ['exterior', 'adv.o.exterior']]} onChange={(x) => set('position', x)} />
        <Choice label={t('adv.q.thickness')} hint={t('adv.q.thicknessHint')} value={w.thickness}
          options={[['partition', 'adv.o.partition'], ['brick9', 'adv.o.brick9'], ['thick', 'adv.o.thick'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('thickness', x)} />
        <Choice label={t('adv.q.above')} value={w.above} options={[['floor', 'adv.o.floor'], ['roof', 'adv.o.roof'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('above', x)} />
        <Choice label={t('adv.q.beam')} value={w.beamAbove} options={[['yes', 'adv.o.yes'], ['no', 'adv.o.no'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('beamAbove', x)} />
        <Choice label={t('adv.q.services')} value={w.services} options={[['no', 'adv.o.no'], ['yes', 'adv.o.yes'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('services', x)} />
        <Choice label={t('adv.q.age')} value={w.age} options={[['new', 'adv.o.new'], ['mid', 'adv.o.mid'], ['old', 'adv.o.old']]} onChange={(x) => set('age', x)} />
        <Choice label={t('adv.q.opening')} value={w.opening} options={[['door', 'adv.o.door'], ['wide', 'adv.o.wide'], ['full', 'adv.o.full']]} onChange={(x) => set('opening', x)} />
        <button onClick={() => setDone(true)} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519]">{t('adv.checkWall')}</button>
      </div>
      {done && <Result v={v} cta={
        <Link href="/plan/wall-break" className="inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white hover:bg-[#C44519]">
          {t(v.level === 'green' ? 'adv.ctaQuote' : 'adv.ctaEngineer')} →
        </Link>} />}
    </div>
  );
}

function BathCheck() {
  const { t, lang } = useT();
  const { city } = useCity();
  const [b, setB] = useState<BathInput>({ floor: 'ground', drainFt: 15, below: 'none', shaft: 'unsure', ventilation: 'window' });
  const [done, setDone] = useState(false);
  const set = <K extends keyof BathInput>(k: K, v: BathInput[K]) => { setB((x) => ({ ...x, [k]: v })); setDone(false); };
  const v = useMemo(() => checkBathroom(b), [b]);
  const est = useMemo(() => estimate({ typeId: 'new-bathroom', city: city.id, area: 45, tier: 'standard', drainFt: b.drainFt || undefined }), [city.id, b.drainFt]);
  return (
    <div>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <Choice label={t('adv.q.floor')} value={b.floor} options={[['ground', 'adv.o.ground'], ['upper', 'adv.o.upper']]} onChange={(x) => set('floor', x)} />
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="adr">{t('adv.q.drain')}</label>
          <input id="adr" type="number" min={0} className="mt-1 w-40 rounded-xl border border-slate-300 px-3 py-2.5" value={b.drainFt || ''} onChange={(e) => set('drainFt', Number(e.target.value))} />
          <p className="text-xs text-slate-500">{t('adv.drainHint')}</p>
        </div>
        {b.floor === 'upper' && <Choice label={t('adv.q.below')} value={b.below} options={[['room', 'adv.o.room'], ['none', 'adv.o.no'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('below', x)} />}
        <Choice label={t('adv.q.shaft')} value={b.shaft} options={[['yes', 'adv.o.yes'], ['no', 'adv.o.no'], ['unsure', 'adv.o.unsure']]} onChange={(x) => set('shaft', x)} />
        <Choice label={t('adv.q.vent')} value={b.ventilation} options={[['window', 'adv.o.yes'], ['none', 'adv.o.no']]} onChange={(x) => set('ventilation', x)} />
        <button onClick={() => setDone(true)} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519]">{t('adv.checkBath')}</button>
      </div>
      {done && <Result v={v} cta={
        <div>
          <p className="mb-2 text-sm text-slate-800">{t('adv.cost', { city: cityName(city, lang), range: `${inrShort(est.low)} – ${inrShort(est.high)}`, days: est.days })}</p>
          <Link href={`/plan/new-bathroom?drain=${b.drainFt || 0}`} className="inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white hover:bg-[#C44519]">{t('adv.ctaBath')}</Link>
        </div>} />}
    </div>
  );
}

export default function Advisor() {
  const { t } = useT();
  const [tab, setTab] = useState<'wall' | 'bath'>('wall');
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('adv.title')}</h1>
      <p className="mt-1 text-slate-600">{t('adv.desc')}</p>
      <div className="mt-5 flex gap-2" role="tablist">
        {([['wall', 'adv.tabWall'], ['bath', 'adv.tabBath']] as const).map(([k, tk]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === k ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700'}`}>{t(tk)}</button>
        ))}
      </div>
      <div className="mt-5">{tab === 'wall' ? <WallCheck /> : <BathCheck />}</div>
    </div>
  );
}
