'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_CITY, cityOrDefault, type City } from './cities';

const KEY = 'housy.city';
const Ctx = createContext<{ city: City; setCity: (id: string) => void }>({ city: cityOrDefault(DEFAULT_CITY), setCity: () => {} });

// The selected city is a per-viewer preference: kept in localStorage, defaulting to Bareilly on first render
// (same on server and client, so there is no hydration mismatch), then restored after mount.
export function CityProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(DEFAULT_CITY);
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v) setId(cityOrDefault(v).id); } catch { /* storage unavailable */ }
  }, []);
  const setCity = useCallback((next: string) => {
    const c = cityOrDefault(next);
    setId(c.id);
    try { localStorage.setItem(KEY, c.id); } catch { /* ignore */ }
  }, []);
  return <Ctx.Provider value={{ city: cityOrDefault(id), setCity }}>{children}</Ctx.Provider>;
}
export const useCity = () => useContext(Ctx);
