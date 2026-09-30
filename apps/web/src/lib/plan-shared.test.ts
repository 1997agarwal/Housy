import { describe, expect, it } from 'vitest';
import { ROOM_TYPES, TEMPLATES, LIMITS, PlanError, addRoom, area, carpetArea, drainRunFt, freeSpot, fromTemplate, gapFt, interiorRoomIds, overlap, overlappingIds, totalArea, validatePlan, type Room } from './plan-shared';
import { getType } from './catalog';

const room = (o: Partial<Room> = {}): Room => ({ id: 'a', name: 'A', type: 'bedroom', x: 0, y: 0, w: 10, l: 10, ...o });

describe('geometry', () => {
  it('areas', () => {
    expect(area(room({ w: 12.5, l: 10 }))).toBe(125);
    const rooms = [room({ w: 10, l: 10 }), room({ id: 'b', type: 'balcony', w: 4, l: 10 })];
    expect(totalArea(rooms)).toBe(140);
    expect(carpetArea(rooms)).toBe(100);           // balcony excluded
  });
  it('overlap needs shared area — touching walls is fine', () => {
    expect(overlap(room(), room({ id: 'b', x: 10 }))).toBe(false);
    expect(overlap(room(), room({ id: 'b', y: 10 }))).toBe(false);
    expect(overlap(room(), room({ id: 'b', x: 9.5 }))).toBe(true);
    expect(overlap(room(), room({ id: 'b', x: 2, y: 2, w: 3, l: 3 }))).toBe(true);        // contained
    expect(overlap(room(), room({ id: 'b', x: 30 }))).toBe(false);
    expect([...overlappingIds([room(), room({ id: 'b', x: 5 }), room({ id: 'c', x: 40 })])].sort()).toEqual(['a', 'b']);
  });
  it('gap between rooms', () => {
    expect(gapFt(room(), room({ id: 'b', x: 10 }))).toBe(0);
    expect(gapFt(room(), room({ id: 'b', x: 15 }))).toBe(5);
    expect(gapFt(room(), room({ id: 'b', x: 15, y: 13 }))).toBe(8);
    expect(gapFt(room(), room({ id: 'b', x: 5, y: 5 }))).toBe(0);
  });
  it('drain run = Manhattan distance from the nearest edge + 2 ft to the outlet', () => {
    const bath = room({ type: 'bathroom', x: 10, y: 10, w: 5, l: 8 });
    expect(drainRunFt(bath, { x: 20, y: 14 })).toBe(7);          // 5 ft to the right edge + 2
    expect(drainRunFt(bath, { x: 20, y: 30 })).toBe(5 + 12 + 2); // diagonal → axis-aligned pipe
    expect(drainRunFt(bath, { x: 12, y: 12 })).toBe(2);          // septic inside the room
    expect(drainRunFt(bath, { x: 0, y: 0 })).toBe(10 + 10 + 2);
  });
  it('drain run never gets shorter as the septic moves away', () => {
    const bath = room({ x: 10, y: 10, w: 5, l: 8 });
    let prev = 0;
    for (let d = 15; d <= 80; d += 1) { const r = drainRunFt(bath, { x: d, y: 14 }); expect(r).toBeGreaterThanOrEqual(prev); prev = r; }
  });
});

describe('interiors mapping', () => {
  const ids = getType('interiors-full')!.rooms!.map((r) => r.id);
  it('maps plan rooms onto the interiors catalogue, and every id it returns exists there', () => {
    for (const key of Object.keys(TEMPLATES)) {
      const out = interiorRoomIds(fromTemplate(key).rooms);
      expect(out.length).toBeGreaterThan(0);
      for (const id of out) expect(ids).toContain(id);
    }
    expect(interiorRoomIds(fromTemplate('2bhk').rooms)).toEqual(['living', 'kitchen', 'master', 'bedroom2', 'dining']);
    expect(interiorRoomIds(fromTemplate('3bhk').rooms)).toContain('kids');
    expect(interiorRoomIds([room({ type: 'bathroom' })])).toEqual([]);
  });
});

describe('editing helpers', () => {
  it('adds rooms without overlapping anything, with sensible names', () => {
    let rooms: Room[] = [];
    for (const t of ['living', 'bedroom', 'bedroom', 'kitchen', 'bathroom', 'bathroom'] as const) rooms = addRoom(rooms, t);
    expect(rooms).toHaveLength(6);
    expect(overlappingIds(rooms).size).toBe(0);
    expect(new Set(rooms.map((r) => r.id)).size).toBe(6);
    expect(rooms.map((r) => r.name)).toEqual(['Living room', 'Bedroom 1', 'Bedroom 2', 'Kitchen', 'Bathroom', 'Bathroom 2']);
  });
  it('freeSpot skips occupied ground', () => {
    const spot = freeSpot([room({ w: 20, l: 20 })], 5, 5);
    expect(overlap(room({ w: 20, l: 20 }), room({ id: 'n', ...spot, w: 5, l: 5 }))).toBe(false);
  });
  it('templates are valid, overlap-free plans', () => {
    for (const k of Object.keys(TEMPLATES)) {
      const p = fromTemplate(k);
      expect(overlappingIds(p.rooms).size).toBe(0);
      expect(() => validatePlan(p)).not.toThrow();
    }
  });
});

describe('validatePlan (untrusted input)', () => {
  const ok = { rooms: [{ id: 'r1', name: 'Living', type: 'living', x: 0, y: 0, w: 14, l: 16 }], septic: { x: 30, y: 10 } };
  it('accepts a valid plan and snaps to the half-foot grid', () => {
    const p = validatePlan({ ...ok, rooms: [{ ...ok.rooms[0], x: 0.26, w: '14.7' }] });
    expect(p.rooms[0].x).toBe(0.5);
    expect(p.rooms[0].w).toBe(14.5);
  });
  it('rejects malformed plans', () => {
    const bad = (p: unknown) => expect(() => validatePlan(p)).toThrow(PlanError);
    bad(null); bad({}); bad({ rooms: 'x' });
    bad({ rooms: Array.from({ length: LIMITS.maxRooms + 1 }, (_, i) => ({ ...ok.rooms[0], id: `r${i}` })) });
    bad({ rooms: [{ ...ok.rooms[0], type: 'dungeon' }] });
    bad({ rooms: [{ ...ok.rooms[0], type: '__proto__' }] });
    bad({ rooms: [{ ...ok.rooms[0], name: '   ' }] });
    bad({ rooms: [{ ...ok.rooms[0], id: '../x' }] });
    bad({ rooms: [ok.rooms[0], ok.rooms[0]] });                                  // duplicate id
    for (const w of [0, 2, 61, -5, NaN, Infinity, null, '', true, 'abc']) bad({ rooms: [{ ...ok.rooms[0], w }] });
    bad({ rooms: [{ ...ok.rooms[0], x: 201 }] });
    bad({ rooms: ok.rooms, septic: { x: -1, y: 0 } });
    bad({ rooms: ok.rooms, septic: { x: 'a', y: 0 } });
  });
  it('allows an empty plan and a missing septic', () => {
    expect(validatePlan({ rooms: [] })).toEqual({ rooms: [], septic: undefined });
  });
  it('every room type has sane default dimensions', () => {
    for (const t of Object.values(ROOM_TYPES)) { expect(t.w).toBeGreaterThanOrEqual(LIMITS.minSize); expect(t.l).toBeLessThanOrEqual(LIMITS.maxSize); }
  });
});

describe('templates start in a sensible state', () => {
  it('every template’s bathroom starts within a comfortable drain run of its septic', () => {
    for (const k of Object.keys(TEMPLATES)) {
      const p = fromTemplate(k);
      for (const bath of p.rooms.filter((r) => r.type === 'bathroom')) expect(drainRunFt(bath, p.septic!), k).toBeLessThanOrEqual(15);
    }
  });
});
