'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getType, inr } from '@/lib/catalog';
import { visitSlots } from '@/lib/slots';
import { cityOrDefault } from '@/lib/cities';
import type { Milestone, Project } from '@/lib/projects';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { PhotoStrip, PhotoUploader } from '@/lib/MilestonePhotos';
import { MAX_PHOTOS_PER_MILESTONE } from '@/lib/limits';

const STAGE_IDX = { visit_scheduled: 0, quote_ready: 1, active: 2, completed: 3, cancelled: -1 } as const;
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const MS_LABEL: Record<Milestone['status'], string> = { upcoming: 'Upcoming', in_progress: 'In progress', in_review: 'Awaiting your approval', paid: 'Approved & paid' };
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
  const [mArea, setMArea] = useState('');
  const [mDrain, setMDrain] = useState('');
  const [mNote, setMNote] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    fetch(`/api/projects/${id}`).then(async (r) => {
      if (r.status === 404) setMissing(true); else if (r.ok) setP(await r.json()); else setError('Could not load project');
    }).catch(() => setError('Could not load project'));
  }, [id, user]);

  const send = useCallback(async (body: object) => {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/projects/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Action failed');
      setP(d);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [id]);

  const reload = useCallback(async () => { const r = await fetch(`/api/projects/${id}`); if (r.ok) setP(await r.json()); }, [id]);

  if (user === undefined) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Loading…</div>;
  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-black text-slate-900">Log in to view this project</h1>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><LoginForm /></div>
    </div>
  );
  if (missing) return <div className="mx-auto max-w-5xl px-4 py-16 text-center"><p className="font-bold">Project not found.</p><Link href="/projects" className="text-[#E05A2B] font-bold">My projects →</Link></div>;
  if (!p) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">{error || 'Loading…'}</div>;

  const type = getType(p.typeId)!;
  const STAGES = [type.interiors ? 'Design' : 'Visit', 'Quote', type.category === 'build' ? 'Build' : 'Work', 'Done'];
  const stage = STAGE_IDX[p.status];
  const cancelled = p.status === 'cancelled';
  const cancel = () => { if (window.confirm('Cancel this project? This cannot be undone.')) send({ action: 'cancel' }); };
  const total = p.quote?.total ?? p.estimate.total;
  const pct = Math.min(100, Math.round((p.paid / total) * 100));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.id} · {cityOrDefault(p.city).name}{p.style ? ` · ${p.style} style` : ''}</p>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{type.emoji} {type.title}</h1>

      {cancelled ? (
        <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">This project was cancelled{p.cancelReason ? ` — ${p.cancelReason}` : ''}. <Link href="/#services" className="text-[#E05A2B]">Plan a new one →</Link></p>
      ) : (
      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Project stage">
        {STAGES.map((s, i) => (
          <li key={s} className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${i < stage || p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : i === stage ? 'bg-[#E05A2B] text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</li>
        ))}
      </ol>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {p.status === 'visit_scheduled' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">{type.visitLabel} booked</h2>
              <p className="mt-1 text-slate-600">{new Date(p.visit.slot).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <b>{p.visit.expert.name}</b> · {p.visit.expert.role} · ⭐ {p.visit.expert.rating} ({p.visit.expert.reviews}) · Housy ID {p.visit.expert.housyId}
              </div>
              <p className="mt-3 text-sm text-slate-600">The expert will measure the space, check for hidden issues and issue a fixed quote — usually within 24 hours of the visit.</p>
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Demo control · expert app</p>
                <p className="text-sm text-slate-600">There’s no expert app yet. Enter what the expert measured on site — the quote is re-priced from it.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">Measured {type.areaLabel.toLowerCase()}
                    <input type="number" min={5} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder={String(p.area)} value={mArea} onChange={(e) => setMArea(e.target.value)} /></label>
                  {type.askDrain && <label className="text-sm font-semibold text-slate-700">Measured drain distance (ft)
                    <input type="number" min={0} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" placeholder={String(p.drainFt ?? '')} value={mDrain} onChange={(e) => setMDrain(e.target.value)} /></label>}
                </div>
                <label className="mt-2 block text-sm font-semibold text-slate-700">Expert note (optional)
                  <input className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5" value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="e.g. old wall is 9-inch brick; roof access is via the courtyard" /></label>
                <button className={`${btn} mt-3`} disabled={busy} onClick={() => send({ action: 'complete_visit', measuredArea: mArea || undefined, measuredDrainFt: mDrain || undefined, note: mNote })}>Submit measurements & issue quote</button>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <label className="text-sm font-semibold text-slate-700">Reschedule
                  <select className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5" value={newSlot} onChange={(e) => setNewSlot(e.target.value)}>
                    <option value="">Pick a new slot…</option>
                    {visitSlots().map((sl) => <option key={sl.value} value={sl.value}>{sl.text}</option>)}
                  </select></label>
                <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 disabled:opacity-50" disabled={busy || !newSlot} onClick={() => send({ action: 'reschedule', slot: newSlot })}>Reschedule</button>
                <button className="ml-auto text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={cancel}>Cancel project</button>
              </div>
            </section>
          )}

          {p.quote && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">Fixed quote</h2>
              <p className="mt-1 text-3xl font-black">{inr(p.quote.total)}</p>
              {p.initialTotal && Math.abs(p.initialTotal - p.quote.total) > 500 && <p className="text-sm font-semibold text-slate-600">Estimate at booking: {inr(Math.round(p.initialTotal / 500) * 500)} — updated after on-site measurements</p>}
              <p className="text-sm text-slate-600">About {p.estimate.days} working days · {inr(p.quote.advance)} advance (20%), rest released milestone by milestone.</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {p.quote.findings.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
              {p.status === 'quote_ready' && (
                <button className={`${btn} mt-4`} disabled={busy} onClick={() => send({ action: 'accept_quote' })}>Accept quote & pay {inr(p.quote.advance)} advance</button>
              )}
              {p.status === 'quote_ready' && <button className="ml-3 mt-4 text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={cancel}>Decline & cancel</button>}
            </section>
          )}

          {p.milestones.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold">Milestones</h2>
              <ol className="mt-3 space-y-3">
                {p.milestones.map((m, i) => {
                  const prevDone = p.milestones.slice(0, i).every((x) => x.status === 'paid');
                  return (
                    <li key={m.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{i + 1}. {m.name}</p>
                          <p className="text-sm text-slate-600">{m.pro.name} · {m.pro.role} · ⭐ {m.pro.rating} · crew of {m.pro.crew} · ~{m.days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{inr(m.amount)}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${MS_STYLE[m.status]}`}>{MS_LABEL[m.status]}</span>
                        </div>
                      </div>
                      {m.status === 'upcoming' && prevDone && p.status === 'active' && (
                        <button className={`${btn} mt-3`} disabled={busy} onClick={() => send({ action: 'start', milestoneId: m.id })}>Simulate: crew starts</button>
                      )}
                      {(p.photos ?? []).some((ph) => ph.milestoneId === m.id) && <PhotoStrip projectId={p.id} photos={(p.photos ?? []).filter((ph) => ph.milestoneId === m.id)} />}
                      {m.crewNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><b>{m.pro.name}:</b> {m.crewNote}</p>}
                      {m.status === 'in_progress' && (() => {
                        const n = (p.photos ?? []).filter((ph) => ph.milestoneId === m.id).length;
                        return (
                          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3">
                            <p className="text-xs font-bold uppercase text-slate-500">Demo control · crew app</p>
                            <p className="text-sm text-slate-600">The crew must attach at least one site photo before submitting.</p>
                            <PhotoUploader projectId={p.id} milestoneId={m.id} count={n} max={MAX_PHOTOS_PER_MILESTONE} onAdded={reload} />
                            <input className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Crew note (optional) — e.g. slope checked 1:40, pipes pressure-tested" value={notes[m.id] ?? ''} onChange={(e) => setNotes((x) => ({ ...x, [m.id]: e.target.value }))} />
                            <button className={`${btn} mt-2`} disabled={busy || n === 0} onClick={() => send({ action: 'submit', milestoneId: m.id, note: notes[m.id] })}>Submit work for review</button>
                          </div>
                        );
                      })()}
                      {m.status === 'in_review' && (
                        <button className={`${btn} mt-3`} disabled={busy} onClick={() => send({ action: 'approve', milestoneId: m.id })}>Approve work & release {inr(m.amount)}</button>
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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid so far</p>
              <p className="text-2xl font-black">{inr(p.paid)} <span className="text-sm font-semibold text-slate-500">of {inr(total)}</span></p>
              <div className="mt-2 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#E05A2B]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity</p>
            <ul className="mt-2 space-y-3 text-sm">
              {p.timeline.map((t, i) => (
                <li key={i}><p className="text-slate-800">{t.text}</p><p className="text-xs text-slate-500">{new Date(t.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
