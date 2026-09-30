'use client';

import { useState } from 'react';
import { CITIES } from './cities';
import { PROJECT_TYPES } from './catalog';
import { DESIGN_STYLES, PARTNER_LIMITS, TRADES_FOR, type Partner, type PartnerKind } from './partners-shared';
import { cityName, typeTitle, useT } from './i18n';
import { styleName } from './catalog-hi';
import type { Key } from './messages';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200';
const label = 'block text-sm font-semibold text-slate-700';
const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? 'border-[#E05A2B] bg-orange-50 text-[#C44519]' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`;

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

// One form for both registering and editing a listing. `existing` locks the kind (crew/designer) once chosen.
export function PartnerForm({ existing, defaultName, onSaved }: { existing?: Partner | null; defaultName?: string; onSaved: (p: Partner) => void }) {
  const { t, te, lang } = useT();
  const [kind, setKind] = useState<PartnerKind>(existing?.kind ?? 'crew');
  const [name, setName] = useState(existing?.name ?? defaultName ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [locality, setLocality] = useState(existing?.locality ?? '');
  const [trades, setTrades] = useState<string[]>(existing?.trades ?? []);
  const [services, setServices] = useState<string[]>(existing?.services ?? []);
  const [styles, setStyles] = useState<string[]>(existing?.styles ?? []);
  const [dayRate, setDayRate] = useState(String(existing?.dayRate || ''));
  const [fee, setFee] = useState(String(existing?.feePerSqft || ''));
  const [crewSize, setCrewSize] = useState(String(existing?.crewSize ?? 2));
  const [years, setYears] = useState(String(existing?.years ?? ''));
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [available, setAvailable] = useState(existing?.available ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setSaved(false); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setSaved(false);
    try {
      const r = await fetch('/api/partner', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name, city, locality, trades, services, styles, dayRate, feePerSqft: fee, crewSize, years, bio, available }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not save');
      setSaved(true); onSaved(d.partner);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save'); } finally { setBusy(false); }
  }

  const tradeList = TRADES_FOR[kind] as readonly string[];
  const relevant = PROJECT_TYPES.filter((ty) => (kind === 'designer' ? ty.interiors : true));
  return (
    <form onSubmit={submit} className="space-y-5">
      {!existing && (
        <fieldset>
          <legend className={label}>{t('pt.iAm')}</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {(['crew', 'designer'] as const).map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setTrades([]); setServices([]); }}
                className={`rounded-xl border p-3 text-left ${kind === k ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                <div className="font-bold">{t(k === 'crew' ? 'pt.kindCrew' : 'pt.kindDesigner')}</div>
                <div className="text-xs text-slate-600">{t(k === 'crew' ? 'pt.kindCrewD' : 'pt.kindDesignerD')}</div>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="pname">{t('pt.name')}</label><input id="pname" className={field} value={name} maxLength={PARTNER_LIMITS.name} onChange={(e) => edit(setName)(e.target.value)} /></div>
        <div>
          <label className={label} htmlFor="pcity">{t('pt.city')}</label>
          <select id="pcity" className={field} value={city} onChange={(e) => edit(setCity)(e.target.value)}>
            <option value="">—</option>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{cityName(c, lang)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><label className={label} htmlFor="ploc">{t('pt.locality')}</label><input id="ploc" className={field} value={locality} maxLength={PARTNER_LIMITS.locality} onChange={(e) => edit(setLocality)(e.target.value)} /></div>
      </div>

      <fieldset>
        <legend className={label}>{t('pt.trades')}</legend>
        <p className="text-xs text-slate-500">{t('pt.tradesHint')}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {tradeList.map((tr) => <button key={tr} type="button" aria-pressed={trades.includes(tr)} onClick={() => edit(setTrades)(toggle(trades, tr))} className={chip(trades.includes(tr))}>{t(`trade.${tr}` as Key)}</button>)}
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>{t('pt.services')}</legend>
        <p className="text-xs text-slate-500">{t('pt.servicesHint')}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {relevant.map((ty) => <button key={ty.id} type="button" aria-pressed={services.includes(ty.id)} onClick={() => edit(setServices)(toggle(services, ty.id))} className={chip(services.includes(ty.id))}>{ty.emoji} {typeTitle(ty, lang)}</button>)}
        </div>
      </fieldset>

      {kind === 'designer' && (
        <fieldset>
          <legend className={label}>{t('pt.styles')}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {DESIGN_STYLES.map((s) => <button key={s} type="button" aria-pressed={styles.includes(s)} onClick={() => edit(setStyles)(toggle(styles, s))} className={chip(styles.includes(s))}>{styleName(s, lang)}</button>)}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {kind === 'crew' ? (
          <>
            <div><label className={label} htmlFor="prate">{t('pt.dayRate')}</label><input id="prate" type="number" inputMode="numeric" className={field} value={dayRate} onChange={(e) => edit(setDayRate)(e.target.value)} /></div>
            <div><label className={label} htmlFor="pcrew">{t('pt.crewSize')}</label><input id="pcrew" type="number" inputMode="numeric" className={field} value={crewSize} onChange={(e) => edit(setCrewSize)(e.target.value)} /></div>
          </>
        ) : (
          <div><label className={label} htmlFor="pfee">{t('pt.fee')}</label><input id="pfee" type="number" inputMode="numeric" className={field} value={fee} onChange={(e) => edit(setFee)(e.target.value)} /></div>
        )}
        <div><label className={label} htmlFor="pyears">{t('pt.years')}</label><input id="pyears" type="number" inputMode="numeric" className={field} value={years} onChange={(e) => edit(setYears)(e.target.value)} /></div>
      </div>
      {kind === 'crew' && <p className="-mt-3 text-xs text-slate-500">{t('pt.dayRateHint')}</p>}

      <div><label className={label} htmlFor="pbio">{t('pt.bio')}</label><textarea id="pbio" rows={3} maxLength={PARTNER_LIMITS.bio} className={field} value={bio} placeholder={t('pt.bioPh')} onChange={(e) => edit(setBio)(e.target.value)} /></div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={available} onChange={(e) => edit(setAvailable)(e.target.checked)} /> {t('pt.available')}</label>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{te(error)}</p>}
      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white hover:bg-[#C44519] disabled:opacity-60">{busy ? t('pt.registering') : existing ? t('pt.saveChanges') : t('pt.register')}</button>
        {saved && <span role="status" className="text-sm font-bold text-emerald-700">✔ {t('pt.saved')}</span>}
      </div>
    </form>
  );
}
