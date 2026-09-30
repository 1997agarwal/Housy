import { readJson, withJson } from './kv';
import { getProject, ConflictError, NotFoundError, ValidationError } from './projects';
import { ISSUE_TYPES, ESCALATE_AFTER_HOURS, MAX_OPEN_ISSUES, type IssueStatus, type IssueType } from './issues-shared';

export interface IssueMessage { by: 'owner' | 'housy'; text: string; at: string }
export interface Issue {
  id: string; projectId: string; owner: string; milestoneId?: string; type: IssueType; status: IssueStatus;
  messages: IssueMessage[]; resolution?: string; createdAt: string; updatedAt: string;
}
export type OwnerIssue = Issue & { escalated: boolean };

// Unresolved for too long → flagged for ops. Computed, so it can never get stale.
export const isEscalated = (i: Issue, now = Date.now()) => i.status !== 'resolved' && now - Date.parse(i.createdAt) > ESCALATE_AFTER_HOURS * 3_600_000;
const view = (i: Issue): OwnerIssue => ({ ...i, escalated: isEscalated(i) });
const clean = (v: unknown, min: number, max: number, what: string) => {
  const t = typeof v === 'string' ? v.trim() : '';
  if (t.length < min) throw new ValidationError(`${what} must be at least ${min} characters`);
  return t.slice(0, max);
};
const newId = () => 'IS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
const now = () => new Date().toISOString();

export async function createIssue(projectId: string, owner: string, raw: any): Promise<OwnerIssue> {
  const type = raw?.type;
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(ISSUE_TYPES, type)) throw new ValidationError('Choose what kind of problem this is');
  const text = clean(raw?.description, 10, 1000, 'Description');
  const project = await getProject(projectId, owner);
  if (!project) throw new NotFoundError('Project not found');
  if (project.status !== 'active' && project.status !== 'completed') throw new ConflictError('Problems can be reported once work has started');
  let milestoneId: string | undefined;
  if (raw?.milestoneId) {
    milestoneId = String(raw.milestoneId);
    if (!project.milestones.some((m) => m.id === milestoneId)) throw new ValidationError('That milestone is not part of this project');
  }
  return withJson<Issue[], OwnerIssue>('issues', () => [], (all) => {
    if (all.filter((i) => i.projectId === projectId && i.status !== 'resolved').length >= MAX_OPEN_ISSUES) throw new ConflictError(`You already have ${MAX_OPEN_ISSUES} open problems on this project — please wait for them to be resolved`);
    const t = now();
    const issue: Issue = { id: newId(), projectId, owner, milestoneId, type: type as IssueType, status: 'open', messages: [{ by: 'owner', text, at: t }], createdAt: t, updatedAt: t };
    all.push(issue);
    return view(issue);
  });
}

export async function issuesForProject(projectId: string, owner: string): Promise<OwnerIssue[]> {
  return (await readJson<Issue[]>('issues', [])).filter((i) => i.projectId === projectId && i.owner === owner)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(view);
}

export type OwnerAction = { action: 'message'; text: string } | { action: 'resolve' } | { action: 'reopen'; text?: string };

// Owner acts on their own issue. Someone else's issue looks like it doesn't exist.
export function ownerAct(issueId: string, owner: string, a: OwnerAction): Promise<OwnerIssue> {
  return withJson<Issue[], OwnerIssue>('issues', () => [], (all) => {
    const i = all.find((x) => x.id === issueId && x.owner === owner);
    if (!i) throw new NotFoundError('Problem not found');
    const t = now();
    if (a.action === 'message') {
      if (i.status === 'resolved') throw new ConflictError('This problem is resolved — reopen it to add more');
      i.messages.push({ by: 'owner', text: clean(a.text, 2, 1000, 'Message'), at: t });
    } else if (a.action === 'resolve') {
      if (i.status === 'resolved') throw new ConflictError('Already resolved');
      i.status = 'resolved'; i.resolution = 'Marked resolved by you';
    } else {
      if (i.status !== 'resolved') throw new ConflictError('This problem is still open');
      i.status = 'open'; i.resolution = undefined;
      if (a.text) i.messages.push({ by: 'owner', text: clean(a.text, 2, 1000, 'Message'), at: t });
    }
    i.updatedAt = t;
    return view(i);
  });
}

// ── Ops side ─────────────────────────────────────────────────────────
export interface OpsIssue extends OwnerIssue { ownerMasked: string }
const mask = (p: string) => p.slice(0, 2) + '******' + p.slice(-2);

export async function opsIssues(): Promise<OpsIssue[]> {
  const all = await readJson<Issue[]>('issues', []);
  // Escalated first, then oldest first; resolved issues last.
  return all.map((i) => ({ ...view(i), ownerMasked: mask(i.owner) })).sort((a, b) =>
    Number(a.status === 'resolved') - Number(b.status === 'resolved') || Number(b.escalated) - Number(a.escalated) || a.createdAt.localeCompare(b.createdAt));
}

export type OpsAction = { action: 'reply'; text: string } | { action: 'resolve'; resolution: string };
export function opsAct(issueId: string, a: OpsAction): Promise<OwnerIssue> {
  return withJson<Issue[], OwnerIssue>('issues', () => [], (all) => {
    const i = all.find((x) => x.id === issueId);
    if (!i) throw new NotFoundError('Problem not found');
    const t = now();
    if (a.action === 'reply') {
      if (i.status === 'resolved') throw new ConflictError('Already resolved');
      i.messages.push({ by: 'housy', text: clean(a.text, 2, 1000, 'Reply'), at: t });
      i.status = 'in_progress';
    } else {
      if (i.status === 'resolved') throw new ConflictError('Already resolved');
      i.resolution = clean(a.resolution, 5, 500, 'Resolution');
      i.messages.push({ by: 'housy', text: `Resolved: ${i.resolution}`, at: t });
      i.status = 'resolved';
    }
    i.updatedAt = t;
    return view(i);
  });
}
