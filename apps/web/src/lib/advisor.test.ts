import { describe, expect, it } from 'vitest';
import { checkBathroom, checkWall, fallInches, type BathInput, type WallInput } from './advisor';

const wall = (o: Partial<WallInput> = {}): WallInput => ({ construction: 'rcc', position: 'interior', thickness: 'partition', above: 'roof', beamAbove: 'yes', services: 'no', age: 'new', opening: 'door', ...o });
const bath = (o: Partial<BathInput> = {}): BathInput => ({ floor: 'ground', drainFt: 10, below: 'none', shaft: 'yes', ventilation: 'window', ...o });
const RANK = { green: 0, amber: 1, red: 2 } as const;

describe('wall advisor', () => {
  it('a half-brick partition in an RCC building with no complications is green', () => {
    expect(checkWall(wall()).level).toBe('green');
  });
  it('exterior walls and thick walls are always red', () => {
    for (const c of ['rcc', 'masonry', 'unsure'] as const) {
      expect(checkWall(wall({ construction: c, position: 'exterior' })).level).toBe('red');
      expect(checkWall(wall({ construction: c, thickness: 'thick' })).level).toBe('red');
    }
  });
  it('in load-bearing masonry, anything thicker than a partition is red — even a door opening', () => {
    for (const thickness of ['brick9', 'thick', 'unsure'] as const)
      expect(checkWall(wall({ construction: 'masonry', thickness, opening: 'door' })).level).toBe('red');
  });
  it('a masonry partition is green on the top floor but amber with a floor above', () => {
    expect(checkWall(wall({ construction: 'masonry', above: 'roof' })).level).toBe('green');
    expect(checkWall(wall({ construction: 'masonry', above: 'floor' })).level).toBe('amber');
  });
  it('a 9" wall in an RCC frame is amber, but red if a floor sits above with no beam', () => {
    expect(checkWall(wall({ thickness: 'brick9' })).level).toBe('amber');
    expect(checkWall(wall({ thickness: 'brick9', above: 'floor', beamAbove: 'no' })).level).toBe('red');
  });
  it('wide openings need care in RCC and are red in masonry', () => {
    expect(checkWall(wall({ opening: 'wide' })).level).toBe('amber');
    expect(checkWall(wall({ opening: 'full' })).level).toBe('amber');
    expect(checkWall(wall({ construction: 'masonry', opening: 'wide' })).level).toBe('red');
  });
  it('old buildings and services inside the wall raise green to amber', () => {
    expect(checkWall(wall({ age: 'old' })).level).toBe('amber');
    expect(checkWall(wall({ services: 'yes' })).level).toBe('amber');
  });

  it('SAFETY: any "not sure" answer can never produce green', () => {
    for (const k of ['construction', 'thickness', 'above', 'beamAbove', 'services'] as const)
      expect(checkWall(wall({ [k]: 'unsure' } as Partial<WallInput>)).level, k).not.toBe('green');
  });
  it('SAFETY: unknown construction with a non-partition wall is red', () => {
    expect(checkWall(wall({ construction: 'unsure', thickness: 'brick9' })).level).toBe('red');
    expect(checkWall(wall({ construction: 'unsure', thickness: 'partition' })).level).toBe('amber');
  });
  it('SAFETY: exhaustive — no combination of answers is green unless it is a plain, known partition', () => {
    const opts = { construction: ['rcc', 'masonry', 'unsure'], position: ['interior', 'exterior'], thickness: ['partition', 'brick9', 'thick', 'unsure'],
      above: ['floor', 'roof', 'unsure'], beamAbove: ['yes', 'no', 'unsure'], services: ['yes', 'no', 'unsure'], age: ['new', 'mid', 'old'], opening: ['door', 'wide', 'full'] } as const;
    let greens = 0, total = 0;
    const keys = Object.keys(opts) as (keyof typeof opts)[];
    const walk = (idx: number, cur: Record<string, string>) => {
      if (idx === keys.length) {
        total++;
        const w = cur as unknown as WallInput;
        if (checkWall(w).level === 'green') {
          greens++;
          expect(w.thickness, JSON.stringify(w)).toBe('partition');
          expect(w.position).toBe('interior');
          expect(w.construction).not.toBe('unsure');
          expect([w.above, w.beamAbove, w.services]).not.toContain('unsure');
          expect(w.services).toBe('no');
          expect(w.age).not.toBe('old');
          expect(w.opening).toBe(w.construction === 'rcc' ? 'door' : w.opening);
          expect(w.construction === 'masonry' ? w.above : 'roof').toBe('roof');
        }
        return;
      }
      for (const v of opts[keys[idx]]) walk(idx + 1, { ...cur, [keys[idx]]: v });
    };
    walk(0, {});
    expect(total).toBe(3 * 2 * 4 * 3 * 3 * 3 * 3 * 3);
    expect(greens).toBeGreaterThan(0);
    expect(greens / total).toBeLessThan(0.1);           // green is rare by design
  });
  it('the verdict is the worst reason, and the professional matches', () => {
    const v = checkWall(wall({ construction: 'masonry', thickness: 'brick9' }));
    expect(v.level).toBe('red');
    expect(v.professional).toBe('engineer');
    expect(checkWall(wall()).professional).toBe('mason');
    expect(v.steps[0]).toMatch(/Do not start/);
  });
});

describe('bathroom advisor', () => {
  it('computes the fall needed at 1:40', () => {
    expect(fallInches(10)).toBe(3);
    expect(fallInches(18.4)).toBe(5.5);
    expect(fallInches(40)).toBe(12);
  });
  it('a short drain on the ground floor with a shaft and a window is green', () => {
    expect(checkBathroom(bath()).level).toBe('green');
  });
  it('longer drains are amber then red; thresholds are tighter on upper floors', () => {
    expect(checkBathroom(bath({ drainFt: 20 })).level).toBe('amber');
    expect(checkBathroom(bath({ drainFt: 35 })).level).toBe('red');
    expect(checkBathroom(bath({ floor: 'upper', drainFt: 10, below: 'none' })).level).toBe('amber');
    expect(checkBathroom(bath({ floor: 'upper', drainFt: 22 })).level).toBe('red');
    expect(checkBathroom(bath({ floor: 'ground', drainFt: 22 })).level).toBe('amber');
  });
  it('upper floor with a room below warns about leaks', () => {
    const v = checkBathroom(bath({ floor: 'upper', below: 'room' }));
    expect(v.reasons.some((r) => /leak/i.test(r.text))).toBe(true);
  });
  it('missing shaft or ventilation makes it amber', () => {
    expect(checkBathroom(bath({ shaft: 'no' })).level).toBe('amber');
    expect(checkBathroom(bath({ ventilation: 'none' })).level).toBe('amber');
  });
  it('SAFETY: unknown drain distance or unsure answers are never green', () => {
    expect(checkBathroom(bath({ drainFt: 0 })).level).not.toBe('green');
    expect(checkBathroom(bath({ drainFt: NaN })).level).not.toBe('green');
    expect(checkBathroom(bath({ shaft: 'unsure' })).level).not.toBe('green');
    expect(checkBathroom(bath({ floor: 'upper', below: 'unsure' })).level).not.toBe('green');
  });
  it('MONOTONIC: a longer drain never lowers severity', () => {
    for (const floor of ['ground', 'upper'] as const) {
      let prev = 0;
      for (let d = 1; d <= 60; d++) { const r = RANK[checkBathroom(bath({ floor, drainFt: d })).level]; expect(r, `${floor} ${d}ft`).toBeGreaterThanOrEqual(prev); prev = r; }
    }
  });
});
