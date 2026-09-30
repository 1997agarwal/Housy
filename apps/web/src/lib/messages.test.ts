import { describe, expect, it } from 'vitest';
import { en, hi, translate, type Key } from './messages';
import { PROJECT_TYPES, CATEGORIES, estimate, phaseName } from './catalog';
import { CITIES } from './cities';
import { GOALS, LANGUAGES, PERSONAS, PROPERTY_TYPES, TIMELINES } from './profile-shared';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const keys = Object.keys(en) as Key[];

describe('translations', () => {
  it('Hindi defines exactly the same keys as English', () => {
    expect(Object.keys(hi).sort()).toEqual([...keys].sort());
  });
  it('every string is non-empty and keeps the same {placeholders}', () => {
    for (const k of keys) {
      expect(hi[k].trim().length, k).toBeGreaterThan(0);
      expect(placeholders(hi[k]), k).toEqual(placeholders(en[k]));
    }
  });
  it('Hindi strings actually contain Devanagari (not copied English), except brand-only strings', () => {
    const untranslatedOk = new Set<Key>([]);
    for (const k of keys) if (!untranslatedOk.has(k)) expect(/[ऀ-ॿ]/.test(hi[k]), `${k}: ${hi[k]}`).toBe(true);
  });
  it('interpolates variables and falls back safely', () => {
    expect(translate('en', 'grid.showing', { city: 'Agra' })).toBe('Showing prices for Agra');
    expect(translate('hi', 'grid.showing', { city: 'आगरा' })).toBe('आगरा के दाम दिख रहे हैं');
    expect(translate('en', 'grid.showing', {})).toContain('{city}');       // missing var stays visible, never "undefined"
    expect(translate('hi', 'nav.services')).toBe('सेवाएँ');
  });
  it('option labels used by the sign-up form are all translated', () => {
    const groups: [Record<string, string>, string][] = [[PERSONAS, 'persona.'], [PROPERTY_TYPES, 'ptype.'], [GOALS, 'goal.'], [TIMELINES, 'when.']];
    for (const [obj, prefix] of groups) for (const k of Object.keys(obj)) expect(keys, `${prefix}${k}`).toContain(`${prefix}${k}`);
    expect(Object.keys(LANGUAGES)).toEqual(['en', 'hi']);
  });
});

describe('data-level Hindi', () => {
  it('every phase of every project type has a Hindi name, and every flag the engine can raise has Hindi text', () => {
    for (const t of PROJECT_TYPES) for (const ph of t.phases) expect(/[\u0900-\u097F]/.test(ph.nameHi ?? ''), `${t.id}.${ph.id}`).toBe(true);
    for (const t of PROJECT_TYPES) for (const drainFt of [0, 10, 40]) for (const tier of ['economy', 'premium'] as const)
      for (const f of estimate({ typeId: t.id, city: 'bareilly', area: t.defaultArea, tier, drainFt }).flags) expect(/[\u0900-\u097F]/.test(f.textHi ?? ''), `${t.id}: ${f.text}`).toBe(true);
  });
  it('phaseName falls back to the stored English name when there is no translation (e.g. change orders)', () => {
    expect(phaseName('new-bathroom', 'demo', 'Marking, core-cutting & demolition', true)).toContain('कोर-कटिंग');
    expect(phaseName('new-bathroom', 'demo', 'Marking', false)).toBe('Marking');
    expect(phaseName('new-bathroom', 'change-X', 'Change: Extra socket', true)).toBe('बदलाव: Extra socket');
    expect(phaseName('new-bathroom', 'change-X', 'Change: Extra socket', false)).toBe('Change: Extra socket');
    expect(phaseName('nope', 'demo', 'Old data', true)).toBe('Old data');
  });
  it('every project type and category has Hindi copy', () => {
    for (const t of PROJECT_TYPES) { expect(/[ऀ-ॿ]/.test(t.titleHi ?? ''), t.id).toBe(true); expect(/[ऀ-ॿ]/.test(t.taglineHi ?? ''), t.id).toBe(true); }
    for (const c of Object.keys(CATEGORIES)) { expect(keys).toContain(`cat.${c}` as Key); expect(keys).toContain(`cat.${c}.d` as Key); }
  });
  it('every city has a Hindi name', () => {
    for (const c of CITIES) expect(/[ऀ-ॿ]/.test(c.hi ?? ''), c.id).toBe(true);
  });
});
