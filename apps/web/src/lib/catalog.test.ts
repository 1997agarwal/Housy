import { describe, expect, it } from 'vitest';
import { PROJECT_TYPES, estimate, getType, interiorBudgetGuide, type Tier } from './catalog';
import { CITIES } from './cities';
import { prosIn } from './pros';

const base = (typeId: string, over: object = {}) => {
  const t = getType(typeId)!;
  return estimate({ typeId, city: 'bareilly', area: t.defaultArea, tier: 'standard', drainFt: 15, ...over });
};

describe('estimate engine', () => {
  it('adds up: phases + contingency = total', () => {
    for (const t of PROJECT_TYPES) {
      const e = base(t.id);
      expect(e.labor + e.material + e.contingency).toBe(e.total);
      expect(e.phases.reduce((a, p) => a + p.subtotal, 0)).toBeGreaterThan(0);
      expect(e.low).toBeLessThan(e.total);
      expect(e.high).toBeGreaterThan(e.total);
      expect(e.days).toBeGreaterThan(0);
    }
  });

  it('contingency is ~15% of labor + material', () => {
    const e = base('new-bathroom');
    expect(Math.abs(e.contingency - (e.labor + e.material) * 0.15)).toBeLessThanOrEqual(50);
  });

  it('cost rises with area, tier and city multiplier', () => {
    for (const id of ['new-bathroom', 'interiors-full', 'new-house']) {
      const t = getType(id)!;
      expect(base(id, { area: t.defaultArea * 2 }).total).toBeGreaterThan(base(id).total);
      const tiers = (['economy', 'standard', 'premium'] as Tier[]).map((tier) => base(id, { tier }).total);
      expect(tiers[0]).toBeLessThan(tiers[1]);
      expect(tiers[1]).toBeLessThan(tiers[2]);
      expect(base(id, { city: 'mumbai' }).total).toBeGreaterThan(base(id, { city: 'bareilly' }).total);
    }
  });

  it('tier changes materials, not labor', () => {
    const a = base('new-bathroom', { tier: 'economy' }), b = base('new-bathroom', { tier: 'premium' });
    expect(a.labor).toBe(b.labor);
    expect(a.material).toBeLessThan(b.material);
  });

  it('flags structural work as red, long drains as amber', () => {
    expect(base('wall-break').flags.some((f) => f.level === 'red')).toBe(true);
    expect(base('new-bathroom', { drainFt: 40 }).flags.some((f) => f.level === 'amber')).toBe(true);
    expect(base('new-bathroom', { drainFt: 10 }).flags.every((f) => f.level !== 'amber')).toBe(true);
  });

  it('rejects unknown project types', () => {
    expect(() => estimate({ typeId: 'nope', city: 'bareilly', area: 100, tier: 'standard' })).toThrow();
  });

  it('interiors budget guide is 8–12% of property value', () => {
    const g = interiorBudgetGuide(100);
    expect(g.low).toBe(800000);
    expect(g.high).toBe(1200000);
  });

  it('standard full-home interiors for 1000 sq ft sits near the 8–12% guide for a ₹1cr home', () => {
    const e = base('interiors-full', { area: 1000 });
    expect(e.total).toBeGreaterThan(800000);
    expect(e.total).toBeLessThan(1500000);
  });
});

describe('interiors: rooms and finishes', () => {
  const full = () => base('interiors-full', { area: 1000 });
  const ids = getType('interiors-full')!.rooms!.map((r) => r.id);

  it('room weights sum to 1', () => {
    expect(getType('interiors-full')!.rooms!.reduce((a, r) => a + r.weight, 0)).toBeCloseTo(1, 5);
  });
  it('all rooms selected (or none given) equals the whole-home price', () => {
    expect(base('interiors-full', { area: 1000, rooms: ids }).total).toBe(full().total);
  });
  it('fewer rooms cost less, more rooms cost more', () => {
    const two = base('interiors-full', { area: 1000, rooms: ['living', 'kitchen'] }).total;
    const four = base('interiors-full', { area: 1000, rooms: ['living', 'kitchen', 'master', 'bedroom2'] }).total;
    expect(two).toBeLessThan(four);
    expect(four).toBeLessThan(full().total);
  });
  it('gives an approximate price per selected room that adds up to the total', () => {
    const e = base('interiors-full', { area: 1000, rooms: ['living', 'kitchen', 'master'] });
    expect(e.rooms!.map((r) => r.id)).toEqual(['living', 'kitchen', 'master']);
    expect(Math.abs(e.rooms!.reduce((a, r) => a + r.cost, 0) - e.total)).toBeLessThanOrEqual(150);
    expect(e.rooms!.find((r) => r.id === 'living')!.cost).toBeGreaterThan(e.rooms!.find((r) => r.id === 'pooja' as never)?.cost ?? 0);
  });
  it('non-interiors types have no room breakdown', () => expect(base('new-bathroom').rooms).toBeUndefined());

  it('a finish grade changes only its own phase’s materials', () => {
    const a = base('interiors-full', { area: 1000, finishes: { shutter: 'laminate' } });
    const b = base('interiors-full', { area: 1000, finishes: { shutter: 'pu' } });
    const ph = (e: typeof a, id: string) => e.phases.find((p) => p.id === id)!;
    expect(ph(b, 'carpentry').material).toBeGreaterThan(ph(a, 'carpentry').material * 1.35);
    expect(ph(b, 'carpentry').labor).toBe(ph(a, 'carpentry').labor);
    for (const id of ['design', 'civil', 'electrical', 'walls', 'furnish']) expect(ph(b, id).subtotal).toBe(ph(a, id).subtotal);
  });
  it('unknown finish ids are ignored by the engine (validation rejects them earlier)', () => {
    expect(base('interiors-full', { area: 1000, finishes: { shutter: 'gold-plated' } }).total).toBe(full().total);
  });
});

describe('coverage invariants', () => {
  const live = CITIES.filter((c) => c.status === 'live');
  it('has at least one live city', () => expect(live.length).toBeGreaterThan(0));

  // If this fails, accepting a quote in a live city would throw NoCoverageError mid-project.
  it('every live city has a crew for every trade any project type uses (incl. the first-visit expert)', () => {
    for (const c of live) for (const t of PROJECT_TYPES) {
      const trades = new Set(t.phases.map((p) => p.trade));
      trades.add(t.expert ?? (t.needsEngineer ? 'engineer' : 'mason'));
      for (const trade of trades) expect(prosIn(c.id, trade).length, `${c.name} needs a ${trade} for "${t.title}"`).toBeGreaterThan(0);
    }
  });

  it('non-live cities never list crews', () => {
    for (const c of CITIES.filter((c) => c.status === 'soon')) expect(prosIn(c.id)).toHaveLength(0);
  });
});
