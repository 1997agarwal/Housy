'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getType, inr, phaseName } from '@/lib/catalog';
import { cityName, typeArea, typeTitle, useT } from '@/lib/i18n';
import type { Key } from '@/lib/messages';
import { finishLabel, optionLabel, roomName, styleName } from '@/lib/catalog-hi';
import { visitSlots } from '@/lib/slots';
import { formatIST } from '@/lib/time';
import { cityOrDefault } from '@/lib/cities';
import type { Milestone, Project } from '@/lib/projects';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { PhotoStrip, PhotoUploader } from '@/lib/MilestonePhotos';
import { ReviewPanel } from '@/lib/ReviewPanel';
import { IssuePanel } from '@/lib/IssuePanel';
import { ChangePanel } from '@/lib/ChangePanel';
import { ExpensePanel } from '@/lib/ExpensePanel';
import { ChatPanel } from '@/lib/ChatPanel';
import { MAX_PHOTOS_PER_MILESTONE, MAX_REVISIONS } from '@/lib/limits';

const STAGE_IDX = { visit_scheduled: 0, quote_ready: 1, active: 2, completed: 3, cancelled: -1 } as const;
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const MS_STYLE: Record<Milestone['status'], string> = {
  upcoming: 'bg-slate-100 text-slate-600', in_progress: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800', paid: 'bg-emerald-100 text-emerald-800',
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  const { user } = useAuth();
  const { t, lang, te } = useT();
  const loc = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const [mArea, setMArea] = useState('');
  const [mDrain, setMDrain] = useState('');
  const [mNote, setMNote] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [changing, setChanging] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/projects/${id}`).then(async (r) => {
      if (r.status === 404) setMissing(true); else if (r.ok) setP(await r.json()); else setError('Could not load project');
    }).catch(() => setError('Could not load project'));
  }, [id, user]);

  // Resolves true only if the action succeeded, so forms clear their inputs on success and KEEP them on failure.
  const send = useCallback(async (body: object): Promise<boolean> => {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/projects/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Action failed — please try again');
      setP(d);
      return true;
    } catch (e) { setError((e as Error).message === 'Failed to fetch' ? 'Could not reach Housy — check your connection and try again' : (e as Error).message); return false; } finally { setBusy(false); }
  }, [id]);

  const reload = useCallback(async () => { const r = await fetch(`/api/projects/${id}`); if (r.ok) setP(await r.json()); }, [id]);

  if (user === undefined) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">{t('common.loading')}</div>;
  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">{t('pj.loginTitle')}</h1>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><LoginForm /></div>
    </div>
  );
  if (missing) return <div className="mx-auto max-w-5xl px-4 py-16 text-center"><p className="font-bold">{t('pj.notFound')}</p><Link href="/projects" className="text-[#E05A2B] font-bold">{t('pj.myProjects')}</Link></div>;
  if (!p) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">{error ? te(error) : t('common.loading')}</div>;

  const type = getType(p.typeId)!;
  const STAGES = [t(type.interiors ? 'pj.stageDesign' : 'pj.stageVisit'), t('pj.stageQuote'), t(type.category === 'build' ? 'pj.stageBuild' : 'pj.stageWork'), t('pj.stageDone')];
  const stage = STAGE_IDX[p.status];
  const cancelled = p.status === 'cancelled';
  const isDesign = (m: Milestone) => !!type.interiors && m.phaseId === 'design';
  const cancel = () => { if (window.confirm(t('pj.confirmCancel'))) send({ action: 'cancel' }); };
  const total = p.quote?.total ?? p.estimate.total;
  const pct = Math.min(100, Math.round((p.paid / total) * 100));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.id} · {cityName(cityOrDefault(p.city), lang)}{p.style ? t('pj.styleSuffix', { style: styleName(p.style, lang) }) : ''}</p>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{type.emoji} {typeTitle(type, lang)}</h1>

      {cancelled ? (
        <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{t('pj.cancelled')}{p.cancelReason ? ` — ${te(p.cancelReason)}` : ''}. <Link href="/#services" className="text-[#E05A2B]">{t('pj.planNew')}</Link></p>
      ) : (
      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label={t('pj.stageLabel')}>
        {STAGES.map((s, i) => (
          <li key={s} className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${i < stage || p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : i === stage ? 'bg-[#E05A2B] text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</li>
        ))}
      </ol>
      )}
      {error && <p role="alert" className="sticky top-16 z-10 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 shadow-sm">{te(error)}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {(p.rooms || p.finishes) && type.rooms && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">{t('pj.scope')}</h2>
              <p className="mt-2 text-sm text-slate-700"><b>{t('pj.rooms')}</b> {(p.estimate.rooms ?? []).map((r) => roomName(r.id, r.name, lang)).join(', ')}</p>
              {type.finishes?.map((f) => <p key={f.id} className="text-sm text-slate-700"><b>{finishLabel(f.id, f.label, lang)}:</b> {(() => { const o = f.options.find((x) => x.id === (p.finishes?.[f.id] ?? f.options[0].id)); return o ? optionLabel(o.id, o.label, lang) : ''; })()}</p>)}
              {p.style && <p className="text-sm text-slate-700"><b>{t('pj.style')}</b> {styleName(p.style, lang)}</p>}
            </section>
          )}

          {p.status === 'visit_scheduled' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">{t('pj.booked', { what: t(type.visitLabel === 'Design consultation' ? 'visit.design' : type.visitLabel === 'Plot visit' ? 'visit.plot' : 'visit.site') })}</h2>
              <p className="mt-1 text-slate-600">{formatIST(p.visit.slot, loc, { dateStyle: 'full', timeStyle: 'short' })}</p>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <b>{p.visit.expert.name}</b> · {lang === 'hi' ? t(`trade.${p.visit.expert.trade}` as Key) : p.visit.expert.role} · {p.visit.expert.rating > 0 ? `⭐ ${p.visit.expert.rating} (${p.visit.expert.reviews})` : `🆕 ${t('pt.new')}`} · {t('pj.expertInfo', { id: p.visit.expert.housyId })}
              </div>
              <p className="mt-3 text-sm text-slate-600">{t('pj.visitDesc')}</p>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">{t('pj.demoExpert')}</p>
                <p className="text-sm text-slate-600">{t('pj.demoExpertDesc')}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">{t('pj.measured', { what: typeArea(type, lang).toLowerCase() })}
                    <input type="number" min={5} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder={String(p.area)} value={mArea} onChange={(e) => setMArea(e.target.value)} /></label>
                  {type.askDrain && <label className="text-sm font-semibold text-slate-700">{t('pj.measuredDrain')}
                    <input type="number" min={0} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder={String(p.drainFt ?? '')} value={mDrain} onChange={(e) => setMDrain(e.target.value)} /></label>}
                </div>
                <label className="mt-2 block text-sm font-semibold text-slate-700">{t('pj.expertNote')}
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder={t('pj.expertNotePh')} /></label>
                <button className={`${btn} mt-3`} disabled={busy} onClick={() => send({ action: 'complete_visit', measuredArea: mArea || undefined, measuredDrainFt: mDrain || undefined, note: mNote })}>{t('pj.submitMeasure')}</button>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <label className="text-sm font-semibold text-slate-700">{t('pj.reschedule')}
                  <select className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5" value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
                    <option value="">{t('pj.pickSlot')}</option>
                    {visitSlots(loc).map((sl) => <option key={sl.value} value={sl.value}>{sl.text}</option>)}
                  </select></label>
                <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-50" disabled={busy || !newSlot} onClick={() => send({ action: 'reschedule', slot: newSlot })}>{t('pj.reschedule')}</button>
                <button className="ml-auto text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={cancel}>{t('pj.cancelProject')}</button>
              </div>
            </section>
          )}

          {p.quote && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">{t('pj.quote')}</h2>
              <p className="mt-1 text-3xl font-black">{inr(p.quote.total)}</p>
              {p.initialTotal && Math.abs(p.initialTotal - p.quote.total) > 500 && <p className="text-sm font-semibold text-slate-600">{t('pj.estimateAtBooking', { amt: inr(Math.round(p.initialTotal / 500) * 500) })}</p>}
              <p className="text-sm text-slate-600">{t('pj.quoteSummary', { days: p.estimate.days, adv: inr(p.quote.advance) })}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {p.quote.findings.map((f, i) => <li key={i}>• {te(f)}</li>)}
              </ul>
              {p.status === 'quote_ready' && (
                <button className={`${btn} mt-4`} disabled={busy} onClick={() => send({ action: 'accept_quote' })}>{t('pj.accept', { amt: inr(p.quote.advance) })}</button>
              )}
              {p.status === 'quote_ready' && <button className="ml-3 mt-4 text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={cancel}>{t('pj.decline')}</button>}
            </section>
          )}

          <ChatPanel projectId={p.id} cancelled={cancelled} />

          {(p.status === 'active' || p.status === 'completed') && <ExpensePanel p={p} send={send} busy={busy} />}

          <ChangePanel p={p} send={send} busy={busy} />

          {(p.status === 'active' || p.status === 'completed') && <IssuePanel projectId={p.id} typeId={p.typeId} milestones={p.milestones} />}

          {p.status === 'completed' && <ReviewPanel projectId={p.id} />}

          {p.milestones.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">{t('pj.milestones')}</h2>
              <ol className="mt-3 space-y-3">
                {p.milestones.map((m, i) => {
                  const prevDone = p.milestones.slice(0, i).every((x) => x.status === 'paid');
                  return (
                    <li key={m.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{i + 1}. {phaseName(p.typeId, m.phaseId, m.name, lang === 'hi')}</p>
                          <p className="text-sm text-slate-600">{m.pro.name} · {lang === 'hi' ? t(`trade.${m.pro.trade}` as Key) : m.pro.role} · {t('pj.msMeta', { rating: m.pro.rating > 0 ? m.pro.rating : t('pt.new'), n: m.pro.crew, days: m.days })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{inr(m.amount)}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${MS_STYLE[m.status]}`}>{t(`pj.ms.${m.status}` as Key)}</span>
                        </div>
                      </div>
                      {m.offer?.status === 'pending' && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">⏳ {t('pt.waitingAccept', { name: m.pro.name })}</p>}
                      {m.status === 'upcoming' && prevDone && p.status === 'active' && m.offer?.status !== 'pending' && (
                        <button className={`${btn} mt-3`} disabled={busy} onClick={() => send({ action: 'start', milestoneId: m.id })}>{t('pj.simStart')}</button>
                      )}
                      {(p.photos ?? []).some((ph) => ph.milestoneId === m.id) && <PhotoStrip projectId={p.id} kind={isDesign(m) ? 'design' : 'site'} photos={(p.photos ?? []).filter((ph) => ph.milestoneId === m.id)} />}
                      {m.crewNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><b>{m.pro.name}:</b> {m.crewNote}</p>}
                      {m.feedback && m.status === 'in_progress' && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"><b>{t('pj.yourChange', { n: m.revisions ?? 0, max: MAX_REVISIONS })}</b> {m.feedback}</p>}
                      {m.status === 'in_progress' && (() => {
                        const n = (p.photos ?? []).filter((ph) => ph.milestoneId === m.id).length;
                        const fresh = (p.photos ?? []).filter((ph) => ph.milestoneId === m.id && (!m.feedbackAt || ph.at > m.feedbackAt)).length;
                        return (
                          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3">
                            <p className="text-xs font-bold uppercase text-slate-500">{t('pj.demoCrew')}</p>
                            <p className="text-sm text-slate-600">{t(isDesign(m) ? 'pj.needDesign' : 'pj.needPhoto')}{m.feedbackAt ? t('pj.needNew') : ''}</p>
                            <PhotoUploader projectId={p.id} milestoneId={m.id} count={n} max={MAX_PHOTOS_PER_MILESTONE} onAdded={reload} kind={isDesign(m) ? 'design' : 'site'} />
                            <input className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder={t('pj.crewNotePh')} value={notes[m.id] ?? ''} onChange={(e) => setNotes((x) => ({ ...x, [m.id]: e.target.value }))} />
                            <button className={`${btn} mt-2`} disabled={busy || fresh === 0} onClick={() => send({ action: 'submit', milestoneId: m.id, note: notes[m.id] })}>{t(isDesign(m) ? 'pj.submitDesign' : 'pj.submitWork')}</button>
                          </div>
                        );
                      })()}
                      {m.status === 'in_review' && (
                        <div className="mt-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <button className={btn} disabled={busy} onClick={() => send({ action: 'approve', milestoneId: m.id })}>{t(isDesign(m) ? 'pj.approveDesign' : 'pj.approveWork')} {inr(m.amount)}</button>
                            {(m.revisions ?? 0) < MAX_REVISIONS
                              ? <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-slate-400" disabled={busy} onClick={() => { setChanging(changing === m.id ? null : m.id); setFeedback(''); }}>{t('pj.requestChanges')}</button>
                              : <span className="text-xs text-slate-500">{t('pj.changesUsed')}</span>}
                          </div>
                          {changing === m.id && (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <label className="block text-sm font-semibold text-slate-700" htmlFor={`fb-${m.id}`}>{t('pj.whatChange')} <span className="font-normal text-slate-500">{t('pj.round', { n: (m.revisions ?? 0) + 1, max: MAX_REVISIONS })}</span></label>
                              <textarea id={`fb-${m.id}`} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t(isDesign(m) ? 'pj.changePhDesign' : 'pj.changePh')} />
                              <button className={`${btn} mt-2`} disabled={busy || feedback.trim().length < 5} onClick={async () => { if (await send({ action: 'request_changes', milestoneId: m.id, feedback })) setChanging(null); }}>{t('pj.sendCrew')}</button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {p.status !== 'visit_scheduled' && p.status !== 'quote_ready' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('pj.paidSoFar')}</p>
              <p className="text-2xl font-black">{inr(p.paid)} <span className="text-sm font-semibold text-slate-500">{t('pj.ofTotal', { amt: inr(total) })}</span></p>
              <div className="mt-2 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#E05A2B]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('pj.activity')}</p>
            <ul className="mt-2 space-y-3 text-sm">
              {p.timeline.map((ev, i) => (
                <li key={i}><p className="text-slate-800">{te(ev.text)}</p><p className="text-xs text-slate-500">{new Date(ev.at).toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' })}</p></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
