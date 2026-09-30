'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DISCLAIMER, checkBathroom, checkWall, type BathInput, type Level, type Verdict, type WallInput } from '@/lib/advisor';
import { estimate, inrShort } from '@/lib/catalog';
import { useCity } from '@/lib/city-context';

const LEVEL_STYLE: Record<Level, { box: string; chip: string; label: string; icon: string }> = {
  green: { box: 'border-emerald-300 bg-emerald-50', chip: 'bg-emerald-600', label: 'GREEN', icon: '✅' },
  amber: { box: 'border-amber-300 bg-amber-50', chip: 'bg-amber-500', label: 'AMBER', icon: '⚠️' },
  red: { box: 'border-red-300 bg-red-50', chip: 'bg-red-600', label: 'RED', icon: '🛑' },
};

function Choice<T extends string>({ label, value, options, onChange, hint }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void; hint?: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${value === v ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'} ${v === ('unsure' as T) ? 'italic' : ''}`}>{text}</button>
        ))}
      </div>
    </fieldset>
  );
}

function Result({ v, cta }: { v: Verdict; cta: React.ReactNode }) {
  const s = LEVEL_STYLE[v.level];
  return (
    <div className={`mt-6 rounded-2xl border-2 p-5 ${s.box}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2 py-1 text-xs font-black tracking-widest text-white ${s.chip}`}>{s.label}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{s.icon} {v.headline}</h2>
      </div>
      <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Why</h3>
      <ul className="mt-1 space-y-1 text-sm text-slate-800">
        {v.reasons.map((r, i) => <li key={i}>{LEVEL_STYLE[r.level].icon} {r.text}</li>)}
      </ul>
      <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">What to do next</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-800">{v.steps.map((t, i) => <li key={i}>{t}</li>)}</ol>
      <div className="mt-5">{cta}</div>
      <p className="mt-4 text-xs text-slate-600">{DISCLAIMER}</p>
    </div>
  );
}

function WallCheck() {
  const [w, setW] = useState<WallInput>({ construction: 'unsure', position: 'interior', thickness: 'unsure', above: 'unsure', beamAbove: 'unsure', services: 'unsure', age: 'mid', opening: 'door' });
  const [done, setDone] = useState(false);
  const set = <K extends keyof WallInput>(k: K, v: WallInput[K]) => { setW((x) => ({ ...x, [k]: v })); setDone(false); };
  const v = useMemo(() => checkWall(w), [w]);
  return (
    <div>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <Choice label="How is your house built?" hint="Old houses with thick brick walls are usually load-bearing. Newer buildings have concrete columns & beams (RCC)." value={w.construction}
          options={[['rcc', 'Concrete columns & beams (RCC)'], ['masonry', 'Thick brick walls hold it up'], ['unsure', 'Not sure']]} onChange={(x) => set('construction', x)} />
        <Choice label="Which wall?" value={w.position} options={[['interior', 'Inside wall'], ['exterior', 'Outer wall']]} onChange={(x) => set('position', x)} />
        <Choice label="How thick is it?" hint="Half a brick ≈ 4.5 in (a hand-width) · one brick ≈ 9 in." value={w.thickness}
          options={[['partition', '4.5 in'], ['brick9', '9 in'], ['thick', 'More than 9 in'], ['unsure', 'Not sure']]} onChange={(x) => set('thickness', x)} />
        <Choice label="What is directly above it?" value={w.above} options={[['floor', 'Another floor / room'], ['roof', 'Only the roof or terrace'], ['unsure', 'Not sure']]} onChange={(x) => set('above', x)} />
        <Choice label="Is there a visible beam along the ceiling above this wall?" value={w.beamAbove} options={[['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]} onChange={(x) => set('beamAbove', x)} />
        <Choice label="Any pipes, wires or gas line inside the wall?" value={w.services} options={[['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']]} onChange={(x) => set('services', x)} />
        <Choice label="How old is the building?" value={w.age} options={[['new', 'Under 10 years'], ['mid', '10–30 years'], ['old', '30+ years']]} onChange={(x) => set('age', x)} />
        <Choice label="What do you want to do?" value={w.opening} options={[['door', 'Add a door-size opening'], ['wide', 'Make a wide opening'], ['full', 'Remove the whole wall']]} onChange={(x) => set('opening', x)} />
        <button onClick={() => setDone(true)} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519]">Check this wall</button>
      </div>
      {done && <Result v={v} cta={
        <Link href="/plan/wall-break" className="inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white hover:bg-[#C44519]">
          {v.level === 'green' ? 'Get a fixed quote' : 'Book an engineer-led wall project'} →
        </Link>} />}
    </div>
  );
}

function BathCheck() {
  const { city } = useCity();
  const [b, setB] = useState<BathInput>({ floor: 'ground', drainFt: 15, below: 'none', shaft: 'unsure', ventilation: 'window' });
  const [done, setDone] = useState(false);
  const set = <K extends keyof BathInput>(k: K, v: BathInput[K]) => { setB((x) => ({ ...x, [k]: v })); setDone(false); };
  const v = useMemo(() => checkBathroom(b), [b]);
  const est = useMemo(() => estimate({ typeId: 'new-bathroom', city: city.id, area: 45, tier: 'standard', drainFt: b.drainFt || undefined }), [city.id, b.drainFt]);
  return (
    <div>
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <Choice label="Which floor will the new bathroom be on?" value={b.floor} options={[['ground', 'Ground floor'], ['upper', 'Upper floor']]} onChange={(x) => set('floor', x)} />
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="adr">Distance from the new bathroom to the nearest drain / septic (ft)</label>
          <input id="adr" type="number" min={0} className="mt-1 w-40 rounded-xl border border-slate-300 px-3 py-2.5" value={b.drainFt || ''} onChange={(e) => set('drainFt', Number(e.target.value))} />
          <p className="text-xs text-slate-500">Not sure? Leave it empty — we’ll flag it and the expert will measure it.</p>
        </div>
        {b.floor === 'upper' && <Choice label="Is there a room directly below the new bathroom?" value={b.below} options={[['room', 'Yes, a room'], ['none', 'No'], ['unsure', 'Not sure']]} onChange={(x) => set('below', x)} />}
        <Choice label="Is there an existing bathroom / plumbing shaft within about 10 ft?" value={b.shaft} options={[['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]} onChange={(x) => set('shaft', x)} />
        <Choice label="Can it have a window or an outside wall for ventilation?" value={b.ventilation} options={[['window', 'Yes'], ['none', 'No']]} onChange={(x) => set('ventilation', x)} />
        <button onClick={() => setDone(true)} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519]">Check feasibility</button>
      </div>
      {done && <Result v={v} cta={
        <div>
          <p className="mb-2 text-sm text-slate-800">Typical cost in {city.name} for a 45 sq ft bathroom (standard finish): <b>{inrShort(est.low)} – {inrShort(est.high)}</b>, about {est.days} days.</p>
          <Link href={`/plan/new-bathroom?drain=${b.drainFt || 0}`} className="inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white hover:bg-[#C44519]">Plan this bathroom →</Link>
        </div>} />}
    </div>
  );
}

export default function Advisor() {
  const [tab, setTab] = useState<'wall' | 'bath'>('wall');
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Ask Housy before you break anything</h1>
      <p className="mt-1 text-slate-600">Answer a few questions and get a clear <b>green / amber / red</b> signal — before you spend money or start swinging a hammer.</p>
      <div className="mt-5 flex gap-2" role="tablist">
        {([['wall', '🧱 Can I break this wall?'], ['bath', '🚿 Can I add a bathroom?']] as const).map(([k, t]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${tab === k ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700'}`}>{t}</button>
        ))}
      </div>
      <div className="mt-5">{tab === 'wall' ? <WallCheck /> : <BathCheck />}</div>
    </div>
  );
}
