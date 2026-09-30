import { describe, expect, it } from 'vitest';
import { act, createProject, getProject, validateCreate } from './projects';
import { getPartnerByPhone, listPartners, partnerPool, savePartner, setPartnerStatus, opsView, PartnerError } from './partners';
import { matchPro, candidates, rank, score } from './matching';
import { jobsFor, respondToOffer } from './jobs';
import type { Pro } from './pros';
import { useTempStore } from '../test/helpers';

const CREW = { kind: 'crew', name: 'Lalit Plumbing', city: 'bareilly', locality: 'Prem Nagar', trades: ['plumber'], services: [], dayRate: 900, crewSize: 3, years: 6, bio: 'Bathrooms', available: true };
const future = () => new Date(Date.now() + 2 * 864e5).toISOString();
const book = (owner = '9876543210') => createProject(validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: future() }), owner);

describe('partner registration', () => {
  useTempStore();
  it('starts pending, is private to its owner, and is not matchable until approved', async () => {
    const p = await savePartner('9000000001', CREW);
    expect(p.status).toBe('pending');
    expect((await getPartnerByPhone('9000000001'))?.id).toBe(p.id);
    expect(await getPartnerByPhone('9000000002')).toBeNull();
    expect((await partnerPool('bareilly', 'plumber')).map((x) => x.id)).not.toContain(p.id);
  });
  it('approval assigns a Housy ID and makes them matchable; suspension removes them', async () => {
    const p = await savePartner('9000000001', CREW);
    const a = await setPartnerStatus(p.id, 'approved');
    expect(a.housyId).toBe('HSY-BAR-P001');
    expect((await partnerPool('bareilly', 'plumber')).map((x) => x.id)).toContain(p.id);
    await setPartnerStatus(p.id, 'suspended');
    expect((await partnerPool('bareilly', 'plumber')).map((x) => x.id)).not.toContain(p.id);
  });
  it('only lists people for the trades they do, the city they work in, and while available', async () => {
    const p = await savePartner('9000000001', CREW); await setPartnerStatus(p.id, 'approved');
    expect(await partnerPool('bareilly', 'electrician')).toEqual([]);
    expect((await partnerPool('lucknow', 'plumber')).map((x) => x.id)).not.toContain(p.id);
    await savePartner('9000000001', { ...CREW, available: false });
    expect((await partnerPool('bareilly', 'plumber')).map((x) => x.id)).not.toContain(p.id);
  });
  it('respects the project types they chose', async () => {
    const p = await savePartner('9000000001', { ...CREW, services: ['kitchen'] }); await setPartnerStatus(p.id, 'approved');
    expect((await partnerPool('bareilly', 'plumber', 'kitchen')).map((x) => x.id)).toContain(p.id);
    expect((await partnerPool('bareilly', 'plumber', 'new-bathroom')).map((x) => x.id)).not.toContain(p.id);
  });
  it('changing city or trade sends an approved listing back for verification; small edits do not', async () => {
    const p = await savePartner('9000000001', CREW); await setPartnerStatus(p.id, 'approved');
    expect((await savePartner('9000000001', { ...CREW, dayRate: 1000 })).status).toBe('approved');
    expect((await savePartner('9000000001', { ...CREW, city: 'lucknow' })).status).toBe('pending');
  });
  it('rejects bad input with a clear error', async () => {
    for (const over of [{ kind: 'x' }, { name: 'A' }, { city: 'atlantis' }, { locality: '' }, { trades: ['designer'] }, { trades: [] }, { dayRate: 10 }, { dayRate: 'abc' }, { dayRate: [900] }, { crewSize: 0 }, { years: -1 }])
      await expect(savePartner('9000000001', { ...CREW, ...over }), JSON.stringify(over)).rejects.toThrow(PartnerError);
    await expect(savePartner('9000000001', null)).rejects.toThrow(PartnerError);
  });
  it('cannot switch between crew and designer', async () => {
    await savePartner('9000000001', CREW);
    await expect(savePartner('9000000001', { ...CREW, kind: 'designer', trades: ['designer'], feePerSqft: 100 })).rejects.toThrow(/already set up/);
  });
  it('ops view masks the phone', async () => {
    const p = await savePartner('9000000001', CREW);
    expect(opsView(p).phone).toBe('90******01');
    expect((await listPartners('pending')).length).toBe(1);
  });
});

describe('matchmaking', () => {
  useTempStore();
  const mk = (over: Partial<Pro>): Pro => ({ id: 'x', city: 'bareilly', locality: 'l', name: 'n', role: 'r', trade: 'plumber', rating: 4.5, reviews: 20, crew: 2, years: 8, dayRate: 800, housyId: 'h', ...over });
  it('ranks by rating first, then record and experience', () => {
    const r = rank([mk({ id: 'a', rating: 4.2 }), mk({ id: 'b', rating: 4.9 }), mk({ id: 'c', rating: 4.9, reviews: 2, years: 1 })], {});
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
  it('real reviews override the listed rating', () => {
    const r = rank([mk({ id: 'a', rating: 4.9 }), mk({ id: 'b', rating: 4.5 })], { a: { avg: 2, count: 30 } });
    expect(r[0].id).toBe('b');
  });
  it('gives a brand-new partner a fair baseline and a small boost, but not enough to beat a clearly better crew', () => {
    const fresh = mk({ id: 'n', partnerId: 'n', rating: 0, reviews: 0, years: 3 });
    const vet = mk({ id: 'v', rating: 4.9, reviews: 40, years: 12 });
    expect(score(fresh, undefined, 800)).toBeGreaterThan(80);
    expect(rank([fresh, vet], {})[0].id).toBe('v');
    expect(rank([fresh, mk({ id: 'm', rating: 3.6, reviews: 10 })], {})[0].id).toBe('n');
  });
  it('penalises a rate far above the local median', () => {
    expect(score(mk({ dayRate: 2000 }), undefined, 800)).toBeLessThan(score(mk({ dayRate: 800 }), undefined, 800));
  });
  it('an approved partner can win a job, and never from another city', async () => {
    const p = await savePartner('9000000001', { ...CREW, years: 20 }); await setPartnerStatus(p.id, 'approved');
    const c = await candidates('bareilly', 'plumber');
    expect(c.map((x) => x.id)).toContain(p.id);
    expect((await candidates('agra', 'plumber')).map((x) => x.id)).not.toContain(p.id);
    await expect(matchPro('atlantis', 'plumber')).rejects.toThrow(/No verified/);
  });
});

describe('load sharing', () => {
  const mk = (id: string): Pro => ({ id, city: 'bareilly', locality: 'l', name: id, role: 'r', trade: 'plumber', rating: 4.5, reviews: 20, crew: 2, years: 8, dayRate: 800, housyId: id });
  it('picks the least busy among near-equals, never someone clearly worse', async () => {
    const { chooseBest } = await import('./matching');
    const ranked = [{ pro: mk('a'), score: 100 }, { pro: mk('b'), score: 95 }, { pro: mk('c'), score: 60 }];
    expect(chooseBest(ranked, { a: 2, b: 0, c: 0 })?.id).toBe('b');
    expect(chooseBest(ranked, { a: 0, b: 0 })?.id).toBe('a');
    expect(chooseBest([], {})).toBeUndefined();
  });
});

describe('job offers', () => {
  useTempStore();
  // A strong partner plumber so the matcher picks them for the bathroom's plumbing phase.
  async function withPartner() {
    const p = await savePartner('9000000001', { ...CREW, years: 40, dayRate: 800 }); await setPartnerStatus(p.id, 'approved');
    return p;
  }
  async function activeProject() {
    const p = await book(); await act(p.id, { action: 'complete_visit' }, '9876543210');
    return act(p.id, { action: 'accept_quote' }, '9876543210');
  }
  it('seed-only projects need no acceptance', async () => {
    const p = await activeProject();
    expect(p.milestones.every((m) => !m.offer)).toBe(true);
  });
  it('work is shared: once the top crew is busy, an equally good newcomer gets the next job (as a pending offer)', async () => {
    const partner = await withPartner();
    const first = await activeProject();
    expect(first.milestones.some((m) => m.pro.id === partner.id)).toBe(false);   // the veteran wins while idle
    const second = await activeProject();
    const mine = second.milestones.filter((m) => m.pro.id === partner.id);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((m) => m.offer?.status === 'pending')).toBe(true);
    expect(second.milestones.filter((m) => m.pro.id !== partner.id).every((m) => !m.offer)).toBe(true);
  });
  it('forced: pending offer blocks start; accept unblocks; the crew sees a first name only after accepting', async () => {
    const partner = await withPartner();
    const p = await activeProject();
    // Force the first milestone onto the partner to test the offer mechanics deterministically.
    const { withJson } = await import('./kv');
    await withJson<any[], void>('db', () => [], (all) => { const q = all.find((x) => x.id === p.id); q.milestones[0].pro = { ...partner, partnerId: partner.id, rating: 0, reviews: 0, trade: 'plumber', role: 'Plumber', crew: 3, dayRate: 800, housyId: 'x' }; q.milestones[0].offer = { status: 'pending' }; });
    await expect(act(p.id, { action: 'start', milestoneId: p.milestones[0].id }, '9876543210')).rejects.toThrow(/Waiting for/);
    let jobs = await jobsFor(partner.id);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].customer).toBeUndefined();
    jobs = await respondToOffer(partner.id, p.id, p.milestones[0].id, 'accept');
    expect(jobs[0].status).toBe('accepted');
    expect(jobs[0].customer).toBe('R');
    const started = await act(p.id, { action: 'start', milestoneId: p.milestones[0].id }, '9876543210');
    expect(started.milestones[0].status).toBe('in_progress');
    await expect(respondToOffer(partner.id, p.id, p.milestones[0].id, 'decline')).rejects.toThrow();
  });
  it('declining re-offers to the next best match and records it on the timeline; others cannot answer for you', async () => {
    const partner = await withPartner();
    const p = await activeProject();
    const { withJson } = await import('./kv');
    await withJson<any[], void>('db', () => [], (all) => { const q = all.find((x) => x.id === p.id); q.milestones[0].pro = { ...partner, partnerId: partner.id, rating: 0, reviews: 0, trade: 'plumber', role: 'Plumber', crew: 3, dayRate: 800, housyId: 'x' }; q.milestones[0].offer = { status: 'pending' }; });
    await expect(respondToOffer('P-NOBODY', p.id, p.milestones[0].id, 'accept')).rejects.toThrow(/not found/);
    await respondToOffer(partner.id, p.id, p.milestones[0].id, 'decline');
    const after = (await getProject(p.id, '9876543210'))!;
    expect(after.milestones[0].pro.id).not.toBe(partner.id);
    expect(after.milestones[0].offer?.declined).toContain(partner.id);
    expect(after.timeline.some((t) => t.text.includes('could not take the job'))).toBe(true);
    expect(await jobsFor(partner.id)).toEqual([]);
  });
});
