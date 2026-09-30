'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { useT } from '@/lib/i18n';

// Only allow same-site relative paths, so ?next= can't be used as an open redirect.
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/projects');

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useT();
  // Navigation happens in exactly one place, once the session has refreshed: brand-new accounts finish sign-up first;
  // returning users go where they were headed. (Doing it in both onDone and this effect made two navigations race.)
  useEffect(() => {
    if (!user) return;
    router.replace(!user.onboarded ? '/welcome' : safeNext(new URLSearchParams(window.location.search).get('next')));
  }, [user, router]);
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('login.title')}</h1>
      <p className="mt-1 text-slate-600">{t('login.sub')}</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><LoginForm /></div>
    </div>
  );
}
