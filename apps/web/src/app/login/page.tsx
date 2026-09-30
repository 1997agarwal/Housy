'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';

// Only allow same-site relative paths, so ?next= can't be used as an open redirect.
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/projects');

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const go = () => router.push(safeNext(new URLSearchParams(window.location.search).get('next')));
  useEffect(() => { if (user) go(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Log in to Housy</h1>
      <p className="mt-1 text-slate-600">We’ll text you a code. No password needed.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><LoginForm onDone={go} /></div>
    </div>
  );
}
