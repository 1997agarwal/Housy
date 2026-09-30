'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { useT } from './i18n';

// Shown to verified users who haven't finished sign-up (e.g. they verified inline while booking).
export function OnboardingBanner() {
  const { user } = useAuth();
  const path = usePathname();
  const { t } = useT();
  if (!user || user.onboarded || path === '/welcome' || path === '/login' || path?.startsWith('/partner')) return null;
  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-center text-sm text-orange-900">
      {t('banner.finish')} <Link href="/welcome" className="font-bold underline">{t('banner.cta')}</Link>
    </div>
  );
}
