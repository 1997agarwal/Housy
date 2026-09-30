import { readJson, withJson } from './kv';
import { normalizePhone } from './phone';
import { PROJECT_TYPES, type Trade } from './catalog';
import { getCity } from './cities';
import type { Pro } from './pros';
import { PartnerError, validatePartnerInput, type Partner, type PartnerStatus } from './partners-shared';

export * from './partners-shared';

const KNOWN_SERVICES = PROJECT_TYPES.map((t) => t.id);
type Store = Record<string, Partner>;   // keyed by partner id
const tx = <R,>(fn: (all: Store) => R | Promise<R>) => withJson<Store, R>('partners', () => ({}), fn);
const newId = () => `P-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const now = () => new Date().toISOString();

export const getPartnerByPhone = async (phone: string): Promise<Partner | null> =>
  Object.values(await readJson<Store>('partners', {})).find((p) => p.phone === phone) ?? null;

// Register (status starts "pending" until ops verifies them) or update your own listing. The kind can't change later.
export async function savePartner(rawPhone: string, raw: unknown): Promise<Partner> {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new PartnerError('Invalid account');
  const input = validatePartnerInput(raw, KNOWN_SERVICES);
  return tx((all) => {
    const mine = Object.values(all).find((p) => p.phone === phone);
    if (mine) {
      if (mine.kind !== input.kind) throw new PartnerError(`Your listing is already set up as a ${mine.kind}`);
      // Moving city or trade re-opens verification: the field agent verified the old details, not the new ones.
      const material = mine.city !== input.city || [...mine.trades].sort().join() !== [...input.trades].sort().join();
      Object.assign(mine, input, { updatedAt: now() });
      if (material && mine.status === 'approved') { mine.status = 'pending'; mine.reviewNote = 'Details changed — needs re-verification'; }
      return mine;
    }
    const p: Partner = { ...input, id: newId(), phone, status: 'pending', createdAt: now(), updatedAt: now() };
    all[p.id] = p;
    return p;
  });
}

export async function listPartners(status?: PartnerStatus): Promise<Partner[]> {
  return Object.values(await readJson<Store>('partners', {})).filter((p) => !status || p.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Ops decision. Approving assigns the Housy ID (HSY-<CITY>-P<nnn>) printed on the physical card.
export function setPartnerStatus(id: string, status: PartnerStatus, note?: string): Promise<Partner> {
  return tx((all) => {
    const p = all[id];
    if (!p) throw new PartnerError('Partner not found');
    p.status = status; p.updatedAt = now();
    p.reviewNote = note?.trim().slice(0, 300) || undefined;
    if (status === 'approved' && !p.housyId) {
      const code = p.city.slice(0, 3).toUpperCase();
      const n = Object.values(all).filter((x) => x.city === p.city && x.housyId).length + 1;
      p.housyId = `HSY-${code}-P${String(n).padStart(3, '0')}`;
    }
    return p;
  });
}

const ROLE: Record<Trade, string> = {
  mason: 'Mason', plumber: 'Plumber', electrician: 'Electrician', tiler: 'Tiling Contractor', painter: 'Painter', carpenter: 'Carpenter',
  engineer: 'Structural Engineer', waterproofer: 'Waterproofing Specialist', designer: 'Interior Designer', architect: 'Architect',
};

export function partnerToPro(p: Partner, trade: Trade): Pro {
  return {
    id: p.id, partnerId: p.id, city: p.city, locality: p.locality, name: p.name, role: ROLE[trade], trade,
    rating: 0, reviews: 0, crew: p.crewSize, years: p.years, dayRate: p.dayRate, housyId: p.housyId ?? p.id,
  };
}

// Approved, currently-available partners who can do this trade in this city (and, if given, this kind of project).
export async function partnerPool(cityId: string, trade: Trade, typeId?: string): Promise<Pro[]> {
  const city = getCity(cityId)?.id ?? cityId;
  return (await listPartners('approved'))
    .filter((p) => p.available && p.city === city && p.trades.includes(trade) && (!typeId || p.services.length === 0 || p.services.includes(typeId)))
    .map((p) => partnerToPro(p, trade));
}

// Everyone approved in a city as directory entries (one per trade they do), optionally for one trade. Includes people who are
// temporarily unavailable, so the directory stays honest about who is on Housy; matching skips them.
export async function directoryPartners(cityId: string, trade?: string): Promise<Pro[]> {
  const city = getCity(cityId)?.id ?? cityId;
  return (await listPartners('approved')).filter((p) => p.city === city)
    .flatMap((p) => p.trades.filter((t) => !trade || t === trade).map((t) => partnerToPro(p, t)));
}

export async function approvedPartnerCount(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const p of await listPartners('approved')) out[p.city] = (out[p.city] ?? 0) + 1;
  return out;
}

// What ops sees: the phone is masked.
export const opsView = (p: Partner) => ({ ...p, phone: p.phone.slice(0, 2) + '******' + p.phone.slice(-2) });
