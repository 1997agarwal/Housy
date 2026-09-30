'use client';

import { useState } from 'react';
import { CHANGE_TRADES } from './limits';
import { TRADE_LABEL } from './pros';
import { inr } from './catalog';
import type { Project } from './projects';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const STATUS = { requested: ['Waiting for a price', 'bg-amber-100 text-amber-800'], quoted: ['Price ready — your call', 'bg-blue-100 text-blue-800'], approved: ['Approved', 'bg-emerald-100 text-emerald-800'], declined: ['Declined', 'bg-slate-100 text-slate-600'] } as const;

export function ChangePanel({ p, send, busy }: { p: Project; send: (body: object) => Promise<void>; busy: boolean }) {
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
        <h2 className="font-extrabold">Scope changes</h2>
        {p.status === 'active' && <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400" onClick={() => setShow((s) => !s)}>{show ? 'Close' : 'Request a change'}</button>}
      </div>
      <p className="mt-1 text-sm text-slate-600">Your price is fixed. If you want something extra, it’s agreed in writing here — priced first, added only when you approve.</p>

      {show && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="block text-sm font-semibold text-slate-700">What do you want?
            <input className={`${field} mt-1`} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Extra socket for the geyser" /></label>
          <label className="block text-sm font-semibold text-slate-700">Details
            <textarea rows={2} maxLength={500} className={`${field} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Where, how many, any preferences" /></label>
          <label className="block text-sm font-semibold text-slate-700">Who should do it?
            <select className={`${field} mt-1`} value={trade} onChange={(e) => setTrade(e.target.value)}>
              {CHANGE_TRADES.map((t) => <option key={t} value={t}>{TRADE_LABEL[t]}</option>)}
            </select></label>
          <button className={btn} disabled={busy || title.trim().length < 3 || description.trim().length < 10}
            onClick={async () => { await send({ action: 'request_change', title, description, trade }); setTitle(''); setDescription(''); setShow(false); }}>Ask for a price</button>
        </div>
      )}

      <ul className="mt-3 space-y-3">
        {changes.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{c.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
              {c.amount !== undefined && <span className="ml-auto font-bold">{c.status === 'declined' ? '' : '+'}{inr(c.amount)}{c.days ? ` · ~${c.days}d` : ''}</span>}
            </div>
            <p className="text-sm text-slate-600">{c.description} <span className="text-slate-500">· {TRADE_LABEL[c.trade]}</span></p>
            {c.status === 'requested' && (
              <div className="mt-2 rounded-lg border border-dashed border-slate-300 p-2">
                <p className="text-xs font-bold uppercase text-slate-500">Demo control · expert app</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input type="number" min={500} className={`${field} w-36`} placeholder="Price (₹)" value={price[c.id] ?? ''} onChange={(e) => setPrice((x) => ({ ...x, [c.id]: e.target.value }))} aria-label={`Price for ${c.title}`} />
                  <button className={btn} disabled={busy || !(Number(price[c.id]) >= 500)} onClick={() => send({ action: 'price_change', changeId: c.id, amount: Number(price[c.id]), days: 1 })}>Set price</button>
                </div>
              </div>
            )}
            {(c.status === 'requested' || c.status === 'quoted') && p.status === 'active' && (
              <div className="mt-2 flex flex-wrap gap-3">
                {c.status === 'quoted' && <button className={btn} disabled={busy} onClick={() => send({ action: 'approve_change', changeId: c.id })}>Approve +{inr(c.amount ?? 0)}</button>}
                <button className="text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={() => send({ action: 'decline_change', changeId: c.id })}>Decline</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
