'use client';

import { useState } from 'react';
import { CHANGE_TRADES } from './limits';
import { useT } from './i18n';
import type { Key } from './messages';
import { inr } from './catalog';
import type { Project } from './projects';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const STATUS = { requested: 'bg-amber-100 text-amber-800', quoted: 'bg-blue-100 text-blue-800', approved: 'bg-emerald-100 text-emerald-800', declined: 'bg-slate-100 text-slate-600' } as const;

export function ChangePanel({ p, send, busy }: { p: Project; send: (body: object) => Promise<boolean>; busy: boolean }) {
  const { t } = useT();
  const changes = p.changes ?? [];
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trade, setTrade] = useState<string>(CHANGE_TRADES[0]);
  const [price, setPrice] = useState<Record<string, string>>({});
  if (p.status !== 'active' && changes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold">{t('chg.title')}</h2>
        {p.status === 'active' && <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400" onClick={() => setShow((s) => !s)}>{show ? t('issue.close') : t('chg.request')}</button>}
      </div>
      <p className="mt-1 text-sm text-slate-600">{t('chg.intro')}</p>

      {show && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-sm font-semibold text-slate-700">{t('chg.what')}
            <input className={`${field} mt-1`} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('chg.whatPh')} /></label>
          <label className="block text-sm font-semibold text-slate-700">{t('chg.details')}
            <textarea rows={2} maxLength={500} className={`${field} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('chg.detailsPh')} /></label>
          <label className="block text-sm font-semibold text-slate-700">{t('chg.who')}
            <select className={`${field} mt-1`} value={trade} onChange={(e) => setTrade(e.target.value)}>
              {CHANGE_TRADES.map((tr) => <option key={tr} value={tr}>{t(`trade.${tr}` as Key)}</option>)}
            </select></label>
          <button className={btn} disabled={busy || title.trim().length < 3 || description.trim().length < 10}
            onClick={async () => { if (await send({ action: 'request_change', title, description, trade })) { setTitle(''); setDescription(''); setShow(false); } }}>{t('chg.ask')}</button>
        </div>
      )}

      <ul className="mt-3 space-y-3">
        {changes.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{c.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[c.status]}`}>{t(`chg.st.${c.status}` as Key)}</span>
              {c.amount !== undefined && <span className="ml-auto font-bold">{c.status === 'declined' ? '' : '+'}{inr(c.amount)}{c.days ? ` · ${t('chg.days', { n: c.days })}` : ''}</span>}
            </div>
            <p className="text-sm text-slate-600">{c.description} <span className="text-slate-500">· {t(`trade.${c.trade}` as Key)}</span></p>
            {c.status === 'requested' && (
              <div className="mt-2 rounded-lg border border-dashed border-slate-300 p-2">
                <p className="text-xs font-bold uppercase text-slate-500">{t('chg.demo')}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input type="number" min={500} className={`${field} w-36`} placeholder={t('chg.pricePh')} value={price[c.id] ?? ''} onChange={(e) => setPrice((x) => ({ ...x, [c.id]: e.target.value }))} aria-label={t('chg.priceFor', { title: c.title })} />
                  <button className={btn} disabled={busy || !(Number(price[c.id]) >= 500)} onClick={() => send({ action: 'price_change', changeId: c.id, amount: Number(price[c.id]), days: 1 })}>{t('chg.setPrice')}</button>
                </div>
              </div>
            )}
            {(c.status === 'requested' || c.status === 'quoted') && p.status === 'active' && (
              <div className="mt-2 flex flex-wrap gap-3">
                {c.status === 'quoted' && <button className={btn} disabled={busy} onClick={() => send({ action: 'approve_change', changeId: c.id })}>{t('chg.approve', { amt: inr(c.amount ?? 0) })}</button>}
                <button className="text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={() => send({ action: 'decline_change', changeId: c.id })}>{t('chg.decline')}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
