'use client';

import { useState } from 'react';
import { useAuth } from './auth-context';
import { useT } from './i18n';

const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200';
const btn = 'rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white hover:bg-[#C44519] disabled:opacity-60';

export function LoginForm({ onDone, defaultName = '', defaultPhone = '' }: { onDone?: () => void; defaultName?: string; defaultPhone?: string }) {
  const { refresh } = useAuth();
  const { t } = useT();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: object) {
    setBusy(true); setError('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Something went wrong');
      return d;
    } catch (e) { setError((e as Error).message); return null; } finally { setBusy(false); }
  }
  async function send() {
    const d = await call('/api/auth/request', { phone });
    if (d) { setDemoCode(d.devCode ?? ''); setStep('code'); }
  }
  async function verify() {
    const d = await call('/api/auth/verify', { phone, code, name });
    if (d) { await refresh(); onDone?.(); }
  }

  return (
    <div className="space-y-3">
      {step === 'phone' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="block text-sm font-semibold text-slate-700" htmlFor="lname">{t('login.name')}</label>
              <input id="lname" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
            <div><label className="block text-sm font-semibold text-slate-700" htmlFor="lphone">{t('login.phone')}</label>
              <input id="lphone" inputMode="numeric" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('login.phonePh')} autoComplete="tel" /></div>
          </div>
          <button className={btn} disabled={busy} onClick={send}>{busy ? t('login.sending') : t('login.send')}</button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">{t('login.sentTo')} <b>{phone}</b>. <button className="font-semibold text-[#E05A2B]" onClick={() => { setStep('phone'); setCode(''); setError(''); }}>{t('login.change')}</button></p>
          {demoCode && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t('login.demo')} <b className="font-mono text-base">{demoCode}</b></p>}
          <div><label className="block text-sm font-semibold text-slate-700" htmlFor="lcode">{t('login.code')}</label>
            <input id="lcode" inputMode="numeric" maxLength={6} className={`${field} max-w-[12rem] font-mono tracking-widest`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" /></div>
          <button className={btn} disabled={busy || code.length !== 6} onClick={verify}>{busy ? t('login.verifying') : t('login.verify')}</button>
        </>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
    </div>
  );
}
