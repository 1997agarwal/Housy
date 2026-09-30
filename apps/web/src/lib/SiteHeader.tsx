'use client';

import Link from 'next/link';
import { CitySelect } from './CitySelect';
import { LangToggle, useT } from './i18n';
import { UserMenu } from './UserMenu';

export function SiteHeader() {
  const { t } = useT();
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-y-2">
        <Link href="/" className="text-2xl font-black tracking-tight text-[#E05A2B]">Housy</Link>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-5 text-sm font-semibold text-slate-600">
          <Link href="/#services" className="hidden sm:inline hover:text-slate-900">{t('nav.services')}</Link>
          <Link href="/my-home" className="hover:text-slate-900">{t('nav.myHome')}</Link>
          <Link href="/advisor" className="hover:text-slate-900">{t('nav.advisor')}</Link>
          <Link href="/workers" className="hover:text-slate-900">{t('nav.crews')}</Link>
          <Link href="/projects" className="hover:text-slate-900">{t('nav.projects')}</Link>
          <Link href="/partner" className="hidden md:inline hover:text-slate-900">{t('nav.partner')}</Link>
          <CitySelect />
          <LangToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useT();
  return <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">{t('footer.text')}</footer>;
}
