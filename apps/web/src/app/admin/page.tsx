'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadError } from '@/lib/LoadError';
import { getType, inrShort } from '@/lib/catalog';
import { ISSUE_TYPES } from '@/lib/issues-shared';
import type { OpsIssue } from '@/lib/issues';

interface Summary {
  totals: { projects: number; waitlist: number; accepted: number };
  cities: { id: string; name: string; status: string; waitlist: number; projects: number; value: number; topInterest: string | null }[];
  recentWaitlist: { id: string; city: string; name: string; phone: string; createdAt: string }[];
}

export default function Admin() {
  const { user } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [denied, setDenied] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [tick, setTick] = useState(0);
  const [issues, setIssues] = useState<OpsIssue[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const loadIssues = () => fetch('/api/admin/issues').then(async (r) => r.ok && setIssues(await r.json())).catch(() => undefined);
  async function act(id: string, body: object) {
    setErr('');
    const r = await fetch(`/api/admin/issues/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) setErr((await r.json()).error || 'Failed'); else { setText((t) => ({ ...t, [id]: '' })); loadIssues(); }
  }

  useEffect(() => {
    if (!user) return;
    setLoadErr(false);
    fetch('/api/admin')
      .then(async (r) => { if (r.ok) setData(await r.json()); else if (r.status === 401 || r.status === 403) setDenied(true); else throw new Error(String(r.status)); })
      .catch(() => setLoadErr(true));
    loadIssues();
  }, [user, tick]);

  if (user === undefined) return <div className="mx-auto max-w-5xl px-4 py-10 text-slate-500">Loading…</div>;
  if (!user || denied) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-black">Not authorised</h1><p className="mt-1 text-slate-600">This page is for Housy operations.</p></div>;
  if (loadErr) return <div className="mx-auto max-w-5xl px-4 py-10"><LoadError message="Couldn’t load the operations data." onRetry={() => setTick((n) => n + 1)} /></div>;
  if (!data) return <div className="mx-auto max-w-5xl px-4 py-10 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Operations</h1>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[['Projects', data.totals.projects], ['Quotes accepted', data.totals.accepted], ['Waitlist sign-ups', data.totals.waitlist]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="text-3xl font-black">{v}</p></div>
        ))}
      </div>
      <h2 className="mt-8 font-extrabold text-slate-900">Support queue <span className="text-sm font-normal text-slate-500">({issues.filter((i) => i.status !== 'resolved').length} open, {issues.filter((i) => i.escalated).length} escalated)</span></h2>
      {err && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{err}</p>}
      <ul className="mt-3 space-y-3">
        {issues.length === 0 && <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No problems reported.</li>}
        {issues.map((i) => (
          <li key={i.id} className={`rounded-2xl border bg-white p-4 ${i.escalated ? 'border-red-300' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <b>{ISSUE_TYPES[i.type]}</b><span className="text-slate-500">{i.id} · project {i.projectId} · owner {i.ownerMasked}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{i.status.replace('_', ' ')}</span>
              {i.escalated && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">ESCALATED</span>}
            </div>
            <ul className="mt-2 space-y-1 text-sm">{i.messages.map((m, k) => <li key={k} className={m.by === 'housy' ? 'text-blue-900' : 'text-slate-800'}><b>{m.by === 'housy' ? 'Housy' : 'Owner'}:</b> {m.text}</li>)}</ul>
            {i.status !== 'resolved' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Reply / resolution note…" value={text[i.id] ?? ''} onChange={(e) => setText((t) => ({ ...t, [i.id]: e.target.value }))} aria-label={`Reply to ${i.id}`} />
                <button className="rounded-lg bg-[#E05A2B] px-3 py-1.5 text-sm font-bold text-white" onClick={() => act(i.id, { action: 'reply', text: text[i.id] })}>Reply</button>
                <button className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-bold text-emerald-700" onClick={() => act(i.id, { action: 'resolve', resolution: text[i.id] })}>Resolve</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-extrabold text-slate-900">Demand by city</h2>
      <p className="text-sm text-slate-600">Waitlist sign-ups in cities that aren’t live yet are the signal for where to onboard crews next.</p>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">City</th><th>Status</th><th>Waitlist</th><th>Projects</th><th>Accepted value</th><th>Top interest</th></tr></thead>
          <tbody>
            {data.cities.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{c.name}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.status === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{c.status === 'live' ? 'Live' : 'Coming soon'}</span></td>
                <td>{c.waitlist}</td><td>{c.projects}</td><td>{c.value ? inrShort(c.value) : '—'}</td><td>{c.topInterest ? getType(c.topInterest)?.title : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8 font-extrabold text-slate-900">Latest waitlist sign-ups</h2>
      <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white text-sm">
        {data.recentWaitlist.length === 0 && <li className="p-3 text-slate-500">None yet.</li>}
        {data.recentWaitlist.map((e) => <li key={e.id} className="flex justify-between p-3"><span>{e.name} · {e.phone}</span><span className="text-slate-500">{e.city} · {new Date(e.createdAt).toLocaleDateString('en-IN')}</span></li>)}
      </ul>
    </div>
  );
}
