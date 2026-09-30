// Browser-safe: constants, types and validation. Storage lives in profile.ts (server only).
import { getCity } from './cities';

export const PERSONAS = { local: 'I live in or near the property', away: 'I live in another city', nri: 'I live abroad (NRI)' } as const;
export const PROPERTY_TYPES = { house: 'Independent house', apartment: 'Apartment / flat', villa: 'Villa', plot: 'Plot / land', commercial: 'Shop / office' } as const;
export const GOALS = { build: 'Build a new home', renovate: 'Renovate my home', interiors: 'Design my interiors' } as const;
export const TIMELINES = { now: 'Ready to start now', '1-3m': 'In 1–3 months', '3-6m': 'In 3–6 months', exploring: 'Just exploring' } as const;
export const LANGUAGES = { en: 'English', hi: 'हिन्दी (Hindi)' } as const;

export type Persona = keyof typeof PERSONAS;
export type Goal = keyof typeof GOALS;
export interface Profile {
  phone: string; name: string; email?: string; language: keyof typeof LANGUAGES; persona: Persona;
  city: string;                       // city id where the property is
  propertyType: keyof typeof PROPERTY_TYPES; propertyAreaSqft?: number; propertyValueLakh?: number;
  goals: Goal[]; timeline: keyof typeof TIMELINES;
  createdAt: string; updatedAt: string;
}
export class ProfileError extends Error {}

const has = <T extends object>(o: T, k: unknown): k is keyof T => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const optNum = (v: unknown, min: number, max: number, label: string) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (!(n >= min && n <= max)) throw new ProfileError(`${label} looks wrong`);
  return n;
};

export function validateProfile(raw: any): Omit<Profile, 'phone' | 'createdAt' | 'updatedAt'> {
  const name = String(raw?.name ?? '').trim();
  if (name.length < 2 || name.length > 60) throw new ProfileError('Enter your full name');
  const email = String(raw?.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new ProfileError('Enter a valid email or leave it blank');
  if (!has(LANGUAGES, raw?.language)) throw new ProfileError('Choose a language');
  if (!has(PERSONAS, raw?.persona)) throw new ProfileError('Tell us where you live relative to the property');
  const city = getCity(raw?.city);
  if (!city) throw new ProfileError('Choose the city where your property is');
  if (!has(PROPERTY_TYPES, raw?.propertyType)) throw new ProfileError('Choose a property type');
  if (!has(TIMELINES, raw?.timeline)) throw new ProfileError('Choose a timeline');
  const goals = Array.isArray(raw?.goals) ? [...new Set(raw.goals)].filter((g): g is Goal => has(GOALS, g)) : [];
  if (goals.length === 0) throw new ProfileError('Pick at least one thing you want to do');
  return {
    name, email: email || undefined, language: raw.language, persona: raw.persona, city: city.id,
    propertyType: raw.propertyType, propertyAreaSqft: optNum(raw.propertyAreaSqft, 50, 200000, 'Property area'),
    propertyValueLakh: optNum(raw.propertyValueLakh, 1, 1_000_000, 'Property value'), goals, timeline: raw.timeline,
  };
}

