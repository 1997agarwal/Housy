import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Housy — Renovate your home without being there',
  description: 'Book a verified expert to assess your home, get a fixed quote, and track every milestone — for renovations, not just repairs.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] text-slate-800 antialiased flex flex-col">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-2xl font-black tracking-tight text-[#E05A2B]">Housy</Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
              <Link href="/#services" className="hover:text-slate-900">Services</Link>
              <Link href="/projects" className="hover:text-slate-900">My projects</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Housy — whole-project renovation, run for you. AI guidance is not a substitute for a licensed structural engineer.
        </footer>
      </body>
    </html>
  );
}
