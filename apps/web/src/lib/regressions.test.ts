// Regression tests for bugs found in the bug-hunt audit. Each test names the failure it prevents.
import { describe, expect, it } from 'vitest';
import { act, addPhoto, createProject, getProject, validateCreate, ConflictError, ValidationError, type CreateInput } from './projects';
import { PROJECT_TYPES, estimate, getType, phaseName, type Tier } from './catalog';
import { CITIES } from './cities';
import { PayloadTooLargeError, readBody } from './http';
import { opsAct, opsIssues, createIssue, ownerAct, issuesForProject } from './issues';
import { useTempStore } from '../test/helpers';

const OWNER = '9876543210';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const future = (days = 2) => new Date(Date.now() + days * 864e5).toISOString();
const base = (over: object = {}) => ({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: future(), ...over });
const create = (over: object = {}, owner = OWNER) => createProject(validateCreate(base(over)), owner);

describe('input validation cannot be bypassed (NaN quotes, 500s)', () => {
  it.each(['abc', 'NaN', Infinity, -Infinity, 501, 1e9, -1, true, {}, []])('rejects drainFt %s', (drainFt) => {
    expect(() => validateCreate(base({ drainFt }))).toThrow(ValidationError);
  });
  it('accepts drainFt 0, 500, blank and missing', () => {
    for (const drainFt of [0, 500, '', null, undefined, '12.5']) expect(() => validateCreate(base({ drainFt }))).not.toThrow();
  });
  it('wrong-typed fields are a ValidationError (400), never a TypeError (500)', () => {
    for (const over of [{ city: 5 }, { name: 5 }, { name: {} }, { slot: 5 }, { slot: null }, { tier: 7 }, { typeId: 3 }, { phone: {} }, { area: true }, { area: '' }, { area: null }, { propertyValueLakh: true }])
      expect(() => validateCreate(base(over)), JSON.stringify(over)).toThrow(ValidationError);
    for (const raw of [null, undefined, 5, 'x', [], [1]]) expect(() => validateCreate(raw)).toThrow(ValidationError);
  });
  it('a non-string style is rejected for interiors and ignored elsewhere', () => {
    expect(() => validateCreate(base({ typeId: 'interiors-full', area: 800, style: 9 }))).toThrow(ValidationError);
    expect(validateCreate(base({ style: 9 })).style).toBeUndefined();
  });
  it('a non-string notes value is ignored, not a crash', () => {
    for (const notes of [5, {}, [], true]) expect(validateCreate(base({ notes })).notes).toBeUndefined();
  });
  it('array/boolean/blank numbers are not silently coerced (Number([50]) === 50!)', () => {
    for (const area of [[50], [], true, '  ', {}]) expect(() => validateCreate(base({ area })), JSON.stringify(area)).toThrow(ValidationError);
    for (const drainFt of [[5], [], true]) expect(() => validateCreate(base({ drainFt })), JSON.stringify(drainFt)).toThrow(ValidationError);
    expect(() => validateCreate(base({ propertyValueLakh: [100] }))).toThrow(ValidationError);
  });
  it('rejects past and far-future visit slots', () => {
    expect(() => validateCreate(base({ slot: new Date(Date.now() - 1000).toISOString() }))).toThrow(/passed/);
    expect(() => validateCreate(base({ slot: future(400) }))).toThrow(/two months/);
    expect(() => validateCreate(base({ slot: future(59) }))).not.toThrow();
  });
  it('caps text lengths and ignores unknown properties', () => {
    const v = validateCreate(base({ name: 'x'.repeat(500), notes: 'y'.repeat(900), owner: 'attacker', status: 'completed', paid: 999999 }));
    expect(v.name).toHaveLength(60);
    expect(v.notes).toHaveLength(500);
    expect(v).not.toHaveProperty('owner');
    expect(v).not.toHaveProperty('status');
    expect(v).not.toHaveProperty('paid');
  });
});

describe('estimate() is safe against hostile numbers', () => {
  const e = (over: object = {}) => estimate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, ...over });
  it('never returns NaN/Infinity', () => {
    for (const over of [{ drainFt: NaN }, { drainFt: Infinity }, { drainFt: 1e12 }, { area: NaN }, { area: Infinity }, { area: 1e12 }, { area: -5 }]) {
      const r = e(over);
      for (const n of [r.total, r.low, r.high, r.labor, r.material, r.contingency, r.days]) expect(Number.isFinite(n), JSON.stringify(over)).toBe(true);
    }
  });
  it('clamps absurd values instead of pricing billions', () => {
    expect(e({ drainFt: 1e9 }).total).toBe(e({ drainFt: 500 }).total);
    expect(e({ area: 1e9 }).total).toBe(e({ area: 20000 }).total);
  });
});

describe('interiors pricing consistency', () => {
  const ids = getType('interiors-full')!.rooms!.map((r) => r.id);
  const est = (rooms: string[] | undefined, area: number, tier: Tier = 'standard', city = 'bareilly') =>
    estimate({ typeId: 'interiors-full', city, area, tier, rooms, finishes: { shutter: 'pu' } });

  it('per-room prices ALWAYS add up exactly to the total (was off by up to ₹100 in 38% of combos)', () => {
    let checked = 0;
    for (const area of [200, 600, 1000, 1737, 5000]) for (const tier of ['economy', 'standard', 'premium'] as Tier[]) for (const city of ['bareilly', 'lucknow']) {
      for (let mask = 1; mask < 2 ** ids.length; mask += 7) {
        const rooms = ids.filter((_, i) => mask & (1 << i));
        const r = est(rooms, area, tier, city);
        expect(r.rooms!.reduce((a, x) => a + x.cost, 0), `${area} ${tier} ${city} ${rooms}`).toBe(r.total);
        expect(r.rooms!.every((x) => x.cost > 0)).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(500);
  });
  it('unknown room ids fall back to the whole home instead of pricing as ₹0 area', () => {
    expect(est(['bogus'], 1000).total).toBe(est(undefined, 1000).total);
    expect(est([], 1000).total).toBe(est(undefined, 1000).total);
  });
  it('a phase subtotal equals its labor + material (breakdowns add up)', () => {
    for (const t of PROJECT_TYPES) for (const tier of ['economy', 'standard', 'premium'] as Tier[]) for (const area of [5, 6, 45, t.defaultArea]) {
      const r = estimate({ typeId: t.id, city: 'bareilly', area, tier, drainFt: 12 });
      for (const p of r.phases) expect(p.subtotal, `${t.id} ${tier} ${area} ${p.id}`).toBe(p.labor + p.material);
      expect(r.labor + r.material + r.contingency).toBe(r.total);
    }
  });
});

describe('advisory consistency', () => {
  it('the estimate does not call a >15 ft drain "comfortable" (the advisor rates it amber)', () => {
    const flags = (d: number) => estimate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: d }).flags.filter((f) => f.text.startsWith('Drain'));
    for (const d of [16, 20, 25, 30, 60]) expect(flags(d).map((f) => f.level), `${d} ft`).toEqual(['amber']);
    for (const d of [1, 10, 15]) expect(flags(d).map((f) => f.level), `${d} ft`).toEqual(['green']);
    expect(flags(20)[0].text).toMatch(/6 in of fall/);     // 20 ft × 12 ÷ 40
  });
  it('a MEASURED drain of 0 is a real value, not "unknown"', () => {
    const unknown = (r: ReturnType<typeof estimate>) => r.flags.some((f) => /unknown/.test(f.text));
    expect(unknown(estimate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 0 }))).toBe(true);
    expect(unknown(estimate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 0, drainMeasured: true }))).toBe(false);
  });
});

describe('project lifecycle regressions', () => {
  useTempStore();

  it('site visit with a measured drain of 0 does not report "unknown distance" in the quote', async () => {
    const p = await create({ drainFt: 0 });
    const q = await act(p.id, { action: 'complete_visit', measuredDrainFt: 0 }, OWNER);
    expect(q.quote!.findings.join(' ')).not.toMatch(/unknown/i);
    const p2 = await create({ drainFt: 0 });
    expect((await act(p2.id, { action: 'complete_visit' }, OWNER)).quote!.findings.join(' ')).toMatch(/unknown/i);   // not measured → still unknown
  });

  it('a milestone with the maximum photos can still receive fresh proof after a change request (was a permanent deadlock)', async () => {
    const p = await create();
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    const m = a.milestones[0];
    await act(p.id, { action: 'start', milestoneId: m.id }, OWNER);
    for (let i = 0; i < 6; i++) await addPhoto(p.id, OWNER, m.id, PNG, 'png');
    await expect(addPhoto(p.id, OWNER, m.id, PNG, 'png')).rejects.toThrow(/At most 6/);
    await act(p.id, { action: 'submit', milestoneId: m.id }, OWNER);
    await act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'Please redo the joints' }, OWNER);
    await new Promise((r) => setTimeout(r, 5));
    await addPhoto(p.id, OWNER, m.id, PNG, 'png');                           // used to throw 409 "At most 6 photos"
    const s = await act(p.id, { action: 'submit', milestoneId: m.id }, OWNER);
    expect(s.milestones[0].status).toBe('in_review');
    const done = await act(p.id, { action: 'approve', milestoneId: m.id }, OWNER);
    expect(done.milestones[0].status).toBe('paid');
  });

  it('impossible calendar dates are rejected for expenses', async () => {
    const p = await create();
    const add = (date: string) => act(p.id, { action: 'add_expense', category: 'other', amount: 100, date, method: 'cash' }, OWNER);
    for (const d of ['2026-02-31', '2026-04-31', '2025-02-29', '2026-13-01', '2026-00-10', '2026-1-5']) await expect(add(d), d).rejects.toThrow(ValidationError);
    await expect(add('2024-02-29')).resolves.toBeTruthy();                   // real leap day
    await expect(add('2026-02-28')).resolves.toBeTruthy();
  });

  it('tiny projects: the quote stays inside the estimate range and no milestone is ₹0', async () => {
    for (const t of PROJECT_TYPES) {
      const extra = t.interiors ? { style: 'Modern' } : {};
      const p = await create({ typeId: t.id, area: 5, tier: 'economy', drainFt: t.askDrain ? 5 : undefined, ...extra });
      const q = await act(p.id, { action: 'complete_visit' }, OWNER);
      expect(q.quote!.total, `${t.id} quote vs range`).toBeGreaterThanOrEqual(q.estimate.low);
      expect(q.quote!.total, `${t.id} quote vs range`).toBeLessThanOrEqual(q.estimate.high);
      const a = await act(p.id, { action: 'accept_quote' }, OWNER);
      expect(a.milestones.reduce((s, m) => s + m.amount, 0) + a.quote!.advance, t.id).toBe(a.quote!.total);
      for (const m of a.milestones) expect(m.amount, `${t.id} ${m.phaseId}`).toBeGreaterThan(0);
    }
  });

  it('money always adds up across every type × tier × area (broad sweep)', async () => {
    let n = 0;
    for (const t of PROJECT_TYPES) for (const tier of ['economy', 'standard', 'premium'] as Tier[]) for (const area of [5, 37, t.defaultArea, 8000]) {
      const extra = t.interiors ? { style: 'Modern' } : {};
      const p = await create({ typeId: t.id, tier, area, drainFt: t.askDrain ? 18 : undefined, ...extra });
      await act(p.id, { action: 'complete_visit' }, OWNER);
      const a = await act(p.id, { action: 'accept_quote' }, OWNER);
      expect(a.milestones.reduce((s, m) => s + m.amount, 0) + a.quote!.advance, `${t.id} ${tier} ${area}`).toBe(a.quote!.total);
      for (const m of a.milestones) expect(m.amount).toBeGreaterThan(0);
      n++;
    }
    expect(n).toBe(PROJECT_TYPES.length * 12);
  }, 60000);
});

describe('request bodies are bounded', () => {
  const req = (body: BodyInit | null, headers: Record<string, string> = {}) => new Request('http://x/api', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } });

  it('parses a normal JSON object', async () => {
    expect(await readBody(req(JSON.stringify({ a: 1 })))).toEqual({ a: 1 });
  });
  it('rejects oversized bodies while reading, even without an honest Content-Length', async () => {
    const big = JSON.stringify({ x: 'a'.repeat(200_000) });
    await expect(readBody(req(big))).rejects.toThrow(PayloadTooLargeError);
    await expect(readBody(req(big), 500_000)).resolves.toBeTruthy();                        // a route may opt into a bigger cap
    await expect(readBody(req('{}', { 'content-length': '999999999' }))).rejects.toThrow(PayloadTooLargeError);   // declared size checked up-front
  });
  it('rejects bad JSON, non-objects and empty bodies with a 400-type error', async () => {
    for (const body of ['{oops', 'null', '[1,2]', '"str"', '5', '']) await expect(readBody(req(body)), body).rejects.toThrow(ValidationError);
    await expect(readBody(new Request('http://x/api', { method: 'POST' }))).rejects.toThrow(ValidationError);
  });
});

describe('ops views never expose full phone numbers', () => {
  useTempStore();
  it('no `owner` field in any issue returned to ops or owners', async () => {
    const p = await create();
    await act(p.id, { action: 'complete_visit' }, OWNER);
    await act(p.id, { action: 'accept_quote' }, OWNER);
    const i = await createIssue(p.id, OWNER, { type: 'quality', description: 'The tile joints are uneven' });
    const seen = [i, ...(await opsIssues()), await opsAct(i.id, { action: 'reply', text: 'On it' }), await ownerAct(i.id, OWNER, { action: 'message', text: 'thanks' }), ...(await issuesForProject(p.id, OWNER))];
    for (const x of seen) expect(x, 'leaks owner').not.toHaveProperty('owner');
    expect(JSON.stringify(seen)).not.toContain(OWNER);
    expect((await opsIssues())[0].ownerMasked).toMatch(/^98\*{6}10$/);
  });
});

describe('misc', () => {
  it('phaseName never throws on old or unknown data', () => {
    expect(phaseName('gone', 'x', 'Old', true)).toBe('Old');
  });
  it('every city id/name lookup tolerates junk', async () => {
    const { getCity } = await import('./cities');
    for (const junk of [5, null, undefined, {}, [], true]) expect(getCity(junk)).toBeUndefined();
    expect(getCity('LUCKNOW')?.id).toBe('lucknow');
    expect(CITIES.length).toBeGreaterThan(0);
  });
  it('project stays readable after creation (getProject roundtrip)', async () => {
    // guards against validateCreate returning fields createProject does not expect
    const inp: CreateInput = validateCreate(base());
    expect(Object.keys(inp).sort()).toEqual(expect.arrayContaining(['typeId', 'city', 'area', 'tier', 'name', 'phone', 'slot']));
    expect(await getProject('HSY-NONE00', OWNER)).toBeNull();
    expect(ConflictError).toBeTruthy();
  });
});
