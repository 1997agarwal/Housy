'use client';

import { useCallback, useEffect, useState } from 'react';
import { CRITERIA, type Criterion } from './reviews-shared';
import type { Pro } from './pros';
import type { PublicReview } from './reviews';
import { useT } from './i18n';
import type { Key } from './messages';

const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const { t } = useT();
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={t(n > 1 ? 'rev.stars' : 'rev.star', { n })} onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= value ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'}`}>★</button>
      ))}
    </div>
  );
}

function ReviewForm({ projectId, pro, onDone }: { projectId: string; pro: Pro; onDone: () => void }) {
  const { t, te } = useT();
  const [ratings, setRatings] = useState<Partial<Record<Criterion, number>>>({});
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const complete = (Object.keys(CRITERIA) as Criterion[]).every((k) => ratings[k]);
  async function submit() {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/projects/${projectId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proId: pro.id, ratings, text }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || t('rev.saveFail'));
      onDone();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="mt-3 space-y-3">
      {(Object.keys(CRITERIA) as Criterion[]).map((k) => (
        <div key={k} className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-700">{t(`crit.${k}` as Key)}</span>
          <Stars value={ratings[k] ?? 0} label={t(`crit.${k}` as Key)} onChange={(n) => setRatings((r) => ({ ...r, [k]: n }))} /></div>
      ))}
      <textarea rows={2} maxLength={600} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder={t('rev.placeholder')} value={text} onChange={(e) => setText(e.target.value)} aria-label={t('rev.for', { name: pro.name })} />
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{te(error)}</p>}
      <button className={btn} disabled={busy || !complete} onClick={submit}>{busy ? t('rev.saving') : t('rev.submit')}</button>
    </div>
  );
}

export function ReviewPanel({ projectId }: { projectId: string }) {
  const { t, lang } = useT();
  const [data, setData] = useState<{ canReview: boolean; pros: Pro[]; reviews: PublicReview[] } | null>(null);
  const load = useCallback(async () => { const r = await fetch(`/api/projects/${projectId}/reviews`); if (r.ok) setData(await r.json()); }, [projectId]);
  useEffect(() => { load(); }, [load]);
  if (!data?.canReview) return null;
  const done = data.reviews.length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-extrabold">{t('rev.title')}</h2>
      <p className="text-sm text-slate-600">{t('rev.desc', { done, total: data.pros.length })}</p>
      <ul className="mt-3 space-y-3">
        {data.pros.map((pro) => {
          const mine = data.reviews.find((r) => r.proId === pro.id);
          return (
            <li key={pro.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold">{pro.name} <span className="font-normal text-slate-600">· {lang === 'hi' ? t(`trade.${pro.trade}` as Key) : pro.role}</span></p>
              {mine ? (
                <p className="mt-1 text-sm text-emerald-800">{t('rev.mine', { n: mine.overall })}{mine.text ? ` — “${mine.text}”` : ''}</p>
              ) : <ReviewForm projectId={projectId} pro={pro} onDone={load} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
