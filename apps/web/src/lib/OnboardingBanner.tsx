'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';

// Shown to verified users who haven't finished sign-up (e.g. they verified inline while booking).
export function OnboardingBanner() {
  const { user } = useAuth();
  const path = usePathname();
  if (!user || user.onboarded || path === '/welcome' || path === '/login') return null;
  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-center text-sm text-orange-900">
      Finish setting up your account so we can tailor prices and crews to your property. <Link href="/welcome" className="font-bold underline">Complete sign-up →</Link>
    </div>
  );
}
