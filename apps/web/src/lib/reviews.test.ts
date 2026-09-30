import { describe, expect, it } from 'vitest';
import { act, addPhoto, createProject, validateCreate, ConflictError, NotFoundError, ValidationError } from './projects';
import { createReview, reviewablePros, reviewsForProject, validateReview, withStats } from './reviews';
import { saveProfile } from './profile';
import { PROS, prosIn } from './pros';
import { useTempStore } from '../test/helpers';

const OWNER = '9876543210', OTHER = '9123456789';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const good = { quality: 5, punctuality: 4, behaviour: 5, value: 4 };

async function project(complete: boolean, owner = OWNER) {
  const p = await createProject(validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: new Date(Date.now() + 864e5).toISOString() } as any), owner);
  if (!complete) return p;
  await act(p.id, { action: 'complete_visit' }, owner);
  let cur = await act(p.id, { action: 'accept_quote' }, owner);
  for (const m of cur.milestones) {
    await act(p.id, { action: 'start', milestoneId: m.id }, owner);
    await addPhoto(p.id, owner, m.id, PNG, 'png');
    await act(p.id, { action: 'submit', milestoneId: m.id }, owner);
    cur = await act(p.id, { action: 'approve', milestoneId: m.id }, owner);
  }
  return cur;
}

describe('validateReview', () => {
  it('needs four integer ratings 1–5', () => {
    expect(validateReview({ proId: 'x', ratings: good }).ratings).toEqual(good);
    for (const bad of [{ ...good, quality: 0 }, { ...good, quality: 6 }, { ...good, value: 3.5 }, { ...good, behaviour: '5' }, { quality: 5 }])
      expect(() => validateReview({ proId: 'x', ratings: bad })).toThrow(ValidationError);
    expect(() => validateReview({ proId: 'x' })).toThrow(ValidationError);
  });
  it('trims and caps the text; blank means none', () => {
    expect(validateReview({ proId: 'x', ratings: good, text: '   ' }).text).toBeUndefined();
    expect(validateReview({ proId: 'x', ratings: good, text: 'a'.repeat(900) }).text).toHaveLength(600);
  });
});

describe('reviews', () => {
  useTempStore();

  it('only for completed projects', async () => {
    const p = await project(false);
    await expect(createReview(p.id, OWNER, { proId: p.visit.expert.id, ratings: good })).rejects.toThrow(ConflictError);
  });

  it('a completed project’s owner can review anyone who worked on it, once each', async () => {
    const p = await project(true);
    const people = reviewablePros(p);
    expect(people.length).toBeGreaterThan(3);
    expect(new Set(people.map((x) => x.id)).size).toBe(people.length);      // deduped
    await saveProfile(OWNER, { name: 'Harshita Agarwal', language: 'en', persona: 'away', city: 'bareilly', propertyType: 'house', goals: ['renovate'], timeline: 'now' });
    const r = await createReview(p.id, OWNER, { proId: people[0].id, ratings: good, text: 'Neat work' });
    expect(r.overall).toBe(4.5);
    expect(r.reviewerName).toBe('Harshita A.');                              // masked
    expect((r as any).owner).toBeUndefined();                                // phone never exposed
    await expect(createReview(p.id, OWNER, { proId: people[0].id, ratings: good })).rejects.toThrow(/already reviewed/);
    await createReview(p.id, OWNER, { proId: people[1].id, ratings: good });  // a different person is fine
    expect(await reviewsForProject(p.id, OWNER)).toHaveLength(2);
  });

  it('rejects people who were not on the project, strangers, and unknown projects', async () => {
    const p = await project(true);
    const outsider = PROS.find((x) => !reviewablePros(p).some((y) => y.id === x.id))!;
    await expect(createReview(p.id, OWNER, { proId: outsider.id, ratings: good })).rejects.toThrow(/did not work/);
    await expect(createReview(p.id, OWNER, { proId: 'nope', ratings: good })).rejects.toThrow(ValidationError);
    await expect(createReview(p.id, OTHER, { proId: p.visit.expert.id, ratings: good })).rejects.toThrow(NotFoundError);
    await expect(createReview('HSY-NOPE00', OWNER, { proId: p.visit.expert.id, ratings: good })).rejects.toThrow(NotFoundError);
    expect(await reviewsForProject(p.id, OTHER)).toEqual([]);
  });

  it('blends real reviews into a crew’s rating by weight, and exposes recent ones', async () => {
    const p = await project(true);
    const pro = p.visit.expert;
    const [before] = await withStats([pro]);
    expect(before).toMatchObject({ avgRating: pro.rating, reviewCount: pro.reviews, realReviews: 0, recent: [] });
    await createReview(p.id, OWNER, { proId: pro.id, ratings: { quality: 1, punctuality: 1, behaviour: 1, value: 1 } });
    const [after] = await withStats([pro]);
    expect(after.reviewCount).toBe(pro.reviews + 1);
    expect(after.avgRating).toBeLessThan(pro.rating);                        // moved…
    expect(after.avgRating).toBeGreaterThan(pro.rating - 0.5);               // …but not wildly, for a veteran
    expect(after.recent).toHaveLength(1);
    expect((after.recent[0] as any).owner).toBeUndefined();
    const others = await withStats(prosIn('bareilly').filter((x) => x.id !== pro.id));
    expect(others.every((x) => x.realReviews === 0)).toBe(true);
  });
});
