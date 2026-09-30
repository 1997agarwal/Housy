import type { Trade } from './catalog';
import { getCity } from './cities';

// Seed data. In production these come from `poc_profiles` (field-agent onboarded), keyed by city_id.
export interface Pro {
  id: string; city: string; locality: string; name: string; role: string; trade: Trade;
  rating: number; reviews: number; crew: number; years: number; dayRate: number; housyId: string;
  partnerId?: string;   // set for crews/designers who registered themselves (seed crews have none); rating 0 = new, no reviews yet
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
  p('bly-9', 'bareilly', 'Civil Lines', 'Studio Nivas Interiors', 'Interior Designer', 'designer', 4.8, 21, 3, 9, 0, 'HSY-BLY-009'),
  p('bly-10', 'bareilly', 'Rajendra Nagar', 'Ar. Meenal Gupta', 'Architect (COA registered)', 'architect', 4.9, 17, 2, 12, 0, 'HSY-BLY-010'),
  p('lko-9', 'lucknow', 'Gomti Nagar', 'Casa Design Studio', 'Interior Designer', 'designer', 4.8, 28, 4, 10, 0, 'HSY-LKO-009'),
  p('lko-10', 'lucknow', 'Aliganj', 'Ar. Rohit Bajpai', 'Architect (COA registered)', 'architect', 4.8, 19, 3, 13, 0, 'HSY-LKO-010'),
  p('lko-8', 'lucknow', 'Indira Nagar', 'SealTech Waterproofing', 'Waterproofing Specialist', 'waterproofer', 4.7, 19, 4, 8, 1000, 'HSY-LKO-008'),
];

export const TRADES: Trade[] = ['mason', 'plumber', 'electrician', 'tiler', 'painter', 'carpenter', 'engineer', 'waterproofer', 'architect', 'designer'];
export const TRADE_LABEL: Record<Trade, string> = {
  mason: 'Mason', plumber: 'Plumber', electrician: 'Electrician', tiler: 'Tiler', painter: 'Painter',
  carpenter: 'Carpenter', engineer: 'Structural engineer', waterproofer: 'Waterproofing', architect: 'Architect', designer: 'Interior designer',
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
export const visitExpert = (cityId: string, trade: Trade) => proForTrade(cityId, trade);
