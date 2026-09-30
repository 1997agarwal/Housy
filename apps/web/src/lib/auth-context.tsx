'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Profile } from './profile-shared';
export interface User { phone: string; name: string; onboarded: boolean; profile: Profile | null; isAdmin?: boolean }
// user: undefined = still loading, null = logged out.
const Ctx = createContext<{ user: User | null | undefined; refresh: () => Promise<void>; logout: () => Promise<void> }>({
  user: undefined, refresh: async () => {}, logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me');
      setUser(r.ok ? ((await r.json()).user ?? null) : null);   // a bad response means "not logged in", never "still loading"
    } catch { setUser(null); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = useCallback(async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); }, []);
  return <Ctx.Provider value={{ user, refresh, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
