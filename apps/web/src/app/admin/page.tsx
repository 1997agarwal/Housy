'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getType, inrShort } from '@/lib/catalog';

interface Summary {
  totals: { projects: number; waitlist: number; accepted: number };
  cities: { id: string; name: string; status: string; waitlist: number; projects: number; value: number; topInterest: string | null }[];
  recentWaitlist: { id: string; city: string; name: string; phone: string; createdAt: string }[];
}

export default function Admin() {
  const { user } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin').then(async (r) => (r.ok ? setData(await r.json()) : setDenied(true)));
  }, [user]);

  if (user === undefined) return <div className="mx-auto max-w-5xl px-4 py-10 text-slate-500">Loading…</div>;
  if (!user || denied) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-black">Not authorised</h1><p className="mt-1 text-slate-600">This page is for Housy operations.</p></div>;
  if (!data) return <div className="mx-auto max-w-5xl px-4 py-10 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Operations</h1>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[['Projects', data.totals.projects], ['Quotes accepted', data.totals.accepted], ['Waitlist sign-ups', data.totals.waitlist]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="text-3xl font-black">{v}</p></div>
        ))}
      </div>
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
