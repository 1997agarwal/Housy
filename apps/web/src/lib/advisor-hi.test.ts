import { describe, expect, it } from 'vitest';
import { checkBathroom, checkWall, DISCLAIMER, type BathInput, type WallInput } from './advisor';
import { DISCLAIMER_HI, advisorText, localizeVerdict } from './advisor-hi';

const HI = /[ऀ-ॿ]/;
const combos = <T extends object>(spec: { [K in keyof T]: T[K][] }): T[] =>
  (Object.keys(spec) as (keyof T)[]).reduce<Partial<T>[]>((acc, k) => acc.flatMap((a) => (spec[k] as unknown[]).map((v) => ({ ...a, [k]: v }))), [{}]) as T[];

describe('advisor Hindi', () => {
  it('every sentence of every wall verdict is translated', () => {
    const inputs = combos<WallInput>({ construction: ['rcc', 'masonry', 'unsure'], position: ['interior', 'exterior'], thickness: ['partition', 'brick9', 'thick', 'unsure'],
      above: ['floor', 'roof', 'unsure'], beamAbove: ['yes', 'no', 'unsure'], services: ['yes', 'no', 'unsure'], age: ['new', 'mid', 'old'], opening: ['door', 'wide', 'full'] });
    const missing = new Set<string>();
    for (const i of inputs) {
      const v = checkWall(i);
      for (const s of [v.headline, ...v.reasons.map((r) => r.text), ...v.steps]) if (!HI.test(advisorText(s, 'hi'))) missing.add(s);
    }
    expect([...missing]).toEqual([]);
  });
  it('every sentence of every bathroom verdict is translated', () => {
    const inputs = combos<BathInput>({ floor: ['ground', 'upper'], drainFt: [0, 5, 15, 16, 25, 31, 60], below: ['room', 'none', 'unsure'], shaft: ['yes', 'no', 'unsure'], ventilation: ['window', 'none'] });
    const missing = new Set<string>();
    for (const i of inputs) {
      const v = checkBathroom(i);
      for (const s of [v.headline, ...v.reasons.map((r) => r.text), ...v.steps]) if (!HI.test(advisorText(s, 'hi'))) missing.add(s);
    }
    expect([...missing]).toEqual([]);
  });
  it('keeps the level, English is untouched, and numbers survive', () => {
    const v = checkBathroom({ floor: 'ground', drainFt: 22, below: 'none', shaft: 'yes', ventilation: 'window' });
    expect(localizeVerdict(v, 'en')).toBe(v);
    const h = localizeVerdict(v, 'hi');
    expect(h.level).toBe(v.level);
    expect(h.reasons[0].text).toContain('22');
    expect(h.reasons[0].text).toContain(String(v.fallInches));
    expect(HI.test(DISCLAIMER_HI) && DISCLAIMER.length > 0).toBe(true);
  });
});
