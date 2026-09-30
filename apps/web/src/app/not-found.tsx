'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl">🏚️</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900">{t('nf.title')}</h1>
      <p className="mt-1 text-slate-600">{t('nf.desc')}</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white">{t('nf.back')}</Link>
    </div>
  );
}
