'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface User { phone: string; name: string }
// user: undefined = still loading, null = logged out.
const Ctx = createContext<{ user: User | null | undefined; refresh: () => Promise<void>; logout: () => Promise<void> }>({
  user: undefined, refresh: async () => {}, logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const refresh = useCallback(async () => {
    try { setUser((await (await fetch('/api/auth/me')).json()).user); } catch { setUser(null); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = useCallback(async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); }, []);
  return <Ctx.Provider value={{ user, refresh, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
