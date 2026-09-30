'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getType, inr } from '@/lib/catalog';
import { cityOrDefault } from '@/lib/cities';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { LoadError } from '@/lib/LoadError';
import { cityName, typeTitle, useT } from '@/lib/i18n';
import type { Project } from '@/lib/projects';

export default function Projects() {
  const { user } = useAuth();
  const { t, lang } = useT();
  const [projects, setProjects] = useState<(Project & { unreadChat?: number })[] | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) { setProjects(null); return; }
    let live = true;
    setErr('');
    fetch('/api/projects')
      .then(async (r) => {
        if (r.status === 401) throw new Error(t('pl.expired'));
        if (!r.ok) throw new Error(t('pl.loadFail'));
        return r.json();
      })
      .then((d) => live && setProjects(Array.isArray(d) ? d : []))
      .catch((e) => live && setErr(e instanceof Error && e.message ? e.message : t('pl.loadFail')));
    return () => { live = false; };
  }, [user, tick, t]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('pl.title')}</h1>
      {user === undefined ? <p className="mt-6 text-slate-500">{t('common.loading')}</p> : !user ? (
        <div className="mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-slate-600">{t('pl.login')}</p>
          <LoginForm />
        </div>
      ) : err ? <LoadError message={err} onRetry={() => setTick((n) => n + 1)} /> : projects === null ? <p className="mt-6 text-slate-500">{t('common.loading')}</p> : projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">{t('pl.none')}</p>
          <Link href="/#services" className="mt-3 inline-block font-bold text-[#E05A2B]">{t('pl.first')}</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((p) => {
            const ty = getType(p.typeId);   // a project of a type that no longer exists must not crash the whole list
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-300">
                  <div>
                    <p className="font-bold text-slate-900">{ty?.emoji ?? '📁'} {ty ? typeTitle(ty, lang) : p.typeId} · {cityName(cityOrDefault(p.city), lang)}</p>
                    <p className="text-sm text-slate-600">{p.id} · {p.contact.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E05A2B]">{t(`status.${p.status}`)}</p>
                    {!!p.unreadChat && <p className="mt-0.5 inline-block rounded-full bg-[#E05A2B] px-2 py-0.5 text-xs font-bold text-white" aria-label={t('pl.unread', { n: p.unreadChat })}>💬 {p.unreadChat}</p>}
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
