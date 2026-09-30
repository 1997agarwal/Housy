// The crew's side of a project: job offers Housy matched to them, and their answer.
import { withJson, readJson } from './kv';
import { chooseFor } from './matching';
import { ConflictError, NotFoundError, type Milestone, type Project } from './projects';
import { getType } from './catalog';
import { PartnerError } from './partners-shared';

export interface JobOffer {
  projectId: string; milestoneId: string; typeId: string; typeTitle: string; city: string; area: number;
  phaseId: string; phase: string; days: number; amount: number; status: 'pending' | 'accepted';
  milestoneStatus: Milestone['status']; customer?: string;   // customer's first name once the job is accepted
  projectStatus: Project['status'];
}

const now = () => new Date().toISOString();
const firstName = (n: string) => n.trim().split(/\s+/)[0] ?? '';

// Jobs where this partner is the matched pro. Contact details stay private: a first name only, and only after accepting.
export async function jobsFor(partnerId: string): Promise<JobOffer[]> {
  const projects = await readJson<Project[]>('db', []);
  const out: JobOffer[] = [];
  for (const p of projects) {
    if (p.status === 'cancelled') continue;
    for (const m of p.milestones) {
      if (m.pro.id !== partnerId || !m.offer) continue;
      out.push({
        projectId: p.id, milestoneId: m.id, typeId: p.typeId, typeTitle: getType(p.typeId)?.title ?? p.typeId, city: p.city, area: p.area,
        phaseId: m.phaseId, phase: m.name, days: m.days, amount: m.amount, status: m.offer.status, milestoneStatus: m.status, projectStatus: p.status,
        customer: m.offer.status === 'accepted' ? firstName(p.contact.name) : undefined,
      });
    }
  }
  return out.sort((a, b) => b.projectId.localeCompare(a.projectId));
}

// Accept a job, or decline it — in which case Housy offers it to the next best match straight away.
export async function respondToOffer(partnerId: string, projectId: string, milestoneId: string, decision: 'accept' | 'decline'): Promise<JobOffer[]> {
  if (decision !== 'accept' && decision !== 'decline') throw new PartnerError('Choose accept or decline');
  const before = (await readJson<Project[]>('db', [])).find((x) => x.id === projectId);
  const m0 = before?.milestones.find((x) => x.id === milestoneId);
  if (!before || !m0 || m0.pro.id !== partnerId || !m0.offer) throw new NotFoundError('Job not found');
  const declined = [...(m0.offer.declined ?? []), partnerId];
  const next = decision === 'decline' ? await chooseFor(before.city, m0.pro.trade, { typeId: before.typeId, exclude: declined }) : undefined;
  if (decision === 'decline' && !next) throw new ConflictError('There is nobody else to offer this job to — please contact Housy support');

  await withJson<Project[], void>('db', () => [], (all) => {
    const p = all.find((x) => x.id === projectId);
    const m = p?.milestones.find((x) => x.id === milestoneId);
    if (!p || !m || m.pro.id !== partnerId || !m.offer) throw new NotFoundError('Job not found');
    if (m.offer.status === 'accepted') throw new ConflictError('You already accepted this job');
    if (m.status !== 'upcoming') throw new ConflictError('This job has already started');
    const log = (text: string) => p.timeline.unshift({ at: now(), text });
    if (decision === 'accept') {
      m.offer = { ...m.offer, status: 'accepted' };
      log(`${m.pro.name} accepted the job: ${m.name}`);
    } else {
      log(`${m.pro.name} could not take the job: ${m.name}`);
      m.pro = next!; m.offer = next!.partnerId ? { status: 'pending', declined } : { status: 'accepted', declined };
      log(`${next!.name} was matched for: ${m.name}`);
    }
  });
  return jobsFor(partnerId);
}
