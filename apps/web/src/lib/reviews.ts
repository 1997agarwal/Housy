import { readJson, withJson } from './kv';
import { getProject, ConflictError, NotFoundError, ValidationError, type Project } from './projects';
import { getProfile } from './profile';
import { PROS, type Pro } from './pros';

import { CRITERIA, type Criterion } from './reviews-shared';
export { CRITERIA };
export type { Criterion };
export interface Review {
  id: string; projectId: string; proId: string; city: string; owner: string;
  reviewerName: string;                 // masked: "Asha K."
  ratings: Record<Criterion, number>; overall: number; text?: string; createdAt: string;
}
export type PublicReview = Omit<Review, 'owner'>;

// Strip the reviewer's phone before anything leaves the server.
const publicView = (r: Review): PublicReview => { const copy: Partial<Review> = { ...r }; delete copy.owner; return copy as PublicReview; };
const mask = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/).filter(Boolean);
  if (!first) return 'A Housy customer';
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
};

// People a completed project's owner can review: the first-visit expert and every crew assigned to a milestone.
export function reviewablePros(p: Project): Pro[] {
  const seen = new Map<string, Pro>();
  seen.set(p.visit.expert.id, p.visit.expert);
  for (const m of p.milestones) seen.set(m.pro.id, m.pro);
  return [...seen.values()];
}

export function validateReview(raw: any): { proId: string; ratings: Record<Criterion, number>; text?: string } {
  const ratings = {} as Record<Criterion, number>;
  for (const k of Object.keys(CRITERIA) as Criterion[]) {
    const n = raw?.ratings?.[k];
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new ValidationError(`Rate ${CRITERIA[k].toLowerCase()} from 1 to 5`);
    ratings[k] = n;
  }
  const text = typeof raw?.text === 'string' ? raw.text.trim().slice(0, 600) : '';
  return { proId: String(raw?.proId ?? ''), ratings, text: text || undefined };
}

export async function createReview(projectId: string, owner: string, raw: unknown): Promise<PublicReview> {
  const { proId, ratings, text } = validateReview(raw);
  const project = await getProject(projectId, owner);
  if (!project) throw new NotFoundError('Project not found');
  if (project.status !== 'completed') throw new ConflictError('You can review your crew once the project is completed');
  const pro = reviewablePros(project).find((x) => x.id === proId);
  if (!pro) throw new ValidationError('That person did not work on this project');
  const reviewerName = mask((await getProfile(owner))?.name ?? '');
  const overall = Math.round((Object.values(ratings).reduce((a, b) => a + b, 0) / 4) * 10) / 10;

  return withJson<Review[], PublicReview>('reviews', () => [], (all) => {
    if (all.some((r) => r.projectId === projectId && r.proId === proId)) throw new ConflictError('You have already reviewed this person for this project');
    const review: Review = { id: 'RV-' + Math.random().toString(36).slice(2, 8).toUpperCase(), projectId, proId, city: project.city, owner, reviewerName, ratings, overall, text, createdAt: new Date().toISOString() };
    all.push(review);
    return publicView(review);
  });
}

export async function reviewsForProject(projectId: string, owner: string): Promise<PublicReview[]> {
  return (await readJson<Review[]>('reviews', [])).filter((r) => r.projectId === projectId && r.owner === owner).map(publicView);
}

export interface ProWithStats extends Pro { avgRating: number; reviewCount: number; realReviews: number; recent: PublicReview[] }

// Seed crews start with a baseline rating/count; real reviews are blended in by count so a handful of
// early reviews can't swing a veteran's rating wildly, but they do move it.
export async function withStats(pros: Pro[]): Promise<ProWithStats[]> {
  const all = await readJson<Review[]>('reviews', []);
  return pros.map((p) => {
    const mine = all.filter((r) => r.proId === p.id);
    const sum = mine.reduce((a, r) => a + r.overall, 0);
    const n = p.reviews + mine.length;
    return {
      ...p, avgRating: n === 0 ? 0 : Math.round(((p.rating * p.reviews + sum) / n) * 10) / 10, reviewCount: n, realReviews: mine.length,
      recent: mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map(publicView),
    };
  });
}
export const proById = (id: string) => PROS.find((p) => p.id === id);
