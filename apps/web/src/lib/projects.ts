import { promises as fs } from 'fs';
import path from 'path';
import { estimate, getType, type Estimate, type Tier } from './catalog';
import { proForTrade, visitExpert, type Pro } from './pros';

// ── Types ────────────────────────────────────────────────────────────
export type ProjectStatus = 'visit_scheduled' | 'quote_ready' | 'active' | 'completed';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'in_review' | 'paid';

export interface Milestone {
  id: string; phaseId: string; name: string; days: number; amount: number;
  status: MilestoneStatus; pro: Pro; updatedAt?: string;
}
export interface Project {
  id: string; createdAt: string; status: ProjectStatus;
  typeId: string; city: string; area: number; tier: Tier; drainFt?: number; notes?: string;
  contact: { name: string; phone: string };
  estimate: Estimate;
  visit: { slot: string; fee: number; expert: Pro; done: boolean };
  quote?: { total: number; advance: number; findings: string[]; issuedAt: string; accepted: boolean };
  milestones: Milestone[];
  paid: number;
  timeline: { at: string; text: string }[];
}

// ── Store: JSON file. Swap this module for Supabase without touching callers. ──
const FILE = path.join(process.cwd(), '.data', 'db.json');
let lock: Promise<unknown> = Promise.resolve();

async function read(): Promise<Project[]> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return []; }
}
async function write(all: Project[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}
// Serialise read-modify-write so concurrent requests can't clobber each other.
function tx<T>(fn: (all: Project[]) => Promise<T> | T): Promise<T> {
  const run = lock.then(async () => { const all = await read(); const r = await fn(all); await write(all); return r; });
  lock = run.catch(() => undefined);
  return run;
}

export const listProjects = async () => (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getProject = async (id: string) => (await read()).find((p) => p.id === id) ?? null;

// ── Commands ─────────────────────────────────────────────────────────
export interface CreateInput {
  typeId: string; city: string; area: number; tier: Tier; drainFt?: number; notes?: string;
  name: string; phone: string; slot: string;
}
export class ValidationError extends Error {}

export function validateCreate(i: Partial<CreateInput>): CreateInput {
  const type = i.typeId && getType(i.typeId);
  if (!type) throw new ValidationError('Unknown project type');
  if (!i.name?.trim()) throw new ValidationError('Name is required');
  const digits = (i.phone ?? '').replace(/[\s-]/g, '');
  const local = digits.length > 10 ? digits.replace(/^(\+91|91|0)/, '') : digits; // only strip a prefix when there is one
  if (!/^[6-9]\d{9}$/.test(local)) throw new ValidationError('Enter a valid 10-digit Indian mobile number');
  if (!i.slot || Number.isNaN(Date.parse(i.slot))) throw new ValidationError('Pick a visit slot');
  if (!i.tier || !['economy', 'standard', 'premium'].includes(i.tier)) throw new ValidationError('Invalid quality tier');
  const area = Number(i.area);
  if (!(area >= 5 && area <= 20000)) throw new ValidationError('Area looks wrong');
  return { ...(i as CreateInput), area, drainFt: i.drainFt == null ? undefined : Math.max(0, Number(i.drainFt)) };
}

const now = () => new Date().toISOString();
const newId = () => 'HSY-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export function createProject(input: CreateInput) {
  return tx((all) => {
    const type = getType(input.typeId)!;
    const est = estimate({ typeId: input.typeId, city: input.city, area: input.area, tier: input.tier, drainFt: input.drainFt });
    const p: Project = {
      id: newId(), createdAt: now(), status: 'visit_scheduled',
      typeId: input.typeId, city: input.city, area: input.area, tier: input.tier, drainFt: input.drainFt, notes: input.notes,
      contact: { name: input.name.trim(), phone: input.phone.trim() },
      estimate: est,
      visit: { slot: input.slot, fee: type.visitFee, expert: visitExpert(type.needsEngineer), done: false },
      milestones: [], paid: 0,
      timeline: [{ at: now(), text: `Site visit booked for ${new Date(input.slot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` }],
    };
    all.push(p);
    return p;
  });
}

const ADVANCE_PCT = 0.2;

export type Action =
  | { action: 'complete_visit' }
  | { action: 'accept_quote' }
  | { action: 'start' | 'submit' | 'approve'; milestoneId: string };

export class ConflictError extends Error {}

export function act(id: string, a: Action) {
  return tx((all) => {
    const p = all.find((x) => x.id === id);
    if (!p) throw new ValidationError('Project not found');
    const log = (text: string) => p.timeline.unshift({ at: now(), text });

    if (a.action === 'complete_visit') {
      if (p.status !== 'visit_scheduled') throw new ConflictError('Visit already completed');
      const total = Math.round(p.estimate.total / 500) * 500;
      const findings = [
        `Site measured: ${p.area} sq ft confirmed.`,
        ...p.estimate.flags.filter((f) => f.level !== 'green').map((f) => f.text),
        'Fixed price: only changes if you change the scope in writing.',
      ];
      p.visit.done = true;
      p.status = 'quote_ready';
      p.quote = { total, advance: Math.round((total * ADVANCE_PCT) / 100) * 100, findings, issuedAt: now(), accepted: false };
      log(`${p.visit.expert.name} completed the visit and issued a fixed quote of ₹${total.toLocaleString('en-IN')}`);
    } else if (a.action === 'accept_quote') {
      if (p.status !== 'quote_ready' || !p.quote) throw new ConflictError('No quote to accept');
      const q = p.quote;
      const remaining = q.total - q.advance;
      const phaseTotal = p.estimate.phases.reduce((s, x) => s + x.subtotal, 0) || 1;
      let assigned = 0;
      p.milestones = p.estimate.phases.map((ph, i, arr) => {
        // Last milestone absorbs rounding so amounts always sum to the quote.
        const amt = i === arr.length - 1 ? remaining - assigned : Math.round((remaining * ph.subtotal) / phaseTotal / 100) * 100;
        assigned += amt;
        return { id: `${p.id}-M${i + 1}`, phaseId: ph.id, name: ph.name, days: ph.days, amount: amt, status: 'upcoming' as const, pro: proForTrade(ph.trade) };
      });
      q.accepted = true; p.status = 'active'; p.paid = q.advance;
      log(`Quote accepted — advance of ₹${q.advance.toLocaleString('en-IN')} paid`);
    } else {
      if (p.status !== 'active') throw new ConflictError('Project is not active');
      const idx = p.milestones.findIndex((m) => m.id === a.milestoneId);
      if (idx < 0) throw new ValidationError('Milestone not found');
      const m = p.milestones[idx];
      if (a.action === 'start') {
        if (m.status !== 'upcoming') throw new ConflictError('Milestone already started');
        if (p.milestones.slice(0, idx).some((x) => x.status !== 'paid')) throw new ConflictError('Finish and approve earlier milestones first');
        m.status = 'in_progress'; log(`${m.pro.name} started: ${m.name}`);
      } else if (a.action === 'submit') {
        if (m.status !== 'in_progress') throw new ConflictError('Milestone is not in progress');
        m.status = 'in_review'; log(`${m.pro.name} submitted for your review: ${m.name}`);
      } else {
        if (m.status !== 'in_review') throw new ConflictError('Nothing to approve yet');
        m.status = 'paid'; p.paid += m.amount; log(`You approved "${m.name}" — ₹${m.amount.toLocaleString('en-IN')} released`);
        if (p.milestones.every((x) => x.status === 'paid')) { p.status = 'completed'; log('Project completed 🎉'); }
      }
      m.updatedAt = now();
    }
    return p;
  });
}
