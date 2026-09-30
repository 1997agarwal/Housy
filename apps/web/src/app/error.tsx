'use client';

import { useT } from '@/lib/i18n';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl">🛠️</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900">{t('err.title')}</h1>
      <p className="mt-1 text-slate-600">{t('err.desc')}</p>
      <button onClick={reset} className="mt-5 rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white">{t('common.tryAgain')}</button>
    </div>
  );
}
