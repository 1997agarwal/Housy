import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Property, Project } from '@housy/shared';

interface AppState {
  // Auth
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;

  // Active context
  activeProperty: Property | null;
  activeProject: Project | null;

  // Actions
  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  setActiveProperty: (property: Property | null) => void;
  setActiveProject: (project: Project | null) => void;
  signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  activeProperty: null,
  activeProject: null,

  setSession: (session) =>
    set({ session, isAuthenticated: !!session }),

  setUser: (user) => set({ user }),

  setActiveProperty: (property) => set({ activeProperty: property }),

  setActiveProject: (project) => set({ activeProject: project }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false, activeProperty: null, activeProject: null });
  },
}));
