// Matchmaking: who should Housy offer a piece of work to? Pure ranking + a thin loader over seed crews, approved partners and reviews.
import { readJson } from './kv';
import { prosIn, NoCoverageError, TRADE_LABEL, type Pro } from './pros';
import { partnerPool } from './partners';
import type { Trade } from './catalog';

export interface RatingInfo { avg: number; count: number }
export interface MatchOptions { typeId?: string; exclude?: readonly string[] }

const NEW_BASELINE = 4.4;      // a newly approved partner has no reviews yet: assume a decent 4.4 (verified by a field agent)…
const NEW_BOOST = 6;           // …and lift them for their first jobs, so supply isn't starved by veterans
const LOAD_BAND = 8;           // candidates within this many points of the best count as equally good; the least busy of them gets the job
const NEW_UNTIL_REVIEWS = 5;

// Higher is better. Rating (blended with real reviews) dominates, then track record and experience; a rate far above the
// local median costs a little; brand-new partners get a small boost until they have a few reviews.
export function score(p: Pro, r: RatingInfo | undefined, medianRate: number): number {
  const avg = r && r.count > 0 ? r.avg : p.rating > 0 ? p.rating : NEW_BASELINE;
  const count = r?.count ?? p.reviews;
  let s = avg * 20 + (Math.min(count, 40) / 40) * 10 + Math.min(p.years, 15) * 0.8;
  if (medianRate > 0 && p.dayRate > medianRate * 1.25) s -= 5;
  if (medianRate > 0 && p.dayRate > 0 && p.dayRate < medianRate * 0.75) s -= 2;    // suspiciously cheap
  if (p.partnerId && count < NEW_UNTIL_REVIEWS) s += NEW_BOOST;
  return Math.round(s * 100) / 100;
}

export function rankScored(pool: readonly Pro[], ratings: Record<string, RatingInfo>): { pro: Pro; score: number }[] {
  const rates = pool.map((p) => p.dayRate).filter((n) => n > 0).sort((a, b) => a - b);
  const median = rates.length ? rates[Math.floor(rates.length / 2)] : 0;
  return pool.map((pro) => ({ pro, score: score(pro, ratings[pro.id], median) })).sort((a, b) => b.score - a.score || a.pro.id.localeCompare(b.pro.id));
}
export const rank = (pool: readonly Pro[], ratings: Record<string, RatingInfo>): Pro[] => rankScored(pool, ratings).map((x) => x.pro);

// Among the near-best, prefer whoever has the fewest jobs open right now, so work is shared instead of always going to one crew.
export function chooseBest(ranked: { pro: Pro; score: number }[], load: Record<string, number>): Pro | undefined {
  if (ranked.length === 0) return undefined;
  const band = ranked.filter((x) => x.score >= ranked[0].score - LOAD_BAND);
  return band.reduce((best, x) => ((load[x.pro.id] ?? 0) < (load[best.pro.id] ?? 0) ? x : best)).pro;
}

async function realRatings(): Promise<Record<string, RatingInfo>> {
  const all = await readJson<{ proId: string; overall: number }[]>('reviews', []);
  const sums: Record<string, { sum: number; n: number }> = {};
  for (const r of all) { const s = (sums[r.proId] ??= { sum: 0, n: 0 }); s.sum += r.overall; s.n++; }
  return Object.fromEntries(Object.entries(sums).map(([id, s]) => [id, { avg: s.sum / s.n, count: s.n }]));
}

// Open (not yet paid) milestones per pro across all projects.
async function openLoad(): Promise<Record<string, number>> {
  const load: Record<string, number> = {};
  for (const p of await readJson<{ status: string; milestones: { status: string; pro: { id: string } }[] }[]>('db', []))
    if (p.status === 'active') for (const m of p.milestones) if (m.status !== 'paid') load[m.pro.id] = (load[m.pro.id] ?? 0) + 1;
  return load;
}

async function scored(cityId: string, trade: Trade, opts: MatchOptions) {
  const seeds = prosIn(cityId, trade);
  const partners = await partnerPool(cityId, trade, opts.typeId);
  const ratings = await realRatings();
  // Seed ratings blend with real reviews the same way the directory does.
  const blended: Record<string, RatingInfo> = {};
  for (const p of seeds) { const r = ratings[p.id]; if (r) blended[p.id] = { avg: (p.rating * p.reviews + r.avg * r.count) / (p.reviews + r.count), count: p.reviews + r.count }; }
  for (const p of partners) if (ratings[p.id]) blended[p.id] = ratings[p.id];
  return rankScored([...seeds, ...partners].filter((p) => !opts.exclude?.includes(p.id)), blended);
}

// Ranked candidates for a trade in a city (seed crews + approved partners), best first.
export async function candidates(cityId: string, trade: Trade, opts: MatchOptions = {}): Promise<Pro[]> {
  return (await scored(cityId, trade, opts)).map((x) => x.pro);
}

// Who Housy offers the work to: the best match, sharing work between near-equals.
export async function chooseFor(cityId: string, trade: Trade, opts: MatchOptions = {}): Promise<Pro | undefined> {
  return chooseBest(await scored(cityId, trade, opts), await openLoad());
}

// The best match, or a clear error — never someone from another city.
export async function matchPro(cityId: string, trade: Trade, opts: MatchOptions = {}): Promise<Pro> {
  const best = await chooseFor(cityId, trade, opts);
  if (!best) throw new NoCoverageError(`No verified ${TRADE_LABEL[trade].toLowerCase()} available in this city yet`);
  return best;
}
