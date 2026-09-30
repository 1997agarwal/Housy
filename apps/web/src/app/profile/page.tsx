'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCity } from '@/lib/city-context';
import { LoginForm } from '@/lib/LoginForm';
import { ProfileForm } from '@/lib/ProfileForm';

export default function ProfilePage() {
  const { user } = useAuth();
  const { setCity } = useCity();
  const [saved, setSaved] = useState(false);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Your profile</h1>
      {user === undefined ? <p className="mt-6 text-slate-500">Loading…</p> : !user ? (
        <div className="mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-5"><LoginForm /></div>
      ) : (
        <>
          <p className="mt-1 text-slate-600">Signed in as +91 {user.phone}</p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <ProfileForm mode="edit" onSaved={(p) => { setCity(p.city); setSaved(true); }} onEdit={() => setSaved(false)} />
            {saved && <p role="status" className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-900">Saved.</p>}
          </div>
        </>
      )}
    </div>
  );
}
