import type { Trade } from './catalog';
import { getCity } from './cities';

// Seed data. In production these come from `poc_profiles` (field-agent onboarded), keyed by city_id.
export interface Pro {
  id: string; city: string; locality: string; name: string; role: string; trade: Trade;
  rating: number; reviews: number; crew: number; years: number; dayRate: number; housyId: string;
}

const p = (id: string, city: string, locality: string, name: string, role: string, trade: Trade,
  rating: number, reviews: number, crew: number, years: number, dayRate: number, housyId: string): Pro =>
  ({ id, city, locality, name, role, trade, rating, reviews, crew, years, dayRate, housyId });

export const PROS: Pro[] = [
  p('bly-1', 'bareilly', 'Civil Lines', 'Suresh Mistri & Gang', 'Master Mason', 'mason', 4.9, 38, 4, 14, 850, 'HSY-BLY-001'),
  p('bly-2', 'bareilly', 'Subhash Nagar', 'Ram Pal Sharma', 'Master Plumber', 'plumber', 4.8, 29, 2, 11, 800, 'HSY-BLY-002'),
  p('bly-3', 'bareilly', 'Rajendra Nagar', 'Rajesh Kumar & Sons', 'Licensed Electrician', 'electrician', 4.7, 22, 2, 9, 750, 'HSY-BLY-003'),
  p('bly-4', 'bareilly', 'Izzatnagar', 'Imran Tiles Works', 'Tiling Contractor', 'tiler', 4.8, 31, 5, 12, 800, 'HSY-BLY-004'),
  p('bly-5', 'bareilly', 'Civil Lines', 'Anil Paint House', 'Painting Contractor', 'painter', 4.6, 19, 6, 8, 650, 'HSY-BLY-005'),
  p('bly-6', 'bareilly', 'Pilibhit Bypass', 'Mohan Carpentry', 'Lead Carpenter', 'carpenter', 4.7, 17, 3, 10, 850, 'HSY-BLY-006'),
  p('bly-7', 'bareilly', 'Civil Lines', 'Er. Deepak Saxena', 'Structural Engineer (B.Tech Civil)', 'engineer', 4.9, 44, 1, 16, 0, 'HSY-BLY-007'),
  p('bly-8', 'bareilly', 'Subhash Nagar', 'DryGuard Waterproofing', 'Waterproofing Specialist', 'waterproofer', 4.7, 26, 4, 9, 900, 'HSY-BLY-008'),

  p('lko-1', 'lucknow', 'Aliganj', 'Vinod Mistri & Team', 'Master Mason', 'mason', 4.8, 27, 6, 13, 950, 'HSY-LKO-001'),
  p('lko-2', 'lucknow', 'Gomti Nagar', 'Sharma Plumbing Services', 'Master Plumber', 'plumber', 4.7, 21, 3, 10, 900, 'HSY-LKO-002'),
  p('lko-3', 'lucknow', 'Indira Nagar', 'Nadeem Electricals', 'Licensed Electrician', 'electrician', 4.8, 24, 3, 12, 850, 'HSY-LKO-003'),
  p('lko-4', 'lucknow', 'Alambagh', 'Kanhaiya Tiles & Marble', 'Tiling Contractor', 'tiler', 4.6, 18, 5, 9, 900, 'HSY-LKO-004'),
  p('lko-5', 'lucknow', 'Gomti Nagar', 'Rangoli Painters', 'Painting Contractor', 'painter', 4.7, 20, 8, 11, 720, 'HSY-LKO-005'),
  p('lko-6', 'lucknow', 'Aliganj', 'Shankar Woodworks', 'Lead Carpenter', 'carpenter', 4.6, 15, 4, 9, 950, 'HSY-LKO-006'),
  p('lko-7', 'lucknow', 'Gomti Nagar', 'Er. Anjali Verma', 'Structural Engineer (M.Tech Structures)', 'engineer', 4.9, 36, 1, 14, 0, 'HSY-LKO-007'),
  p('lko-8', 'lucknow', 'Indira Nagar', 'SealTech Waterproofing', 'Waterproofing Specialist', 'waterproofer', 4.7, 19, 4, 8, 1000, 'HSY-LKO-008'),
];

export const TRADES: Trade[] = ['mason', 'plumber', 'electrician', 'tiler', 'painter', 'carpenter', 'engineer', 'waterproofer'];
export const TRADE_LABEL: Record<Trade, string> = {
  mason: 'Mason', plumber: 'Plumber', electrician: 'Electrician', tiler: 'Tiler', painter: 'Painter',
  carpenter: 'Carpenter', engineer: 'Structural engineer', waterproofer: 'Waterproofing',
};

export const prosIn = (city: string, trade?: string) => {
  const id = getCity(city)?.id ?? city; // accept id or display name
  return PROS.filter((x) => x.city === id && (!trade || x.trade === trade)).sort((a, b) => b.rating - a.rating);
};

export class NoCoverageError extends Error {}
// Best-rated pro for a trade in the city. Throws rather than silently assigning someone from another city.
export function proForTrade(cityId: string, trade: Trade): Pro {
  const found = prosIn(cityId, trade)[0];
  if (!found) throw new NoCoverageError(`No verified ${TRADE_LABEL[trade].toLowerCase()} available in this city yet`);
  return found;
}
export const visitExpert = (cityId: string, needsEngineer?: boolean) => proForTrade(cityId, needsEngineer ? 'engineer' : 'mason');
