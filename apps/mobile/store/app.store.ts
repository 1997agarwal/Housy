import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Property, Project } from '@housy/shared';

const DEMO_USER: User = {
  id: 'homeowner-demo-id',
  phone: '+919876543210',
  name: 'Harshit Agarwal',
  email: 'agarwal.harshit97@gmail.com',
  city: 'Bareilly',
  role: 'homeowner',
  language_pref: 'en',
  phone_verified: true,
  aadhaar_verified: true,
  created_at: new Date().toISOString(),
};

const DEMO_PROPERTY: Property = {
  id: 'prop-bareilly-001',
  owner_id: 'homeowner-demo-id',
  city: 'Bareilly',
  locality: 'Civil Lines',
  pincode: '243001',
  type: 'house',
  age_years: 30,
  sq_ft: 2000,
  bhk: 5,
  bathrooms: 1,
  renovation_scope: ['bathroom_addition', 'wall_demolition', 'flooring'],
  photos: [],
  created_at: new Date().toISOString(),
};

const DEMO_PROJECT: Project = {
  id: 'proj-bareilly-001',
  property_id: 'prop-bareilly-001',
  homeowner_id: 'homeowner-demo-id',
  title: 'Bareilly Ancestral Home Renovation',
  status: 'active',
  budget_estimate: 750000,
  budget_spent: 185000,
  start_date: '2026-09-01',
  created_at: new Date().toISOString(),
};

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
  user: DEMO_USER,
  session: null,
  isAuthenticated: true,
  activeProperty: DEMO_PROPERTY,
  activeProject: DEMO_PROJECT,

  setSession: (session) =>
    set({ session, isAuthenticated: !!session }),

  setUser: (user) => set({ user }),

  setActiveProperty: (property) => set({ activeProperty: property }),

  setActiveProject: (project) => set({ activeProject: project }),

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    set({ user: null, session: null, isAuthenticated: false, activeProperty: null, activeProject: null });
  },
}));
