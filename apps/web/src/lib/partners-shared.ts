// Crews, contractors and interior designers who list themselves on Housy. Browser-safe: types, limits, validation.
import type { Trade } from './catalog';
import { getCity } from './cities';
import { toNum } from './num';

export class PartnerError extends Error {}

export type PartnerKind = 'crew' | 'designer';
export type PartnerStatus = 'pending' | 'approved' | 'suspended';

export const CREW_TRADES = ['mason', 'plumber', 'electrician', 'tiler', 'painter', 'carpenter', 'waterproofer', 'engineer'] as const satisfies readonly Trade[];
export const DESIGNER_TRADES = ['designer', 'architect'] as const satisfies readonly Trade[];
export const TRADES_FOR = { crew: CREW_TRADES, designer: DESIGNER_TRADES } as const;
export const DESIGN_STYLES = ['Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Scandinavian'] as const;

export const PARTNER_LIMITS = { name: 60, locality: 60, bio: 400, rateMin: 300, rateMax: 20000, feeMax: 5000, crewMax: 200, yearsMax: 60 } as const;

// What a person types when they register or edit their listing.
export interface PartnerInput {
  kind: PartnerKind;
  name: string;               // person or firm name shown to customers
  city: string;               // city id where they work
  locality: string;
  trades: Trade[];            // what they do (one or more)
  services: string[];         // project-type ids they take; empty = any job that needs their trade
  dayRate: number;            // ₹ per day (crews); designers: 0
  feePerSqft: number;         // ₹ per sq ft design fee (designers); crews: 0
  styles: string[];           // designers: styles they design in
  crewSize: number;
  years: number;
  bio: string;
  available: boolean;         // can take new work right now
}

export interface Partner extends PartnerInput {
  id: string; phone: string; status: PartnerStatus; housyId?: string;
  createdAt: string; updatedAt: string; reviewNote?: string;
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const list = (v: unknown, max = 20): string[] => (Array.isArray(v) ? v.filter(isStr).slice(0, max) : []);

export function validatePartnerInput(raw: unknown, knownServices: readonly string[]): PartnerInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new PartnerError('Send your details as an object');
  const r = raw as Record<string, unknown>;
  if (r.kind !== 'crew' && r.kind !== 'designer') throw new PartnerError('Choose whether you are a crew or a designer');
  const kind: PartnerKind = r.kind;
  const name = isStr(r.name) ? r.name.trim() : '';
  if (name.length < 2) throw new PartnerError('Enter your name or firm name');
  const city = isStr(r.city) ? getCity(r.city)?.id : undefined;
  if (!city) throw new PartnerError('Choose the city you work in');
  const locality = isStr(r.locality) ? r.locality.trim().slice(0, PARTNER_LIMITS.locality) : '';
  if (!locality) throw new PartnerError('Enter your area or locality');
  const allowed: readonly string[] = TRADES_FOR[kind];
  const trades = [...new Set(list(r.trades))].filter((t) => allowed.includes(t)) as Trade[];
  if (trades.length === 0) throw new PartnerError(kind === 'crew' ? 'Choose at least one trade you work in' : 'Choose whether you are an interior designer, an architect or both');
  const services = [...new Set(list(r.services, 40))].filter((s) => knownServices.includes(s));
  const styles = kind === 'designer' ? [...new Set(list(r.styles))].filter((s) => (DESIGN_STYLES as readonly string[]).includes(s)) : [];

  const num = (v: unknown, min: number, max: number, what: string, blankOk = false) => {
    if (blankOk && (v === '' || v == null)) return 0;
    const n = toNum(v);
    if (!Number.isFinite(n) || n < min || n > max) throw new PartnerError(`${what} must be between ${min} and ${max}`);
    return Math.round(n);
  };
  const dayRate = kind === 'crew' ? num(r.dayRate, PARTNER_LIMITS.rateMin, PARTNER_LIMITS.rateMax, 'Day rate') : 0;
  const feePerSqft = kind === 'designer' ? num(r.feePerSqft, 20, PARTNER_LIMITS.feeMax, 'Design fee per sq ft') : 0;
  const crewSize = kind === 'crew' ? num(r.crewSize, 1, PARTNER_LIMITS.crewMax, 'Crew size') : 1;
  const years = num(r.years, 0, PARTNER_LIMITS.yearsMax, 'Years of experience');
  const bio = isStr(r.bio) ? r.bio.trim().slice(0, PARTNER_LIMITS.bio) : '';
  return { kind, name: name.slice(0, PARTNER_LIMITS.name), city, locality, trades, services, dayRate, feePerSqft, styles, crewSize, years, bio, available: r.available !== false };
}
