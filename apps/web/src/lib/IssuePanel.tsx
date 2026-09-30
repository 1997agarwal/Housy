'use client';

import { useCallback, useEffect, useState } from 'react';
import { ISSUE_TYPES, type IssueType } from './issues-shared';
import { useT } from './i18n';
import type { Key } from './messages';
import { phaseName } from './catalog';
import type { OwnerIssue } from './issues';
import type { Milestone } from './projects';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const STATUS = { open: 'bg-amber-100 text-amber-800', in_progress: 'bg-blue-100 text-blue-800', resolved: 'bg-emerald-100 text-emerald-800' } as const;

export function IssuePanel({ projectId, typeId, milestones }: { projectId: string; typeId: string; milestones: Milestone[] }) {
  const { t, te, lang } = useT();
  const mname = (m: Milestone) => phaseName(typeId, m.phaseId, m.name, lang === 'hi');
  const [issues, setIssues] = useState<OwnerIssue[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<IssueType>('quality');
  const [milestoneId, setMilestoneId] = useState('');
  const [description, setDescription] = useState('');
  const [reply, setReply] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { const r = await fetch(`/api/projects/${projectId}/issues`); if (r.ok) setIssues(await r.json()); }, [projectId]);
  useEffect(() => { load(); }, [load]);

  async function call(url: string, body: object, okMsg?: () => void) {
    setBusy(true); setError('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || t('issue.fail'));
      okMsg?.(); await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (issues === null) return null;
  const open = issues.filter((i) => i.status !== 'resolved').length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold">{t('issue.title')} {open > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{t('issue.nOpen', { n: open })}</span>}</h2>
        <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400" onClick={() => setShowForm((s) => !s)}>{showForm ? t('issue.close') : t('issue.report')}</button>
      </div>
      {issues.length === 0 && !showForm && <p className="mt-1 text-sm text-slate-600">{t('issue.intro')}</p>}

      {showForm && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">{t('issue.kind')}
              <select className={`${field} mt-1`} value={type} onChange={(e) => setType(e.target.value as IssueType)}>
                {Object.keys(ISSUE_TYPES).map((k) => <option key={k} value={k}>{t(`issue.${k}` as Key)}</option>)}
              </select></label>
            <label className="text-sm font-semibold text-slate-700">{t('issue.which')} <span className="font-normal text-slate-500">{t('issue.optional')}</span>
              <select className={`${field} mt-1`} value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
                <option value="">{t('issue.whole')}</option>
                {milestones.map((m, i) => <option key={m.id} value={m.id}>{i + 1}. {mname(m)}</option>)}
              </select></label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">{t('issue.what')}
            <textarea rows={3} maxLength={1000} className={`${field} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('issue.ph')} /></label>
          <button className={btn} disabled={busy || description.trim().length < 10}
            onClick={() => call(`/api/projects/${projectId}/issues`, { type, milestoneId: milestoneId || undefined, description }, () => { setDescription(''); setShowForm(false); })}>{t('issue.send')}</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{te(error)}</p>}

      <ul className="mt-3 space-y-3">
        {issues.map((i) => (
          <li key={i.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{t(`issue.${i.type}` as Key)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[i.status]}`}>{t(`issue.st.${i.status}` as Key)}</span>
              {i.escalated && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">{t('issue.escalated')}</span>}
              <span className="ml-auto text-xs text-slate-500">{i.id} · {new Date(i.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
            </div>
            {i.milestoneId && <p className="text-xs text-slate-500">{t('issue.step', { name: (() => { const m = milestones.find((x) => x.id === i.milestoneId); return m ? mname(m) : ''; })() })}</p>}
            <ul className="mt-2 space-y-1.5">
              {i.messages.map((m, k) => (
                <li key={k} className={`rounded-lg px-3 py-2 text-sm ${m.by === 'housy' ? 'bg-blue-50 text-blue-950' : 'bg-slate-50 text-slate-800'}`}>
                  <b>{m.by === 'housy' ? 'Housy' : t('issue.you')}:</b> {m.by === 'housy' ? te(m.text) : m.text}
                </li>
              ))}
            </ul>
            {i.status !== 'resolved' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <input className={`${field} flex-1`} placeholder={t('issue.addMsg')} value={reply[i.id] ?? ''} onChange={(e) => setReply((r) => ({ ...r, [i.id]: e.target.value }))} aria-label={t('issue.replyTo', { id: i.id })} />
                <button className={btn} disabled={busy || (reply[i.id] ?? '').trim().length < 2} onClick={() => call(`/api/issues/${i.id}`, { action: 'message', text: reply[i.id] }, () => setReply((r) => ({ ...r, [i.id]: '' })))}>{t('issue.msgSend')}</button>
                <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-slate-400" disabled={busy} onClick={() => call(`/api/issues/${i.id}`, { action: 'resolve' })}>{t('issue.resolve')}</button>
              </div>
            ) : (
              <button className="mt-2 text-sm font-bold text-[#E05A2B] hover:underline" disabled={busy} onClick={() => call(`/api/issues/${i.id}`, { action: 'reopen' })}>{t('issue.reopen')}</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
