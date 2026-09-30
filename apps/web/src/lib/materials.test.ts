import { describe, expect, it } from 'vitest';
import { PROJECT_TYPES } from './catalog';
import { MATERIALS, materialsFor } from './materials';

const HI = /[ऀ-ॿ]/;
describe('materials guide', () => {
  it('every project type has guidance, and every entry is complete in both languages for all three tiers', () => {
    for (const t of PROJECT_TYPES) expect(materialsFor(t.id).length, t.id).toBeGreaterThanOrEqual(2);
    for (const [typeId, items] of Object.entries(MATERIALS)) for (const m of items) {
      for (const l of [m.name, m.tip, m.pick.economy, m.pick.standard, m.pick.premium]) {
        expect(l.en.length, `${typeId}/${m.id}`).toBeGreaterThan(5);
        expect(HI.test(l.hi), `${typeId}/${m.id}: ${l.en}`).toBe(true);
      }
    }
  });
  it('only refers to project types that exist and has no duplicate materials in one type', () => {
    const ids = new Set(PROJECT_TYPES.map((t) => t.id));
    for (const [typeId, items] of Object.entries(MATERIALS)) {
      expect(ids.has(typeId), typeId).toBe(true);
      expect(new Set(items.map((m) => m.id)).size, typeId).toBe(items.length);
    }
  });
  it('gives no prices or brand names (they go stale and read as endorsements)', () => {
    const text = JSON.stringify(MATERIALS);
    expect(text).not.toMatch(/₹|Rs\.?\s?\d/);
    expect(text).not.toMatch(/Asian Paints|Berger|Kajaria|Ultratech|Jaguar|Hindware/i);
  });
});
