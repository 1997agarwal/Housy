import type { Trade } from './catalog';

// Seed data. In production these come from the `pocs` table (field-agent onboarded).
export interface Pro {
  id: string; name: string; role: string; trade: Trade; rating: number; reviews: number;
  crew: number; years: number; housyId: string;
}

export const PROS: Pro[] = [
  { id: 'poc-1', name: 'Suresh Mistri & Gang', role: 'Master Mason', trade: 'mason', rating: 4.9, reviews: 38, crew: 4, years: 14, housyId: 'HSY-001' },
  { id: 'poc-2', name: 'Ram Pal Sharma', role: 'Master Plumber', trade: 'plumber', rating: 4.8, reviews: 29, crew: 2, years: 11, housyId: 'HSY-002' },
  { id: 'poc-3', name: 'Rajesh Kumar & Sons', role: 'Licensed Electrician', trade: 'electrician', rating: 4.7, reviews: 22, crew: 2, years: 9, housyId: 'HSY-003' },
  { id: 'poc-4', name: 'Imran Tiles Works', role: 'Tiling Contractor', trade: 'tiler', rating: 4.8, reviews: 31, crew: 5, years: 12, housyId: 'HSY-004' },
  { id: 'poc-5', name: 'Anil Paint House', role: 'Painting Contractor', trade: 'painter', rating: 4.6, reviews: 19, crew: 6, years: 8, housyId: 'HSY-005' },
  { id: 'poc-6', name: 'Mohan Carpentry', role: 'Lead Carpenter', trade: 'carpenter', rating: 4.7, reviews: 17, crew: 3, years: 10, housyId: 'HSY-006' },
  { id: 'poc-7', name: 'Er. Deepak Saxena', role: 'Structural Engineer (B.Tech Civil)', trade: 'engineer', rating: 4.9, reviews: 44, crew: 1, years: 16, housyId: 'HSY-007' },
  { id: 'poc-8', name: 'DryGuard Waterproofing', role: 'Waterproofing Specialist', trade: 'waterproofer', rating: 4.7, reviews: 26, crew: 4, years: 9, housyId: 'HSY-008' },
];

export const proForTrade = (t: Trade) => PROS.find((p) => p.trade === t)!;
// The person who does the paid site visit and writes the quote.
export const visitExpert = (needsEngineer?: boolean) => (needsEngineer ? proForTrade('engineer') : proForTrade('mason'));
