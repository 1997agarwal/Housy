import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createProject, validateCreate, ConflictError, NotFoundError, ValidationError } from './projects';
import { createIssue, isEscalated, issuesForProject, opsAct, opsIssues, ownerAct } from './issues';
import { useTempStore } from '../test/helpers';

const OWNER = '9876543210', OTHER = '9123456789';
const valid = { type: 'quality', description: 'The tile joints in the corner are uneven', };

async function activeProject(owner = OWNER) {
  const p = await createProject(validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: new Date(Date.now() + 864e5).toISOString() } as any), owner);
  await act(p.id, { action: 'complete_visit' }, owner);
  return act(p.id, { action: 'accept_quote' }, owner);
}

describe('issues', () => {
  useTempStore();
  afterEach(() => vi.useRealTimers());

  it('validates type and description; only for started work', async () => {
    const pre = await createProject(validateCreate({ typeId: 'kitchen', city: 'bareilly', area: 90, tier: 'standard', name: 'R', phone: '9811122233', slot: new Date(Date.now() + 864e5).toISOString() } as any), OWNER);
    await expect(createIssue(pre.id, OWNER, valid)).rejects.toThrow(ConflictError);     // work hasn't started
    const p = await activeProject();
    await expect(createIssue(p.id, OWNER, { ...valid, type: 'hack' })).rejects.toThrow(ValidationError);
    await expect(createIssue(p.id, OWNER, { ...valid, type: '__proto__' })).rejects.toThrow(ValidationError);
    await expect(createIssue(p.id, OWNER, { ...valid, description: 'short' })).rejects.toThrow(/at least 10/);
    await expect(createIssue(p.id, OWNER, { ...valid, milestoneId: 'nope' })).rejects.toThrow(/milestone/);
    const i = await createIssue(p.id, OWNER, { ...valid, milestoneId: p.milestones[0].id });
    expect(i).toMatchObject({ status: 'open', type: 'quality', escalated: false });
    expect(i.messages).toHaveLength(1);
  });

  it('is private to the project owner', async () => {
    const p = await activeProject();
    const i = await createIssue(p.id, OWNER, valid);
    await expect(createIssue(p.id, OTHER, valid)).rejects.toThrow(NotFoundError);
    await expect(ownerAct(i.id, OTHER, { action: 'resolve' })).rejects.toThrow(NotFoundError);
    await expect(ownerAct(i.id, OTHER, { action: 'message', text: 'hello' })).rejects.toThrow(NotFoundError);
    expect(await issuesForProject(p.id, OTHER)).toEqual([]);
    expect(await issuesForProject(p.id, OWNER)).toHaveLength(1);
  });

  it('caps open issues per project, and resolving frees a slot', async () => {
    const p = await activeProject();
    const made = [];
    for (let i = 0; i < 5; i++) made.push(await createIssue(p.id, OWNER, valid));
    await expect(createIssue(p.id, OWNER, valid)).rejects.toThrow(/5 open/);
    await ownerAct(made[0].id, OWNER, { action: 'resolve' });
    await expect(createIssue(p.id, OWNER, valid)).resolves.toBeTruthy();
  });

  it('owner ↔ Housy conversation, resolve, and reopen', async () => {
    const p = await activeProject();
    const i = await createIssue(p.id, OWNER, valid);
    const r1 = await opsAct(i.id, { action: 'reply', text: 'We are calling the crew today.' });
    expect(r1.status).toBe('in_progress');
    expect(r1.messages.map((m) => m.by)).toEqual(['owner', 'housy']);
    const r2 = await ownerAct(i.id, OWNER, { action: 'message', text: 'Thanks, please update me' });
    expect(r2.messages).toHaveLength(3);
    await expect(opsAct(i.id, { action: 'resolve', resolution: 'ok' })).rejects.toThrow(/at least 5/);
    const done = await opsAct(i.id, { action: 'resolve', resolution: 'Crew redid the joints' });
    expect(done).toMatchObject({ status: 'resolved', resolution: 'Crew redid the joints' });
    await expect(ownerAct(i.id, OWNER, { action: 'message', text: 'one more thing' })).rejects.toThrow(/reopen/);
    await expect(opsAct(i.id, { action: 'reply', text: 'late reply' })).rejects.toThrow(ConflictError);
    const re = await ownerAct(i.id, OWNER, { action: 'reopen', text: 'Still uneven near the drain' });
    expect(re).toMatchObject({ status: 'open', resolution: undefined });
    await expect(ownerAct(i.id, OWNER, { action: 'reopen' })).rejects.toThrow(ConflictError);   // not resolved anymore
  });

  it('escalates unresolved issues after 48 hours, never resolved ones', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    const p = await activeProject();
    const a = await createIssue(p.id, OWNER, valid);
    const b = await createIssue(p.id, OWNER, valid);
    await ownerAct(b.id, OWNER, { action: 'resolve' });
    expect(isEscalated({ ...a, createdAt: a.createdAt } as any, Date.parse('2026-10-03T09:59:00Z'))).toBe(false);
    vi.setSystemTime(new Date('2026-10-03T10:01:00Z'));
    const list = await issuesForProject(p.id, OWNER);
    expect(list.find((i) => i.id === a.id)!.escalated).toBe(true);
    expect(list.find((i) => i.id === b.id)!.escalated).toBe(false);
  });

  it('ops queue: escalated first, then oldest; resolved last; owner phones masked', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    const p1 = await activeProject(OWNER);
    const old = await createIssue(p1.id, OWNER, valid);
    vi.setSystemTime(new Date('2026-10-04T10:00:00Z'));
    const p2 = await activeProject(OTHER);
    const fresh = await createIssue(p2.id, OTHER, valid);
    const resolved = await createIssue(p2.id, OTHER, valid);
    await ownerAct(resolved.id, OTHER, { action: 'resolve' });
    const q = await opsIssues();
    expect(q.map((i) => i.id)).toEqual([old.id, fresh.id, resolved.id]);
    expect(q[0].escalated).toBe(true);
    expect(q.every((i) => /^\d{2}\*{6}\d{2}$/.test(i.ownerMasked))).toBe(true);
  });

  it('a stale issue id is a 404 for ops too', async () => {
    await expect(opsAct('IS-NOPE00', { action: 'reply', text: 'hi there' })).rejects.toThrow(NotFoundError);
  });
});
