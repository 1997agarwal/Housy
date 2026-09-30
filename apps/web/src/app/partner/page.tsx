'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { LoadError } from '@/lib/LoadError';
import { PartnerForm } from '@/lib/PartnerForm';
import { cityName, typeTitle, useT } from '@/lib/i18n';
import { getType, inr, phaseName } from '@/lib/catalog';
import { cityOrDefault } from '@/lib/cities';
import type { Key } from '@/lib/messages';
import type { Partner } from '@/lib/partners-shared';
import type { JobOffer } from '@/lib/jobs';

const STATUS_STYLE = { pending: 'bg-amber-100 text-amber-900', approved: 'bg-emerald-100 text-emerald-900', suspended: 'bg-red-100 text-red-900' } as const;
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';

export default function PartnerPage() {
  const { user, refresh } = useAuth();
  const { t, te, lang } = useT();
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setPartner(undefined); return; }
    let live = true; setFailed(false);
    (async () => {
      try {
        const r = await fetch('/api/partner'); if (!r.ok) throw new Error();
        const p: Partner | null = (await r.json()).partner;
        if (!live) return;
        setPartner(p);
        if (p?.status === 'approved') {
          const j = await fetch('/api/partner/jobs'); if (j.ok && live) setJobs((await j.json()).jobs ?? []);
        }
      } catch { if (live) setFailed(true); }
    })();
    return () => { live = false; };
  }, [user, tick]);

  const respond = useCallback(async (j: JobOffer, decision: 'accept' | 'decline') => {
    if (decision === 'decline' && !window.confirm(t('pt.confirmDecline'))) return;
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/partner/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: j.projectId, milestoneId: j.milestoneId, decision }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Action failed — please try again');
      setJobs(d.jobs);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [t]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('pt.title')}</h1>

      {user === undefined ? <p className="mt-6 text-slate-500">{t('common.loading')}</p> : !user ? (
        <>
          <p className="mt-2 max-w-2xl text-slate-600">{t('pt.pitch')}</p>
          <ul className="mt-4 space-y-1 text-sm font-semibold text-slate-700">{(['pt.benefit1', 'pt.benefit2', 'pt.benefit3'] as const).map((k) => <li key={k}>✔ {t(k)}</li>)}</ul>
          <div className="mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-5"><p className="mb-3 text-sm font-bold text-slate-800">{t('pt.loginFirst')}</p><LoginForm /></div>
        </>
      ) : failed ? <LoadError message={t('pt.loadFail')} onRetry={() => setTick((n) => n + 1)} />
        : partner === undefined ? <p className="mt-6 text-slate-500">{t('common.loading')}</p> : partner === null ? (
        <>
          <p className="mt-2 text-slate-600">{t('pt.pitch')}</p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <PartnerForm defaultName={user.name} onSaved={(p) => { setPartner(p); refresh(); }} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-extrabold">{partner.name}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[partner.status]}`}>{t(`pt.status.${partner.status}` as Key)}</span>
              {partner.housyId && <span className="text-sm font-semibold text-slate-600">{t('pt.housyId', { id: partner.housyId })}</span>}
            </div>
            {partner.status === 'pending' && <p className="mt-2 text-sm text-slate-700">{t('pt.pendingHelp')}</p>}
            {partner.status === 'suspended' && <p className="mt-2 text-sm text-slate-700">{t('pt.suspendedHelp')}</p>}
            {partner.reviewNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{t('pt.note', { note: te(partner.reviewNote) })}</p>}
          </div>

          {partner.status === 'approved' && (
            <section className="mt-6">
              <h2 className="text-xl font-extrabold">{t('pt.jobs')}</h2>
              {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{te(error)}</p>}
              {jobs.length === 0 ? <p className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">{t('pt.noJobs')}</p> : (
                <ul className="mt-3 space-y-3">
                  {jobs.map((j) => {
                    const ty = getType(j.typeId);
                    return (
                      <li key={`${j.projectId}-${j.milestoneId}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-bold">{phaseName(j.typeId, j.phaseId, j.phase, lang === 'hi')}</p>
                        <p className="text-sm text-slate-600">{t('pt.jobLine', { type: ty ? typeTitle(ty, lang) : j.typeId, city: cityName(cityOrDefault(j.city), lang), area: j.area })}</p>
                        <p className="text-sm font-semibold text-slate-800">{t('pt.jobPay', { amount: inr(j.amount), days: j.days })}</p>
                        {j.status === 'pending' ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button className={btn} disabled={busy} onClick={() => respond(j, 'accept')}>{t('pt.accept')}</button>
                            <button className="text-sm font-bold text-red-700 hover:underline" disabled={busy} onClick={() => respond(j, 'decline')}>{t('pt.decline')}</button>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-emerald-800">✔ {t('pt.accepted')} · {t(`pt.ms.${j.milestoneStatus}` as Key)}{j.customer ? ` · ${t('pt.customer', { name: j.customer })}` : ''}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            {partner.status !== 'suspended' && <p className="mb-3 text-xs text-slate-500">{t('pt.reverify')}</p>}
            <PartnerForm existing={partner} onSaved={(p) => { setPartner(p); refresh(); setTick((n) => n + 1); }} />
          </section>
        </>
      )}
    </div>
  );
}
