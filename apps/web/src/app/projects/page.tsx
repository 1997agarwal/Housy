'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getType, inr } from '@/lib/catalog';
import { cityOrDefault } from '@/lib/cities';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import type { Project } from '@/lib/projects';

const STATUS = { visit_scheduled: 'Visit scheduled', quote_ready: 'Quote ready', active: 'In progress', completed: 'Completed', cancelled: 'Cancelled' } as const;

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    if (!user) { setProjects(null); return; }
    let live = true;
    fetch('/api/projects').then((r) => r.json()).then((d) => live && setProjects(Array.isArray(d) ? d : []));
    return () => { live = false; };
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">My projects</h1>
      {user === undefined ? <p className="mt-6 text-slate-500">Loading…</p> : !user ? (
        <div className="mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-slate-600">Log in with your mobile number to see your projects.</p>
          <LoginForm />
        </div>
      ) : projects === null ? <p className="mt-6 text-slate-500">Loading…</p> : projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No projects yet.</p>
          <Link href="/#services" className="mt-3 inline-block font-bold text-[#E05A2B]">Plan your first project →</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((p) => {
            const t = getType(p.typeId)!;
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-300">
                  <div>
                    <p className="font-bold text-slate-900">{t.emoji} {t.title} · {cityOrDefault(p.city).name}</p>
                    <p className="text-sm text-slate-600">{p.id} · {p.contact.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E05A2B]">{STATUS[p.status]}</p>
                    <p className="text-sm text-slate-600">{inr(p.quote?.total ?? p.estimate.total)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
