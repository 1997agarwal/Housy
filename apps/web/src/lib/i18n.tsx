'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth-context';
import { translate, type Key, type Lang } from './messages';
import { translateServerText } from './server-text';
import type { City } from './cities';
import type { ProjectType } from './catalog';

const KEY = 'housy.lang';
type Vars = Record<string, string | number>;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key, v?: Vars) => string; te: (text: string) => string }>({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v), te: (s) => s });

// Order of preference: an explicit choice on this device → the language saved in the profile → English.
// Starts as English on server and first client render (no hydration mismatch), then switches after mount.
export function LangProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Lang>('en');
  const [chosen, setChosen] = useState(false);

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === 'hi' || v === 'en') { setLangState(v); setChosen(true); } } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    const pref = user?.profile?.language;
    if (!chosen && (pref === 'hi' || pref === 'en')) setLangState(pref);
  }, [user, chosen]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l); setChosen(true);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  }, []);
  const t = useCallback((k: Key, v?: Vars) => translate(lang, k, v), [lang]);
  const te = useCallback((text: string) => translateServerText(text, lang), [lang]);
  const value = useMemo(() => ({ lang, setLang, t, te }), [lang, setLang, t, te]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

// Data-level helpers (names live next to the data, not in the message catalogue).
export const cityName = (c: City, lang: Lang) => (lang === 'hi' && c.hi ? c.hi : c.name);
export const typeTitle = (t: ProjectType, lang: Lang) => (lang === 'hi' && t.titleHi ? t.titleHi : t.title);
export const typeArea = (t: ProjectType, lang: Lang) => (lang === 'hi' && t.areaLabelHi ? t.areaLabelHi : t.areaLabel);
export const typeTagline = (t: ProjectType, lang: Lang) => (lang === 'hi' && t.taglineHi ? t.taglineHi : t.tagline);

export function LangToggle() {
  const { lang, setLang, t } = useT();
  return (
    <div role="group" aria-label={t('nav.language')} className="flex overflow-hidden rounded-lg border border-slate-300 text-xs font-bold">
      {(['en', 'hi'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}
          className={`px-2 py-1.5 ${lang === l ? 'bg-[#E05A2B] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{l === 'en' ? 'EN' : 'हिं'}</button>
      ))}
    </div>
  );
}
