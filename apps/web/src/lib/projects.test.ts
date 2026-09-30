import { describe, expect, it } from 'vitest';
import { act, addPhoto, createProject, getProject, listProjects, validateCreate, ConflictError, NotFoundError, ValidationError, type CreateInput } from './projects';
import { useTempStore } from '../test/helpers';

const slot = () => new Date(Date.now() + 2 * 864e5).toISOString();
const input = (over: Partial<CreateInput> = {}): CreateInput => validateCreate({
  typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 18, name: 'Ram', phone: '9811122233', slot: slot(), ...over,
});
const OWNER = '9876543210', OTHER = '9123456789';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

// Drives one milestone through start → photo → submit → approve, like the crew and owner would.
async function finish(projectId: string, milestoneId: string, owner = OWNER) {
  await act(projectId, { action: 'start', milestoneId }, owner);
  await addPhoto(projectId, owner, milestoneId, PNG, 'png', 'progress');
  await act(projectId, { action: 'submit', milestoneId, note: 'Done and tested' }, owner);
  return act(projectId, { action: 'approve', milestoneId }, owner);
}

describe('validateCreate', () => {
  const bad = (over: object) => () => validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', name: 'Ram', phone: '9811122233', slot: slot(), ...over } as any);
  it('rejects bad input with a clear ValidationError', () => {
    for (const over of [{ typeId: 'nope' }, { name: ' ' }, { phone: '123' }, { slot: 'x' }, { tier: 'gold' }, { area: 1 }, { area: 99999 }, { city: 'atlantis' }, { propertyValueLakh: -1 }])
      expect(bad(over), JSON.stringify(over)).toThrow(ValidationError);
  });
  it('refuses coming-soon cities', () => expect(bad({ city: 'mumbai' })).toThrow(/not live in Mumbai/));
  it('requires a valid style for interiors only', () => {
    expect(bad({ typeId: 'interiors-full' })).toThrow(/style/);
    expect(bad({ typeId: 'interiors-full', style: 'Baroque' })).toThrow(/style/);
    expect(validateCreate({ typeId: 'interiors-full', city: 'bareilly', area: 1000, tier: 'standard', name: 'R', phone: '9811122233', slot: slot(), style: 'Modern' } as any).style).toBe('Modern');
    expect(input().style).toBeUndefined(); // ignored for non-interiors
  });
  it('normalises the city name to an id and keeps a 91-prefixed 10-digit phone intact', () => {
    const v = validateCreate({ typeId: 'kitchen', city: 'Lucknow', area: 90, tier: 'standard', name: 'R', phone: '9123456789', slot: slot() } as any);
    expect(v.city).toBe('lucknow');
    expect(v.phone).toBe('9123456789');
  });
});

describe('interiors scope validation', () => {
  const v = (over: object) => () => validateCreate({ typeId: 'interiors-full', city: 'bareilly', area: 1000, tier: 'standard', name: 'R', phone: '9811122233', slot: slot(), style: 'Modern', ...over } as any);
  it('accepts a room subset and finish choices', () => {
    const r = v({ rooms: ['living', 'living', 'kitchen'], finishes: { shutter: 'acrylic', lighting: 'designer' } })();
    expect(r.rooms).toEqual(['living', 'kitchen']);
    expect(r.finishes).toEqual({ shutter: 'acrylic', lighting: 'designer' });
  });
  it('rejects empty/unknown rooms and unknown finishes', () => {
    expect(v({ rooms: [] })).toThrow(/at least one room/);
    expect(v({ rooms: ['moat'] })).toThrow(/Unknown room/);
    expect(v({ finishes: { shutter: 'gold' } })).toThrow(/option/);
    expect(v({ finishes: { shutter: 42 } })).toThrow(/option/);
  });
  it('ignores rooms/finishes on project types that do not have them', () => {
    const r = validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', name: 'R', phone: '9811122233', slot: slot(), rooms: ['living'], finishes: { shutter: 'pu' } } as any);
    expect(r.rooms).toBeUndefined();
    expect(r.finishes).toBeUndefined();
  });
});

describe('project lifecycle', () => {
  useTempStore();

  it('runs booking → visit → quote → milestones → completed, with money adding up', async () => {
    const p = await createProject(input(), OWNER);
    expect(p.status).toBe('visit_scheduled');
    expect(p.visit.expert.city).toBe('bareilly');

    const q = await act(p.id, { action: 'complete_visit' }, OWNER);
    expect(q.status).toBe('quote_ready');
    expect(q.quote!.advance).toBe(Math.round((q.quote!.total * 0.2) / 100) * 100);

    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    expect(a.status).toBe('active');
    expect(a.paid).toBe(a.quote!.advance);
    expect(a.milestones.reduce((s, m) => s + m.amount, 0) + a.quote!.advance).toBe(a.quote!.total);
    expect(a.milestones.every((m) => m.pro.city === 'bareilly')).toBe(true);

    let cur = a;
    for (const m of a.milestones) cur = await finish(p.id, m.id);
    expect(cur.status).toBe('completed');
    expect(cur.paid).toBe(cur.quote!.total);
  });

  it('re-prices the quote from the expert’s on-site measurements', async () => {
    const p = await createProject(input({ area: 45, drainFt: 10 }), OWNER);
    const q = await act(p.id, { action: 'complete_visit', measuredArea: 90, measuredDrainFt: 35, note: 'Old 9-inch wall' }, OWNER);
    expect(q.area).toBe(90);
    expect(q.drainFt).toBe(35);
    expect(q.quote!.total).toBeGreaterThan(Math.round(p.estimate.total / 500) * 500);
    expect(q.initialTotal).toBe(p.estimate.total);
    expect(q.quote!.findings.join(' ')).toMatch(/Measured 90 sq ft/);
    expect(q.quote!.findings.join(' ')).toMatch(/drain/i);
    expect(q.quote!.findings.join(' ')).toMatch(/Old 9-inch wall/);
  });

  it('keeps the estimate when measurements match', async () => {
    const p = await createProject(input(), OWNER);
    const q = await act(p.id, { action: 'complete_visit', measuredArea: 45 }, OWNER);
    expect(q.initialTotal).toBeUndefined();
    expect(q.quote!.total).toBe(Math.round(p.estimate.total / 500) * 500);
  });

  it('rejects absurd measurements without changing the project', async () => {
    const p = await createProject(input(), OWNER);
    await expect(act(p.id, { action: 'complete_visit', measuredArea: -3 }, OWNER)).rejects.toThrow(ValidationError);
    await expect(act(p.id, { action: 'complete_visit', measuredArea: 1e9 }, OWNER)).rejects.toThrow(ValidationError);
    expect((await getProject(p.id, OWNER))!.status).toBe('visit_scheduled');
  });

  it('enforces order: no double visit, no early accept, no skipping milestones, no approving unfinished work', async () => {
    const p = await createProject(input(), OWNER);
    await expect(act(p.id, { action: 'accept_quote' }, OWNER)).rejects.toThrow(ConflictError);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    await expect(act(p.id, { action: 'complete_visit' }, OWNER)).rejects.toThrow(ConflictError);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    await expect(act(p.id, { action: 'accept_quote' }, OWNER)).rejects.toThrow(ConflictError);
    const [m1, m2] = a.milestones;
    await expect(act(p.id, { action: 'start', milestoneId: m2.id }, OWNER)).rejects.toThrow(/earlier milestones/);
    await expect(act(p.id, { action: 'approve', milestoneId: m1.id }, OWNER)).rejects.toThrow(ConflictError);
    await act(p.id, { action: 'start', milestoneId: m1.id }, OWNER);
    await expect(act(p.id, { action: 'start', milestoneId: m1.id }, OWNER)).rejects.toThrow(ConflictError);
    await expect(act(p.id, { action: 'approve', milestoneId: m1.id }, OWNER)).rejects.toThrow(ConflictError); // not submitted
    await expect(act(p.id, { action: 'start', milestoneId: 'nope' }, OWNER)).rejects.toThrow(ValidationError);
  });

  it('a milestone cannot be submitted without photo proof, and the crew note is kept', async () => {
    const p = await createProject(input(), OWNER);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    const m = a.milestones[0];
    await act(p.id, { action: 'start', milestoneId: m.id }, OWNER);
    await expect(act(p.id, { action: 'submit', milestoneId: m.id }, OWNER)).rejects.toThrow(/photo/);
    await addPhoto(p.id, OWNER, m.id, PNG, 'png');
    const s = await act(p.id, { action: 'submit', milestoneId: m.id, note: '  slope checked  ' }, OWNER);
    expect(s.milestones[0].status).toBe('in_review');
    expect(s.milestones[0].crewNote).toBe('slope checked');
  });

  it('a photo for another milestone does not count as proof', async () => {
    const p = await createProject(input(), OWNER);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    await finish(p.id, a.milestones[0].id);
    await act(p.id, { action: 'start', milestoneId: a.milestones[1].id }, OWNER);
    await expect(act(p.id, { action: 'submit', milestoneId: a.milestones[1].id }, OWNER)).rejects.toThrow(/photo/);
  });

  it('photos: only for the owner, only while in progress, capped per milestone', async () => {
    const p = await createProject(input(), OWNER);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    const m = a.milestones[0];
    await expect(addPhoto(p.id, OWNER, m.id, PNG, 'png')).rejects.toThrow(/in progress/);   // not started
    await act(p.id, { action: 'start', milestoneId: m.id }, OWNER);
    await expect(addPhoto(p.id, OTHER, m.id, PNG, 'png')).rejects.toThrow(NotFoundError);   // not yours
    await expect(addPhoto(p.id, OWNER, 'nope', PNG, 'png')).rejects.toThrow(ValidationError);
    for (let i = 0; i < 6; i++) await addPhoto(p.id, OWNER, m.id, PNG, 'png');
    await expect(addPhoto(p.id, OWNER, m.id, PNG, 'png')).rejects.toThrow(/At most 6/);
    expect((await getProject(p.id, OWNER))!.photos).toHaveLength(6);
  });

  it('paying twice is impossible: approve is single-use', async () => {
    const p = await createProject(input(), OWNER);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    const m = a.milestones[0];
    await finish(p.id, m.id);
    const paid = (await getProject(p.id, OWNER))!.paid;
    await expect(act(p.id, { action: 'approve', milestoneId: m.id }, OWNER)).rejects.toThrow(ConflictError);
    expect((await getProject(p.id, OWNER))!.paid).toBe(paid);
  });

  it('supports reschedule and cancel, but not after work starts', async () => {
    const p = await createProject(input(), OWNER);
    const later = new Date(Date.now() + 3 * 864e5).toISOString();
    expect((await act(p.id, { action: 'reschedule', slot: later }, OWNER)).visit.slot).toBe(later);
    await expect(act(p.id, { action: 'reschedule', slot: new Date(Date.now() - 1000).toISOString() }, OWNER)).rejects.toThrow(/future/);
    await expect(act(p.id, { action: 'reschedule', slot: 'garbage' }, OWNER)).rejects.toThrow(ValidationError);
    const c = await act(p.id, { action: 'cancel', reason: 'Changed plans' }, OWNER);
    expect(c.status).toBe('cancelled');
    expect(c.cancelReason).toBe('Changed plans');
    await expect(act(p.id, { action: 'complete_visit' }, OWNER)).rejects.toThrow(ConflictError);

    const p2 = await createProject(input(), OWNER);
    await act(p2.id, { action: 'complete_visit' }, OWNER);
    expect((await act(p2.id, { action: 'cancel' }, OWNER)).status).toBe('cancelled'); // declining a quote
    const p3 = await createProject(input(), OWNER);
    await act(p3.id, { action: 'complete_visit' }, OWNER);
    await act(p3.id, { action: 'accept_quote' }, OWNER);
    await expect(act(p3.id, { action: 'cancel' }, OWNER)).rejects.toThrow(/already started/);
  });

  it('a project you do not own is indistinguishable from one that does not exist', async () => {
    const p = await createProject(input(), OWNER);
    expect(await getProject(p.id, OTHER)).toBeNull();
    expect(await listProjects(OTHER)).toEqual([]);
    await expect(act(p.id, { action: 'complete_visit' }, OTHER)).rejects.toThrow(NotFoundError);
    await expect(act('HSY-NOPE00', { action: 'cancel' }, OWNER)).rejects.toThrow(NotFoundError);
    expect((await getProject(p.id, OWNER))!.status).toBe('visit_scheduled'); // untouched
    expect(await listProjects(OWNER)).toHaveLength(1);
  });

  it('the chosen rooms and finishes are priced in, and survive on-site re-measurement', async () => {
    const mk = (over: object) => createProject(validateCreate({ typeId: 'interiors-full', city: 'bareilly', area: 1000, tier: 'standard', name: 'R', phone: '9811122233', slot: slot(), style: 'Modern', ...over } as any), OWNER);
    const whole = await mk({});
    const scoped = await mk({ rooms: ['living', 'kitchen'], finishes: { shutter: 'pu' } });
    expect(scoped.estimate.total).toBeLessThan(whole.estimate.total);
    expect(scoped.estimate.rooms).toHaveLength(2);
    const q = await act(scoped.id, { action: 'complete_visit', measuredArea: 1200 }, OWNER);
    expect(q.rooms).toEqual(['living', 'kitchen']);
    expect(q.estimate.rooms).toHaveLength(2);
    expect(q.quote!.total).toBeGreaterThan(Math.round(scoped.estimate.total / 500) * 500);
  });

  it('design review: the owner can send work back, only up to 3 times, and each fix needs a fresh photo', async () => {
    const p = await createProject(input(), OWNER);
    await act(p.id, { action: 'complete_visit' }, OWNER);
    const a = await act(p.id, { action: 'accept_quote' }, OWNER);
    const m = a.milestones[0];
    await expect(act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'Please redo the corner' }, OWNER)).rejects.toThrow(ConflictError); // nothing to review yet
    await act(p.id, { action: 'start', milestoneId: m.id }, OWNER);
    await addPhoto(p.id, OWNER, m.id, PNG, 'png', 'v1');
    await act(p.id, { action: 'submit', milestoneId: m.id }, OWNER);

    await expect(act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'no' }, OWNER)).rejects.toThrow(ValidationError);
    const r1 = await act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'Slope looks too shallow' }, OWNER);
    expect(r1.milestones[0]).toMatchObject({ status: 'in_progress', revisions: 1, feedback: 'Slope looks too shallow', crewNote: undefined });
    await expect(act(p.id, { action: 'submit', milestoneId: m.id }, OWNER)).rejects.toThrow(/new photo/);   // old photo doesn't count
    await new Promise((r) => setTimeout(r, 5));
    await addPhoto(p.id, OWNER, m.id, PNG, 'png', 'v2');
    await act(p.id, { action: 'submit', milestoneId: m.id }, OWNER);

    for (let round = 2; round <= 3; round++) {
      await act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: `Round ${round} changes please` }, OWNER);
      await new Promise((r) => setTimeout(r, 5));
      await addPhoto(p.id, OWNER, m.id, PNG, 'png');
      await act(p.id, { action: 'submit', milestoneId: m.id }, OWNER);
    }
    await expect(act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'One more time please' }, OWNER)).rejects.toThrow(/Maximum revisions/);
    const done = await act(p.id, { action: 'approve', milestoneId: m.id }, OWNER);   // approving is still possible
    expect(done.milestones[0].status).toBe('paid');
    await expect(act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'Too late now' }, OWNER)).rejects.toThrow(ConflictError);
    await expect(act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'Stranger' }, OTHER)).rejects.toThrow(NotFoundError);
  });

  it('interiors and new-house projects are assigned a designer / architect', async () => {
    const i = await createProject(validateCreate({ typeId: 'interiors-full', city: 'lucknow', area: 900, tier: 'standard', name: 'R', phone: '9811122233', slot: slot(), style: 'Modern' } as any), OWNER);
    expect(i.visit.expert.trade).toBe('designer');
    const h = await createProject(input({ typeId: 'new-house', area: 1500, drainFt: undefined }), OWNER);
    expect(h.visit.expert.trade).toBe('architect');
  });

  it('survives many concurrent writes without losing any', async () => {
    await Promise.all(Array.from({ length: 25 }, () => createProject(input(), OWNER)));
    const all = await listProjects(OWNER);
    expect(all).toHaveLength(25);
    expect(new Set(all.map((x) => x.id)).size).toBe(25);
  });
});
