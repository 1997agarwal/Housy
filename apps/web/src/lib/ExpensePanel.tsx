'use client';

import { useMemo, useState } from 'react';
import { EXPENSE_CATEGORIES, PAY_METHODS, expensesCsv, summarize, type ExpenseCategory, type PayMethod } from './expenses-shared';
import { inr } from './catalog';
import { todayIST } from './time';
import type { Project } from './projects';
import { useT } from './i18n';
import type { Key } from './messages';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const BAR = { none: 'bg-slate-400', ok: 'bg-emerald-500', watch: 'bg-amber-500', over: 'bg-red-600' } as const;

export function ExpensePanel({ p, send, busy }: { p: Project; send: (body: object) => Promise<boolean>; busy: boolean }) {
  const { t } = useT();
  const catLabel = (k: string) => (k === 'housy' ? t('exp.viaHousy') : t(`exp.cat.${k}` as Key));
  const expenses = useMemo(() => p.expenses ?? [], [p.expenses]);
  const s = useMemo(() => summarize({ budget: p.budget, paid: p.paid, quoteTotal: p.quote?.total, accepted: p.quote?.accepted, expenses }), [p.budget, p.paid, p.quote, expenses]);
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('materials');
  const [method, setMethod] = useState<PayMethod>('upi');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIST());
  const [note, setNote] = useState('');
  const max = Math.max(1, ...s.categories.map((c) => c.amount));

  function download() {
    const url = URL.createObjectURL(new Blob([expensesCsv(expenses)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `housy-expenses-${p.id}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-extrabold">{t('exp.title')}</h2>
      <p className="text-sm text-slate-600">{t('exp.intro')}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{t('exp.spent')}</p><p className="text-xl font-black">{inr(s.spentSoFar)}</p><p className="text-xs text-slate-500">{t('exp.spentSplit', { a: inr(s.housyPaid), b: inr(s.ownSpent) })}</p></div>
        <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{t('exp.heading')}</p><p className="text-xl font-black">{inr(s.projected)}</p><p className="text-xs text-slate-500">{t('exp.headingSplit', { a: inr(s.housyCommitted), b: inr(s.ownSpent) })}</p></div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">{t('exp.budget')}</p>
          {s.budget ? (
            <>
              <p className="text-xl font-black">{inr(s.budget)}</p>
              <p className={`text-xs font-bold ${s.status === 'over' ? 'text-red-700' : s.status === 'watch' ? 'text-amber-700' : 'text-emerald-700'}`}>
                {s.status === 'over' ? t('exp.over', { amt: inr(-s.remaining!) }) : t('exp.left', { amt: inr(s.remaining!) })}
              </p>
              <button className="text-xs font-bold text-slate-500 hover:underline" disabled={busy} onClick={() => send({ action: 'set_budget', budget: null })}>{t('exp.remove')}</button>
            </>
          ) : (
            <div className="mt-1 flex gap-1">
              <input type="number" min={1000} className={field} placeholder={t('exp.budgetPh')} value={budget} onChange={(e) => setBudget(e.target.value)} aria-label={t('exp.budgetLabel')} />
              <button className="rounded-lg border border-slate-300 px-2 text-xs font-bold" disabled={busy || !(Number(budget) >= 1000)} onClick={async () => { if (await send({ action: 'set_budget', budget: Number(budget) })) setBudget(''); }}>{t('exp.set')}</button>
            </div>
          )}
        </div>
      </div>

      {s.budget && (
        <div className="mt-3" role="progressbar" aria-valuenow={Math.min(100, s.pctOfBudget ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label={t('exp.progress')}>
          <div className="h-2.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${BAR[s.status]}`} style={{ width: `${Math.min(100, s.pctOfBudget ?? 0)}%` }} /></div>
          <p className="mt-1 text-xs text-slate-600">{t('exp.pct', { n: s.pctOfBudget ?? 0 })}{s.status === 'watch' ? t('exp.pctWatch') : s.status === 'over' ? t('exp.pctOver') : ''}</p>
        </div>
      )}

      {s.categories.length > 0 && (
        <ul className="mt-4 space-y-1.5" aria-label={t('exp.byCat')}>
          {s.categories.map((c) => (
            <li key={c.key} className="text-sm"><div className="flex justify-between"><span>{catLabel(c.key)}</span><b>{inr(c.amount)}</b></div>
              <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#E05A2B]" style={{ width: `${(c.amount / max) * 100}%` }} /></div></li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-bold text-slate-800">{t('exp.log')}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">{t('exp.category')}<select className={field} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>{Object.keys(EXPENSE_CATEGORIES).map((k) => <option key={k} value={k}>{t(`exp.cat.${k}` as Key)}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">{t('exp.amount')}<input type="number" min={1} className={field} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">{t('exp.date')}<input type="date" max={todayIST()} className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-600">{t('exp.paidBy')}<select className={field} value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>{Object.keys(PAY_METHODS).map((k) => <option key={k} value={k}>{t(`exp.pay.${k}` as Key)}</option>)}</select></label>
        </div>
        <div className="mt-2 flex gap-2">
          <input className={`${field} flex-1`} maxLength={120} placeholder={t('exp.notePh')} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t('exp.noteLabel')} />
          <button className={btn} disabled={busy || !(Number(amount) >= 1)} onClick={async () => { if (await send({ action: 'add_expense', category, amount: Number(amount), date, method, note })) { setAmount(''); setNote(''); } }}>{t('exp.add')}</button>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between"><p className="text-sm font-bold">{t('exp.yours', { n: expenses.length })}</p><button className="text-sm font-bold text-[#E05A2B] hover:underline" onClick={download}>{t('exp.csv')}</button></div>
          <ul className="mt-1 divide-y divide-slate-100 text-sm">
            {[...expenses].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <span><b>{inr(e.amount)}</b> · {t(`exp.cat.${e.category}` as Key)} <span className="text-slate-500">· {e.date} · {t(`exp.pay.${e.method}` as Key)}{e.note ? ` · ${e.note}` : ''}</span></span>
                <button className="text-xs font-bold text-red-700 hover:underline" disabled={busy} onClick={() => send({ action: 'delete_expense', expenseId: e.id })} aria-label={t('exp.deleteLabel', { name: e.note || t(`exp.cat.${e.category}` as Key) })}>{t('exp.delete')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
