'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { useT } from './i18n';

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useT();
  if (user === undefined) return <span className="w-14" aria-hidden />;
  if (!user) return <Link href="/login" className="rounded-lg bg-[#E05A2B] px-3 py-1.5 text-white hover:bg-[#C44519] whitespace-nowrap">{t('nav.login')}</Link>;
  return (
    <span className="flex items-center gap-3">
      {user.isAdmin && <Link href="/admin" className="text-slate-700 hover:text-slate-900">{t('nav.ops')}</Link>}
      <Link href={user.onboarded ? '/profile' : '/welcome'} className="text-slate-700 hover:text-slate-900" title="Your profile">
        {user.onboarded ? user.name.split(' ')[0] : t('nav.finishSignup')}
      </Link>
      <button onClick={async () => { await logout(); router.push('/'); router.refresh(); }} className="text-slate-600 hover:text-slate-900" title={`Signed in as ${user.phone}`}>{t('nav.logout')}</button>
    </span>
  );
}
