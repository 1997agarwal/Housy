'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useCity } from '@/lib/city-context';
import { CitySelect } from '@/lib/CitySelect';
import { useAuth } from '@/lib/auth-context';
import { visitSlots } from '@/lib/slots';
import { cityName, typeArea, typeTagline, typeTitle, useT } from '@/lib/i18n';
import { LoginForm } from '@/lib/LoginForm';
import { STYLES, TIERS, estimate, getType, phaseName, inr, inrShort, interiorBudgetGuide, type Tier } from '@/lib/catalog';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200';
const label = 'block text-sm font-semibold text-slate-700';
const FLAG = { green: 'border-emerald-200 bg-emerald-50 text-emerald-900', amber: 'border-amber-200 bg-amber-50 text-amber-900', red: 'border-red-200 bg-red-50 text-red-900' };

export default function Plan({ params }: { params: Promise<{ type: string }> }) {
  const { type: typeId } = use(params);
  const found = getType(typeId);
  if (!found) notFound();
  const type = found; // narrowed once here so closures below (which TS can't narrow) see a defined type
  const router = useRouter();
  const { t, lang } = useT();
  const slotOptions = useMemo(() => visitSlots(lang === 'hi' ? 'hi-IN' : 'en-IN'), [lang]);

  const { city } = useCity();
  const { user } = useAuth();
  const what = t(type.visitLabel === 'Design consultation' ? 'visit.design' : type.visitLabel === 'Plot visit' ? 'visit.plot' : 'visit.site');
  const cName = cityName(city, lang);
  const [joined, setJoined] = useState(false);
  const [area, setArea] = useState(type.defaultArea);
  const [tier, setTier] = useState<Tier>('standard');
  const [drain, setDrain] = useState<number | ''>(type.askDrain ? 15 : '');
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState<string>('');
  const [rooms, setRooms] = useState<string[]>(() => type.rooms?.map((r) => r.id) ?? []);
  const [finishes, setFinishes] = useState<Record<string, string>>({});
  const [valueLakh, setValueLakh] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState(slotOptions[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Arriving from the advisor or the home plan: carry over the numbers they collected (validated, never trusted).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const d = Number(q.get('drain')), a = Number(q.get('area'));
    if (type.askDrain && d > 0 && d <= 500) setDrain(d);
    if (a >= 5 && a <= 20000) setArea(Math.round(a));                        // from the home plan
    const ids = (q.get('rooms') ?? '').split(',').filter((id) => type.rooms?.some((r) => r.id === id));
    if (type.rooms && ids.length > 0) setRooms([...new Set(ids)]);
  }, [type.askDrain, type.rooms]);

  // Prefill the site contact from the verified account once known (never overwrite what the user typed).
  useEffect(() => { if (user) {
      setName((n) => n || user.name); setPhone((p) => p || user.phone);
      const pv = user.profile?.propertyValueLakh; if (pv) setValueLakh((v) => v || pv);
    } }, [user]);

  const est = useMemo(
    () => estimate({ typeId, city: city.id, area: Number(area) || 0, tier, drainFt: drain === '' ? undefined : Number(drain), rooms: type.rooms ? rooms : undefined, finishes }),
    [typeId, city.id, area, tier, drain, rooms, finishes, type.rooms],
  );

  async function book() {
    if (type.interiors && !style) { setError('Pick a design style'); return; }
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeId, city: city.id, area: Number(area), tier, drainFt: drain === '' ? undefined : Number(drain), notes, style: style || undefined, rooms: type.rooms ? rooms : undefined, finishes: type.finishes ? finishes : undefined, propertyValueLakh: valueLakh === '' ? undefined : valueLakh, name, phone, slot }),
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
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{type.emoji} {typeTitle(type, lang)}</h1>
      <p className="mt-1 text-slate-600">{typeTagline(type, lang)}</p>
      {(type.id === 'wall-break' || type.id === 'new-bathroom') && (
        <p className="mt-2 text-sm"><Link href="/advisor" className="font-bold text-[#E05A2B]">{t('plan.feasibility')}</Link></p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="font-extrabold text-slate-900">{t('plan.about')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className={label}>{t('plan.city')}</span>
                <CitySelect className="mt-1" />
                <p className="mt-1 text-xs text-slate-500">{city.state} · {city.status === 'live' ? t('city.live') : t('city.soon')}</p>
              </div>
              <div>
                <label className={label} htmlFor="area">{typeArea(type, lang)}</label>
                <input id="area" type="number" min={5} className={field} value={area} onChange={(e) => setArea(e.target.value === '' ? ('' as never) : Number(e.target.value))} />
              </div>
              {type.askDrain && (
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="drain">{t('plan.drainQ')}</label>
                  <input id="drain" type="number" min={0} className={field} value={drain} onChange={(e) => setDrain(e.target.value === '' ? '' : Number(e.target.value))} />
                  <p className="mt-1 text-xs text-slate-500">{t('plan.drainHint')}</p>
                </div>
              )}
            </div>
            {type.interiors && (
              <>
                <div>
                  <span className={label}>{t('plan.style')}</span>
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
                  <input id="pv" type="number" min={1} className={field} value={valueLakh} onChange={(e) => setValueLakh(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t('plan.valuePh')} />
                  {valueLakh !== '' && valueLakh > 0 && (() => { const g = interiorBudgetGuide(valueLakh); return (
                    <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">Interiors typically cost <b>{inrShort(g.low)} – {inrShort(g.high)}</b> for this property (8–12% of its value). Your estimate is on the right.</p>
                  ); })()}
                </div>
              </>
            )}
            {type.rooms && (
              <div>
                <span className={label}>{t('plan.rooms')} <span className="font-normal text-slate-500">({t('plan.roomsCount', { n: rooms.length, total: type.rooms.length })})</span></span>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {type.rooms.map((r) => {
                    const on = rooms.includes(r.id);
                    const cost = est.rooms?.find((x) => x.id === r.id)?.cost;
                    return (
                      <button key={r.id} type="button" aria-pressed={on}
                        onClick={() => setRooms((cur) => (on ? (cur.length > 1 ? cur.filter((x) => x !== r.id) : cur) : [...cur, r.id]))}
                        className={`rounded-xl border p-3 text-left text-sm ${on ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'}`}>
                        <div className="font-bold">{on ? '✓ ' : ''}{r.name}</div>
                        <div className="text-xs">{on && cost ? `~${inrShort(cost)}` : 'Not included'}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-slate-500">Deselect rooms you don’t want designed now — the price updates instantly.</p>
              </div>
            )}
            {type.finishes?.map((f) => (
              <div key={f.id}>
                <label className={label} htmlFor={`fin-${f.id}`}>{f.label}</label>
                <select id={`fin-${f.id}`} className={field} value={finishes[f.id] ?? f.options[0].id} onChange={(e) => setFinishes((x) => ({ ...x, [f.id]: e.target.value }))}>
                  {f.options.map((o) => <option key={o.id} value={o.id}>{o.label}{o.mult > 1 ? ` · +${Math.round((o.mult - 1) * 100)}% on materials` : ''}</option>)}
                </select>
              </div>
            ))}
            <div>
              <span className={label}>{t('plan.quality')}</span>
              <div className="mt-1 grid gap-2 sm:grid-cols-3">
                {(Object.keys(TIERS) as Tier[]).map((k) => (
                  <button key={k} type="button" aria-pressed={tier === k} onClick={() => setTier(k)}
                    className={`rounded-xl border p-3 text-left ${tier === k ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                    <div className="font-bold">{t(`tier.${k}` as const)}</div>
                    <div className="text-xs text-slate-600">{t(`tier.${k}.d` as const)}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={label} htmlFor="notes">{t('plan.notes')} {t('onb.optional')}</label>
              <textarea id="notes" rows={2} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('plan.notesPh')} />
            </div>
          </section>

          {city.status === 'soon' ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
              <h2 className="font-extrabold text-slate-900">2. {t('plan.notLive', { city: cName })}</h2>
              <p className="text-sm text-slate-700">{t('plan.waitDesc', { city: cName })}</p>
              {joined ? <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-900">{t('plan.joined', { city: cName })}</p> : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={label} htmlFor="wname">{t('plan.yourName')}</label><input id="wname" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
                    <div><label className={label} htmlFor="wphone">{t('plan.mobile')}</label><input id="wphone" inputMode="numeric" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('login.phonePh')} autoComplete="tel" /></div>
                  </div>
                  {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
                  <button onClick={joinWaitlist} disabled={busy} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519] disabled:opacity-60">{busy ? t('plan.booking') : t('plan.join', { city: cName })}</button>
                </>
              )}
            </section>
          ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="font-extrabold text-slate-900">{t('plan.book', { what, fee: inr(type.visitFee) })}</h2>
            <p className="text-sm text-slate-600">
              {type.interiors ? t('plan.visitDesc.design') : t('plan.visitDesc.site')} {t('plan.notPresent')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="name">{t('plan.yourName')}</label>
                <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={label} htmlFor="phone">{t('plan.mobile')}</label>
                <input id="phone" inputMode="numeric" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('login.phonePh')} autoComplete="tel" />
              </div>
            </div>
            <div>
              <span className={label}>{t('plan.slot')}</span>
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
                {busy ? t('plan.booking') : t('plan.bookBtn', { what, fee: inr(type.visitFee) })}
              </button>
            ) : user === null ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-800">{t('plan.verify')}</p>
                <LoginForm defaultName={name} defaultPhone={phone} />
              </div>
            ) : null}
            <p className="text-xs text-slate-500">{t('plan.feeNote')}</p>
          </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('plan.instant')}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{inrShort(est.low)} – {inrShort(est.high)}</p>
            <p className="text-sm text-slate-600">{t('plan.days', { days: est.days, amount: inr(est.contingency) })}</p>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <div className="bg-[#E05A2B]" style={{ width: `${(est.labor / (est.labor + est.material)) * 100}%` }} />
              <div className="bg-slate-400 flex-1" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-600"><span>{t('plan.labor')} {inr(est.labor)}</span><span>{t('plan.material')} {inr(est.material)}</span></div>
            {est.rooms && <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('plan.byPhase')}</p>}
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {est.phases.map((p, i) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span><span className="text-slate-400">{i + 1}.</span> {phaseName(typeId, p.id, p.name, lang === 'hi')} <span className="text-xs text-slate-500">· {p.days}{lang === 'hi' ? ' दिन' : 'd'}</span></span>
                  <span className="font-semibold whitespace-nowrap">{inr(p.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>
          {est.flags.map((f, i) => <div key={i} className={`rounded-xl border p-3 text-sm ${FLAG[f.level]}`}>{lang === 'hi' && f.textHi ? f.textHi : f.text}</div>)}
        </aside>
      </div>
    </div>
  );
}
