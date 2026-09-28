import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Housy — Renovation Intelligence & Verified Labor',
  description: 'AI-guided ancestral house renovation and verified mistri booking platform.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FAF9F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#ECEAE4] text-slate-800 antialiased min-h-screen flex items-center justify-center p-0 sm:py-6">
        {/* Mobile Viewport Container */}
        <div className="w-full sm:max-w-[460px] h-[100dvh] sm:h-[900px] sm:max-h-[92vh] bg-[#FAF9F6] sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden relative">
          {/* Subtle Mobile Speaker Notch on desktop */}
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#FAF9F6] shrink-0 z-50">
            <div className="w-20 h-4 bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 ml-auto mr-2" />
            </div>
          </div>

          {/* Main App Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col no-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
