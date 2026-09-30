'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useCity } from '@/lib/city-context';
import { CitySelect } from '@/lib/CitySelect';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { STYLES, TIERS, estimate, getType, inr, inrShort, interiorBudgetGuide, type Tier } from '@/lib/catalog';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200';
const label = 'block text-sm font-semibold text-slate-700';
const FLAG = { green: 'border-emerald-200 bg-emerald-50 text-emerald-900', amber: 'border-amber-200 bg-amber-50 text-amber-900', red: 'border-red-200 bg-red-50 text-red-900' };

// Next 3 days, 10am and 3pm slots (local time).
function slots() {
  const out: { value: string; text: string }[] = [];
  for (let d = 1; d <= 3; d++) for (const h of [10, 15]) {
    const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
    out.push({ value: t.toISOString(), text: t.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) });
  }
  return out;
}

export default function Plan({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeId } = use(params);
  const found = getType(typeId);
  if (!found) notFound();
  const type = found; // narrowed once here so closures below (which TS can't narrow) see a defined type
  const router = useRouter();
  const slotOptions = useMemo(slots, []);

  const { city } = useCity();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [area, setArea] = useState(type.defaultArea);
  const [tier, setTier] = useState<Tier>('standard');
  const [drain, setDrain] = useState<number | ''>(type.askDrain ? 15 : '');
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState<string>('');
  const [valueLakh, setValueLakh] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState(slotOptions[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Prefill the site contact from the verified account once known (never overwrite what the user typed).
  useEffect(() => { if (user) {
      setName((n) => n || user.name); setPhone((p) => p || user.phone);
      const pv = user.profile?.propertyValueLakh; if (pv) setValueLakh((v) => v || pv);
    } }, [user]);

  const est = useMemo(
    () => estimate({ typeId, city: city.id, area: Number(area) || 0, tier, drainFt: drain === '' ? undefined : Number(drain) }),
    [typeId, city.id, area, tier, drain],
  );

  async function book() {
    if (type.interiors && !style) { setError('Pick a design style'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeId, city: city.id, area: Number(area), tier, drainFt: drain === '' ? undefined : Number(drain), notes, style: style || undefined, propertyValueLakh: valueLakh === '' ? undefined : valueLakh, name, phone, slot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not book');
      router.push(`/projects/${data.id}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  async function joinWaitlist() {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: city.id, name, phone, typeId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join waitlist');
      setJoined(true);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{type.emoji} {type.title}</h1>
      <p className="mt-1 text-slate-600">{type.tagline}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="font-extrabold text-slate-900">1. About the job</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={label}>City where the property is</span>
                <CitySelect className="mt-1" />
                <p className="mt-1 text-xs text-slate-500">{city.state} · {city.status === 'live' ? 'live' : 'coming soon'}</p>
              </div>
              <div>
                <label className={label} htmlFor="area">{type.areaLabel}</label>
                <input id="area" type="number" min={5} className={field} value={area} onChange={(e) => setArea(e.target.value === '' ? ('' as never) : Number(e.target.value))} />
              </div>
              {type.askDrain && (
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="drain">Distance from the new bathroom to the nearest drain / septic (ft)</label>
                  <input id="drain" type="number" min={0} className={field} value={drain} onChange={(e) => setDrain(e.target.value === '' ? '' : Number(e.target.value))} />
                  <p className="mt-1 text-xs text-slate-500">Not sure? Enter 0 — the expert will measure it during the visit.</p>
                </div>
              )}
            </div>
            {type.interiors && (
              <>
                <div>
                  <span className={label}>Design style</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {STYLES.map((st) => (
                      <button key={st} type="button" aria-pressed={style === st} onClick={() => setStyle(st)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${style === st ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>{st}</button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Not sure? Pick the closest — your designer will show options during the consultation.</p>
                </div>
                <div>
                  <label className={label} htmlFor="pv">Approx. property value (₹ lakh) <span className="font-normal text-slate-500">(optional)</span></label>
                  <input id="pv" type="number" min={1} className={field} value={valueLakh} onChange={(e) => setValueLakh(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 100 for ₹1 crore" />
                  {valueLakh !== '' && valueLakh > 0 && (() => { const g = interiorBudgetGuide(valueLakh); return (
                    <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">Interiors typically cost <b>{inrShort(g.low)} – {inrShort(g.high)}</b> for this property (8–12% of its value). Your estimate is on the right.</p>
                  ); })()}
                </div>
              </>
            )}
            <div>
              <span className={label}>Quality</span>
              <div className="mt-1 grid gap-2 sm:grid-cols-3">
                {(Object.keys(TIERS) as Tier[]).map((t) => (
                  <button key={t} type="button" onClick={() => setTier(t)}
                    className={`rounded-xl border p-3 text-left ${tier === t ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                    <div className="font-bold">{TIERS[t].label}</div>
                    <div className="text-xs text-slate-600">{TIERS[t].blurb}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label} htmlFor="notes">Anything the expert should know? (optional)</label>
              <textarea id="notes" rows={2} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 30-year-old house, ground floor, courtyard on the west side" />
            </div>
          </section>

          {city.status === 'soon' ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
              <h2 className="font-extrabold text-slate-900">2. We’re not live in {city.name} yet</h2>
              <p className="text-sm text-slate-700">Your estimate above is real. We’re registering verified crews in {city.name} — leave your number and we’ll message you the day we can run this project.</p>
              {joined ? <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-900">You’re on the {city.name} waitlist. We’ll be in touch.</p> : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={label} htmlFor="wname">Your name</label><input id="wname" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
                    <div><label className={label} htmlFor="wphone">Mobile number</label><input id="wphone" inputMode="numeric" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" autoComplete="tel" /></div>
                  </div>
                  {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
                  <button onClick={joinWaitlist} disabled={busy} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519] disabled:opacity-60">{busy ? 'Joining…' : `Join the ${city.name} waitlist`}</button>
                </>
              )}
            </section>
          ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="font-extrabold text-slate-900">2. Book a {type.visitLabel.toLowerCase()} — {inr(type.visitFee)}</h2>
            <p className="text-sm text-slate-600">
              {type.interiors ? 'A verified interior designer visits your home, understands how you live, and prepares your design and quote.' : type.needsEngineer ? 'A verified expert visits the site, measures it and issues a fixed quote.' : 'A verified expert visits your property, measures it and issues a fixed quote.'}
              You do not need to be present — share a contact who can open the door.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="name">Your name</label>
                <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={label} htmlFor="phone">Mobile number</label>
                <input id="phone" inputMode="numeric" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" autoComplete="tel" />
              </div>
            </div>
            <div>
              <span className={label}>Visit slot</span>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slotOptions.map((s) => (
                  <button key={s.value} type="button" onClick={() => setSlot(s.value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${slot === s.value ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>{s.text}</button>
                ))}
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
            {user ? (
              <button onClick={book} disabled={busy} className="w-full rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519] disabled:opacity-60 sm:w-auto">
                {busy ? 'Booking…' : `Book ${type.visitLabel.toLowerCase()} · ${inr(type.visitFee)}`}
              </button>
            ) : user === null ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-800">Verify your mobile number to book</p>
                <LoginForm defaultName={name} defaultPhone={phone} />
              </div>
            ) : null}
            <p className="text-xs text-slate-500">Fee is adjusted against your project if you go ahead. (Payment gateway not connected in this build.)</p>
          </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Instant estimate</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{inrShort(est.low)} – {inrShort(est.high)}</p>
            <p className="text-sm text-slate-600">about {est.days} working days · includes 15% contingency ({inr(est.contingency)})</p>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <div className="bg-[#E05A2B]" style={{ width: `${(est.labor / (est.labor + est.material)) * 100}%` }} />
              <div className="bg-slate-400 flex-1" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-600"><span>Labor {inr(est.labor)}</span><span>Material {inr(est.material)}</span></div>
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {est.phases.map((p, i) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span><span className="text-slate-400">{i + 1}.</span> {p.name} <span className="text-xs text-slate-500">· {p.days}d</span></span>
                  <span className="font-semibold whitespace-nowrap">{inr(p.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>
          {est.flags.map((f, i) => <div key={i} className={`rounded-xl border p-3 text-sm ${FLAG[f.level]}`}>{f.text}</div>)}
        </aside>
      </div>
    </div>
  );
}
