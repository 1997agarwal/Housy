import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CityProvider } from '@/lib/city-context';
import { AuthProvider } from '@/lib/auth-context';
import { SiteFooter, SiteHeader } from '@/lib/SiteHeader';
import { LangProvider } from '@/lib/i18n';
import { OnboardingBanner } from '@/lib/OnboardingBanner';

export const metadata: Metadata = {
  title: 'Housy — Renovate your home without being there',
  description: 'Book a verified expert to assess your home, get a fixed quote, and track every milestone — for renovations, not just repairs.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] text-slate-800 antialiased flex flex-col">
        <CityProvider>
        <AuthProvider>
        <LangProvider>
        <SiteHeader />
        <OnboardingBanner />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        </LangProvider>
        </AuthProvider>
        </CityProvider>
      </body>
    </html>
  );
}
