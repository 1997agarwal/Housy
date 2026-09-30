'use client';

import { useT } from './i18n';

// A visible failure state with a retry, so a dropped connection or server error never leaves a page on "Loading…" forever.
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useT();
  return (
    <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">{message}</p>
      <button onClick={onRetry} className="mt-2 rounded-lg bg-red-700 px-3 py-1.5 font-bold text-white hover:bg-red-800">{t('common.tryAgain')}</button>
    </div>
  );
}
