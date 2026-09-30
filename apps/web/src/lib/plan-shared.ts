// Home plan: rooms as rectangles on a foot grid + a septic/drain point. Pure & browser-safe.

export const ROOM_TYPES = {
  living: { label: 'Living room', w: 14, l: 16, color: '#FDE7D9' },
  bedroom: { label: 'Bedroom', w: 12, l: 13, color: '#E3EEF9' },
  kitchen: { label: 'Kitchen', w: 9, l: 11, color: '#FFF3C4' },
  bathroom: { label: 'Bathroom', w: 5, l: 8, color: '#D8F0EA' },
  dining: { label: 'Dining', w: 10, l: 10, color: '#F1E4F7' },
  study: { label: 'Study', w: 9, l: 10, color: '#E6ECD9' },
  pooja: { label: 'Pooja', w: 4, l: 5, color: '#FFE0E0' },
  balcony: { label: 'Balcony', w: 4, l: 10, color: '#EEEEEE' },
  other: { label: 'Other', w: 8, l: 8, color: '#F2F2F2' },
} as const;
export type RoomType = keyof typeof ROOM_TYPES;

export interface Room { id: string; name: string; type: RoomType; x: number; y: number; w: number; l: number }   // feet; x,y = top-left
export interface Point { x: number; y: number }
export interface Plan { rooms: Room[]; septic?: Point; updatedAt?: string }

export const LIMITS = { maxRooms: 30, minSize: 3, maxSize: 60, maxCoord: 200 } as const;
const snap = (n: number) => Math.round(n * 2) / 2;   // half-foot grid

export const area = (r: Room) => Math.round(r.w * r.l * 10) / 10;
export const totalArea = (rooms: Room[]) => Math.round(rooms.reduce((a, r) => a + r.w * r.l, 0));
// Carpet area used for interiors: everything except balconies.
export const carpetArea = (rooms: Room[]) => Math.round(rooms.filter((r) => r.type !== 'balcony').reduce((a, r) => a + r.w * r.l, 0));

// Rooms overlap only if they share positive area — touching walls is fine.
export const overlap = (a: Room, b: Room) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.l && b.y < a.y + a.l;
export function overlappingIds(rooms: Room[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++)
    if (overlap(rooms[i], rooms[j])) { out.add(rooms[i].id); out.add(rooms[j].id); }
  return out;
}

// Gap between two rooms' edges along the axes (0 when touching or overlapping).
export function gapFt(a: Room, b: Room): number {
  const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const dy = Math.max(a.y - (b.y + b.l), b.y - (a.y + a.l), 0);
  return dx + dy;
}

// Estimated drain pipe run from a room to the septic point: drains follow walls (axis-aligned), so it is the
// Manhattan distance from the room's nearest edge, plus ~2 ft inside the room to the outlet.
export function drainRunFt(room: Room, septic: Point): number {
  const dx = Math.max(room.x - septic.x, 0, septic.x - (room.x + room.w));
  const dy = Math.max(room.y - septic.y, 0, septic.y - (room.y + room.l));
  return Math.round((dx + dy + 2) * 10) / 10;
}

// Which interiors rooms (see catalog) a plan implies.
export function interiorRoomIds(rooms: Room[]): string[] {
  const has = (t: RoomType) => rooms.some((r) => r.type === t);
  const beds = rooms.filter((r) => r.type === 'bedroom').length;
  const ids: string[] = [];
  if (has('living')) ids.push('living');
  if (has('kitchen')) ids.push('kitchen');
  if (beds >= 1) ids.push('master');
  if (beds >= 2) ids.push('bedroom2');
  if (beds >= 3) ids.push('kids');
  if (has('dining')) ids.push('dining');
  if (has('study')) ids.push('study');
  if (has('pooja')) ids.push('pooja');
  if (has('balcony')) ids.push('balcony');
  return ids;
}

export function newRoomId(rooms: Room[]): string {
  let n = rooms.length + 1;
  while (rooms.some((r) => r.id === `r${n}`)) n++;
  return `r${n}`;
}

// A free spot for a new room: scan the grid in 1 ft steps for the first position that doesn't overlap anything.
export function freeSpot(rooms: Room[], w: number, l: number): Point {
  for (let y = 0; y <= 60; y += 1) for (let x = 0; x <= 60; x += 1) {
    const probe: Room = { id: '_', name: '', type: 'other', x, y, w, l };
    if (!rooms.some((r) => overlap(r, probe))) return { x, y };
  }
  return { x: 0, y: 0 };
}

export function addRoom(rooms: Room[], type: RoomType): Room[] {
  const t = ROOM_TYPES[type];
  const count = rooms.filter((r) => r.type === type).length + 1;
  const spot = freeSpot(rooms, t.w, t.l);
  return [...rooms, { id: newRoomId(rooms), name: count > 1 || type === 'bedroom' ? `${t.label} ${count}` : t.label, type, x: spot.x, y: spot.y, w: t.w, l: t.l }];
}

export const TEMPLATES: Record<string, { label: string; rooms: Omit<Room, 'id'>[]; septic: Point }> = {
  '2bhk': { label: '2 BHK', septic: { x: 40, y: 22 }, rooms: [
    { name: 'Living room', type: 'living', x: 0, y: 0, w: 14, l: 16 }, { name: 'Kitchen', type: 'kitchen', x: 14, y: 0, w: 9, l: 11 },
    { name: 'Dining', type: 'dining', x: 14, y: 11, w: 9, l: 5 }, { name: 'Bedroom 1', type: 'bedroom', x: 0, y: 16, w: 12, l: 13 },
    { name: 'Bedroom 2', type: 'bedroom', x: 12, y: 16, w: 11, l: 13 }, { name: 'Bathroom', type: 'bathroom', x: 23, y: 16, w: 5, l: 8 },
  ] },
  '3bhk': { label: '3 BHK', septic: { x: 35, y: 5 }, rooms: [
    { name: 'Living room', type: 'living', x: 0, y: 0, w: 16, l: 16 }, { name: 'Kitchen', type: 'kitchen', x: 16, y: 0, w: 10, l: 11 },
    { name: 'Dining', type: 'dining', x: 16, y: 11, w: 10, l: 5 }, { name: 'Bedroom 1', type: 'bedroom', x: 0, y: 16, w: 13, l: 13 },
    { name: 'Bedroom 2', type: 'bedroom', x: 13, y: 16, w: 12, l: 13 }, { name: 'Bedroom 3', type: 'bedroom', x: 25, y: 16, w: 11, l: 13 },
    { name: 'Bathroom', type: 'bathroom', x: 26, y: 0, w: 5, l: 8 }, { name: 'Pooja', type: 'pooja', x: 26, y: 8, w: 4, l: 5 },
  ] },
};
export function fromTemplate(key: string): Plan {
  const t = TEMPLATES[key];
  return { rooms: t.rooms.map((r, i) => ({ ...r, id: `r${i + 1}` })), septic: t.septic };
}

// Validates untrusted input and returns a clean plan (values snapped to the half-foot grid). Throws on anything invalid.
export class PlanError extends Error {}
export function validatePlan(raw: any): Plan {
  if (!raw || !Array.isArray(raw.rooms)) throw new PlanError('Plan must contain rooms');
  if (raw.rooms.length > LIMITS.maxRooms) throw new PlanError(`A plan can have at most ${LIMITS.maxRooms} rooms`);
  const ids = new Set<string>();
  const num = (v: unknown, min: number, max: number, what: string) => {
    const n = Number(v);
    if (typeof v === 'boolean' || v === null || v === '' || !Number.isFinite(n) || n < min || n > max) throw new PlanError(`${what} must be between ${min} and ${max}`);
    return snap(n);
  };
  const rooms: Room[] = raw.rooms.map((r: any) => {
    const id = String(r?.id ?? '');
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(id) || ids.has(id)) throw new PlanError('Invalid room id');
    ids.add(id);
    if (!Object.prototype.hasOwnProperty.call(ROOM_TYPES, r?.type)) throw new PlanError('Unknown room type');
    const name = String(r?.name ?? '').trim().slice(0, 30);
    if (!name) throw new PlanError('Every room needs a name');
    return { id, name, type: r.type as RoomType, x: num(r.x, 0, LIMITS.maxCoord, 'Position'), y: num(r.y, 0, LIMITS.maxCoord, 'Position'),
      w: num(r.w, LIMITS.minSize, LIMITS.maxSize, 'Width'), l: num(r.l, LIMITS.minSize, LIMITS.maxSize, 'Length') };
  });
  let septic: Point | undefined;
  if (raw.septic != null) septic = { x: num(raw.septic.x, 0, LIMITS.maxCoord, 'Septic position'), y: num(raw.septic.y, 0, LIMITS.maxCoord, 'Septic position') };
  return { rooms, septic };
}
