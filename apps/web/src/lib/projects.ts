import { readJson, withJson } from './kv';
import { normalizePhone } from './phone';
import { estimate, getType, STYLES, type Estimate, type Tier } from './catalog';
import { proForTrade, visitExpert, type Pro } from './pros';
import type { Trade } from './catalog';
import { getCity } from './cities';
import { saveImage, type ImageExt } from './uploads';
import { CHANGE_TRADES, MAX_PENDING_CHANGES, MAX_PHOTOS_PER_MILESTONE, MAX_REVISIONS } from './limits';

// ── Types ────────────────────────────────────────────────────────────
export type ProjectStatus = 'visit_scheduled' | 'quote_ready' | 'active' | 'completed' | 'cancelled';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'in_review' | 'paid';

export interface Milestone {
  id: string; phaseId: string; name: string; days: number; amount: number;
  status: MilestoneStatus; pro: Pro; updatedAt?: string;
  crewNote?: string;         // the crew's message when they submit the work for review
  revisions?: number;        // how many times the owner sent this milestone back for changes
  feedback?: string;         // the owner's latest change request
  feedbackAt?: string;       // photos must be newer than this to count as proof of the fix
}
export { MAX_REVISIONS };
export { CHANGE_TRADES, MAX_PENDING_CHANGES };
export type ChangeStatus = 'requested' | 'quoted' | 'approved' | 'declined';
export interface ChangeOrder {
  id: string; title: string; description: string; trade: Trade; status: ChangeStatus;
  amount?: number; days?: number; createdAt: string; updatedAt: string;
}
export interface Photo { id: string; milestoneId: string; ext: ImageExt; caption?: string; at: string }
export { MAX_PHOTOS_PER_MILESTONE };
export interface Project {
  id: string; owner: string; createdAt: string; status: ProjectStatus;
  typeId: string; city: string; area: number; tier: Tier; drainFt?: number; notes?: string; style?: string; propertyValueLakh?: number; rooms?: string[]; finishes?: Record<string, string>;
  contact: { name: string; phone: string };
  estimate: Estimate;
  visit: { slot: string; fee: number; expert: Pro; done: boolean };
  quote?: { total: number; advance: number; findings: string[]; issuedAt: string; accepted: boolean };
  milestones: Milestone[];
  paid: number;
  initialTotal?: number;     // estimate total at booking, kept when the expert's measurements re-price it
  cancelReason?: string;
  photos?: Photo[];
  changes?: ChangeOrder[];   // scope changes agreed in writing; approved ones become milestones and raise the quote
  timeline: { at: string; text: string }[];
}

// ── Store: JSON file (see kv.ts). Swap this section for Supabase without touching callers. ──
const tx = <T,>(fn: (all: Project[]) => Promise<T> | T) => withJson<Project[], T>('db', () => [], fn);

// Ownership is enforced here so no caller can forget it. A project you don't own looks exactly like one that doesn't exist.
export async function listProjects(owner: string) {
  return (await readJson<Project[]>('db', [])).filter((p) => p.owner === owner).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getProject(id: string, owner: string) {
  return (await readJson<Project[]>('db', [])).find((p) => p.id === id && p.owner === owner) ?? null;
}

// ── Commands ─────────────────────────────────────────────────────────
export interface CreateInput {
  typeId: string; city: string; area: number; tier: Tier; drainFt?: number; notes?: string; style?: string; propertyValueLakh?: number; rooms?: string[]; finishes?: Record<string, string>;
  name: string; phone: string; slot: string;
}
export class ValidationError extends Error {}
export class NotFoundError extends Error {}

export function validateCreate(i: Partial<CreateInput>): CreateInput {
  const type = i.typeId && getType(i.typeId);
  if (!type) throw new ValidationError('Unknown project type');
  const city = getCity(i.city);
  if (!city) throw new ValidationError('Choose a city');
  if (city.status !== 'live') throw new ValidationError(`We are not live in ${city.name} yet — join the waitlist and we will tell you first`);
  if (!i.name?.trim()) throw new ValidationError('Name is required');
  const sitePhone = normalizePhone(i.phone);
  if (!sitePhone) throw new ValidationError('Enter a valid 10-digit Indian mobile number');
  if (!i.slot || Number.isNaN(Date.parse(i.slot))) throw new ValidationError('Pick a visit slot');
  if (!i.tier || !['economy', 'standard', 'premium'].includes(i.tier)) throw new ValidationError('Invalid quality tier');
  const area = Number(i.area);
  if (!(area >= 5 && area <= 20000)) throw new ValidationError('Area looks wrong');
  let style: string | undefined;
  if (type.interiors) {
    if (!i.style || !(STYLES as readonly string[]).includes(i.style)) throw new ValidationError('Pick a design style');
    style = i.style;
  }
  let rooms: string[] | undefined, finishes: Record<string, string> | undefined;
  if (type.rooms) {
    if (Array.isArray(i.rooms)) {
      rooms = [...new Set(i.rooms)] as string[];
      if (rooms.length === 0) throw new ValidationError('Pick at least one room');
      if (rooms.some((r) => !type.rooms!.some((d) => d.id === r))) throw new ValidationError('Unknown room selected');
    }
  }
  if (type.finishes && i.finishes && typeof i.finishes === 'object') {
    finishes = {};
    for (const f of type.finishes) {
      const v = (i.finishes as Record<string, unknown>)[f.id];
      if (v === undefined) continue;
      if (typeof v !== 'string' || !f.options.some((o) => o.id === v)) throw new ValidationError(`Unknown ${f.label.toLowerCase()} option`);
      finishes[f.id] = v;
    }
  }
  const pv = i.propertyValueLakh == null || (i.propertyValueLakh as unknown) === '' ? undefined : Number(i.propertyValueLakh);
  if (pv !== undefined && !(pv >= 1 && pv <= 1_000_000)) throw new ValidationError('Property value looks wrong');
  return { ...(i as CreateInput), style, rooms, finishes, propertyValueLakh: pv, notes: i.notes?.slice(0, 500), city: city.id, phone: sitePhone, area, drainFt: i.drainFt == null ? undefined : Math.max(0, Number(i.drainFt)) };
}

const now = () => new Date().toISOString();
const newId = () => 'HSY-' + Math.random().toString(36).slice(2, 8).toUpperCase();

export function createProject(input: CreateInput, owner: string) {
  return tx((all) => {
    const type = getType(input.typeId)!;
    const est = estimate({ typeId: input.typeId, city: input.city, area: input.area, tier: input.tier, drainFt: input.drainFt, rooms: input.rooms, finishes: input.finishes });
    const p: Project = {
      id: newId(), owner, createdAt: now(), status: 'visit_scheduled',
      typeId: input.typeId, city: input.city, area: input.area, tier: input.tier, drainFt: input.drainFt, notes: input.notes, style: input.style, propertyValueLakh: input.propertyValueLakh, rooms: input.rooms, finishes: input.finishes,
      contact: { name: input.name.trim(), phone: input.phone.trim() },
      estimate: est,
      visit: { slot: input.slot, fee: type.visitFee, expert: visitExpert(input.city, type.expert ?? (type.needsEngineer ? 'engineer' : 'mason')), done: false },
      milestones: [], paid: 0,
      timeline: [{ at: now(), text: `${type.visitLabel} booked for ${new Date(input.slot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` }],
    };
    all.push(p);
    return p;
  });
}

const ADVANCE_PCT = 0.2;

export type Action =
  | { action: 'complete_visit'; measuredArea?: number; measuredDrainFt?: number; note?: string }
  | { action: 'reschedule'; slot: string }
  | { action: 'cancel'; reason?: string }
  | { action: 'accept_quote' }
  | { action: 'start' | 'approve'; milestoneId: string }
  | { action: 'submit'; milestoneId: string; note?: string }
  | { action: 'request_changes'; milestoneId: string; feedback: string }
  | { action: 'request_change'; title: string; description: string; trade: string }
  | { action: 'price_change'; changeId: string; amount: number; days?: number }
  | { action: 'approve_change'; changeId: string }
  | { action: 'decline_change'; changeId: string };

export class ConflictError extends Error {}

const pendingChanges = (p: Project) => (p.changes ?? []).filter((c) => c.status === 'requested' || c.status === 'quoted');
// A project is complete only when every milestone is paid and no scope change is still waiting for a decision.
function completeIfDone(p: Project, log: (t: string) => void) {
  if (p.status === 'active' && p.milestones.length > 0 && p.milestones.every((x) => x.status === 'paid') && pendingChanges(p).length === 0) {
    p.status = 'completed'; log('Project completed 🎉');
  }
}

export function act(id: string, a: Action, owner: string) {
  return tx((all) => {
    const p = all.find((x) => x.id === id && x.owner === owner);
    if (!p) throw new NotFoundError('Project not found');
    const log = (text: string) => p.timeline.unshift({ at: now(), text });

    if (a.action === 'complete_visit') {
      if (p.status !== 'visit_scheduled') throw new ConflictError('Visit already completed');
      const type = getType(p.typeId)!;
      const num = (v: unknown, min: number, max: number, label: string) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = Number(v);
        if (!(n >= min && n <= max)) throw new ValidationError(`${label} looks wrong`);
        return n;
      };
      const area = num(a.measuredArea, 5, 20000, 'Measured area') ?? p.area;
      const drain = type.askDrain ? (num(a.measuredDrainFt, 0, 500, 'Measured drain distance') ?? p.drainFt) : p.drainFt;
      const before = p.estimate.total;
      const changed = area !== p.area || drain !== p.drainFt;
      const findings: string[] = [];
      if (changed) {
        // The expert's measurements replace the owner's guess, and the price follows.
        p.initialTotal = before;
        const pct = Math.round(((area - p.area) / p.area) * 100);
        if (area !== p.area) findings.push(`Measured ${area} sq ft on site (you estimated ${p.area}${pct ? `, ${pct > 0 ? '+' : ''}${pct}%` : ''}).`);
        if (drain !== p.drainFt) findings.push(`Measured drain/septic distance: ${drain} ft (you estimated ${p.drainFt ?? 'unknown'}).`);
        p.area = area; p.drainFt = drain;
        p.estimate = estimate({ typeId: p.typeId, city: p.city, area, tier: p.tier, drainFt: drain, rooms: p.rooms, finishes: p.finishes });
      } else {
        findings.push(`Measured on site: ${p.area} sq ft — matches your estimate.`);
      }
      findings.push(...p.estimate.flags.filter((f) => f.level !== 'green').map((f) => f.text));
      const note = typeof a.note === 'string' ? a.note.trim().slice(0, 500) : '';
      if (note) findings.push(`Expert note: ${note}`);
      findings.push('Fixed price: only changes if you change the scope in writing.');
      const total = Math.round(p.estimate.total / 500) * 500;
      p.visit.done = true;
      p.status = 'quote_ready';
      p.quote = { total, advance: Math.round((total * ADVANCE_PCT) / 100) * 100, findings, issuedAt: now(), accepted: false };
      log(`${p.visit.expert.name} completed the ${type.visitLabel.toLowerCase()} and issued a fixed quote of ₹${total.toLocaleString('en-IN')}${changed ? ` (estimate at booking: ₹${(Math.round(before / 500) * 500).toLocaleString('en-IN')})` : ''}`);
    } else if (a.action === 'reschedule') {
      if (p.status !== 'visit_scheduled') throw new ConflictError('The visit has already happened');
      const t = Date.parse(a.slot);
      if (Number.isNaN(t) || t < Date.now()) throw new ValidationError('Pick a future time slot');
      p.visit.slot = new Date(t).toISOString();
      log(`Visit rescheduled to ${new Date(t).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`);
    } else if (a.action === 'cancel') {
      if (p.status !== 'visit_scheduled' && p.status !== 'quote_ready') throw new ConflictError('Work has already started — contact Housy support to cancel');
      p.status = 'cancelled';
      p.cancelReason = typeof a.reason === 'string' ? a.reason.trim().slice(0, 300) || undefined : undefined;
      log(p.quote ? 'You declined the quote and cancelled the project' : 'You cancelled the project');
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
        return { id: `${p.id}-M${i + 1}`, phaseId: ph.id, name: ph.name, days: ph.days, amount: amt, status: 'upcoming' as const, pro: proForTrade(p.city, ph.trade) };
      });
      q.accepted = true; p.status = 'active'; p.paid = q.advance;
      log(`Quote accepted — advance of ₹${q.advance.toLocaleString('en-IN')} paid`);
    } else if (a.action === 'request_change') {
      if (p.status !== 'active') throw new ConflictError('Scope changes can be requested while work is in progress');
      const title = String(a.title ?? '').trim(), description = String(a.description ?? '').trim();
      if (title.length < 3 || title.length > 80) throw new ValidationError('Give the change a short title (3–80 characters)');
      if (description.length < 10) throw new ValidationError('Describe the change in at least 10 characters');
      if (!(CHANGE_TRADES as readonly string[]).includes(a.trade)) throw new ValidationError('Choose who should do the extra work');
      if (pendingChanges(p).length >= MAX_PENDING_CHANGES) throw new ConflictError(`Please decide on your ${MAX_PENDING_CHANGES} pending changes first`);
      proForTrade(p.city, a.trade as Trade);   // fail early if this city has nobody for the trade
      (p.changes ??= []).push({ id: `${p.id}-C${p.changes.length + 1}`, title, description: description.slice(0, 500), trade: a.trade as Trade, status: 'requested', createdAt: now(), updatedAt: now() });
      log(`You requested a change: ${title}`);
    } else if (a.action === 'price_change') {
      const c = p.changes?.find((x) => x.id === a.changeId);
      if (!c) throw new ValidationError('Change not found');
      if (c.status !== 'requested') throw new ConflictError('This change has already been priced');
      const amount = Number(a.amount), days = a.days === undefined ? 1 : Number(a.days);
      if (!(amount >= 500 && amount <= (p.quote?.total ?? 0))) throw new ValidationError('Price looks wrong');
      if (!(days >= 0 && days <= 90)) throw new ValidationError('Days looks wrong');
      c.amount = Math.round(amount / 50) * 50; c.days = Math.round(days); c.status = 'quoted'; c.updatedAt = now();
      log(`${proForTrade(p.city, c.trade).name} priced "${c.title}" at ₹${c.amount.toLocaleString('en-IN')}`);
    } else if (a.action === 'approve_change' || a.action === 'decline_change') {
      if (p.status !== 'active') throw new ConflictError('Project is not active');
      const c = p.changes?.find((x) => x.id === a.changeId);
      if (!c) throw new ValidationError('Change not found');
      if (a.action === 'approve_change') {
        if (c.status !== 'quoted') throw new ConflictError('There is no price to approve yet');
        p.milestones.push({ id: `${p.id}-M${p.milestones.length + 1}`, phaseId: `change-${c.id}`, name: `Change: ${c.title}`, days: c.days ?? 1, amount: c.amount!, status: 'upcoming', pro: proForTrade(p.city, c.trade) });
        p.quote!.total += c.amount!;
        c.status = 'approved'; log(`You approved the change "${c.title}" (+₹${c.amount!.toLocaleString('en-IN')}) — new total ₹${p.quote!.total.toLocaleString('en-IN')}`);
      } else {
        if (c.status !== 'requested' && c.status !== 'quoted') throw new ConflictError('This change is already decided');
        c.status = 'declined'; log(`You declined the change "${c.title}"`);
        completeIfDone(p, log);   // it may have been the last thing holding the project open
      }
      c.updatedAt = now();
    } else {
      if (p.status !== 'active') throw new ConflictError('Project is not active');
      const milestoneId = a.milestoneId;   // read before the callback: TS drops the narrowing inside closures
      const idx = p.milestones.findIndex((m) => m.id === milestoneId);
      if (idx < 0) throw new ValidationError('Milestone not found');
      const m = p.milestones[idx];
      if (a.action === 'start') {
        if (m.status !== 'upcoming') throw new ConflictError('Milestone already started');
        if (p.milestones.slice(0, idx).some((x) => x.status !== 'paid')) throw new ConflictError('Finish and approve earlier milestones first');
        m.status = 'in_progress'; log(`${m.pro.name} started: ${m.name}`);
      } else if (a.action === 'submit') {
        if (m.status !== 'in_progress') throw new ConflictError('Milestone is not in progress');
        // An owner who can't visit the site is asked to pay on the strength of this evidence, so it is mandatory.
        // After a change request, the old photos don't count: the fix needs fresh evidence.
        if (!(p.photos ?? []).some((ph) => ph.milestoneId === m.id && (!m.feedbackAt || ph.at > m.feedbackAt))) {
          throw new ConflictError(m.feedbackAt ? 'Add a new photo showing the requested changes' : 'Add at least one site photo as proof of work');
        }
        const note = 'note' in a && typeof a.note === 'string' ? a.note.trim().slice(0, 500) : '';
        m.crewNote = note || undefined;
        m.status = 'in_review'; log(`${m.pro.name} submitted for your review: ${m.name}`);
      } else if (a.action === 'request_changes') {
        if (m.status !== 'in_review') throw new ConflictError('There is nothing to review yet');
        const feedback = String(a.feedback ?? '').trim().slice(0, 500);
        if (feedback.length < 5) throw new ValidationError('Tell the crew what needs to change');
        if ((m.revisions ?? 0) >= MAX_REVISIONS) throw new ConflictError('Maximum revisions reached — contact Housy support to resolve this');
        m.revisions = (m.revisions ?? 0) + 1;
        m.feedback = feedback; m.feedbackAt = now(); m.status = 'in_progress'; m.crewNote = undefined;
        log(`You asked ${m.pro.name} for changes to "${m.name}" (round ${m.revisions} of ${MAX_REVISIONS}): ${feedback}`);
      } else {
        if (m.status !== 'in_review') throw new ConflictError('Nothing to approve yet');
        m.status = 'paid'; p.paid += m.amount; log(`You approved "${m.name}" — ₹${m.amount.toLocaleString('en-IN')} released`);
        completeIfDone(p, log);
      }
      m.updatedAt = now();
    }
    return p;
  });
}

// Attach a proof-of-work photo to an in-progress milestone. File and metadata are written together under the store lock.
export function addPhoto(id: string, owner: string, milestoneId: string, buf: Buffer, ext: ImageExt, caption?: string) {
  return tx(async (all) => {
    const p = all.find((x) => x.id === id && x.owner === owner);
    if (!p) throw new NotFoundError('Project not found');
    if (p.status !== 'active') throw new ConflictError('Project is not active');
    const m = p.milestones.find((x) => x.id === milestoneId);
    if (!m) throw new ValidationError('Milestone not found');
    if (m.status !== 'in_progress') throw new ConflictError('Photos can only be added while the work is in progress');
    p.photos ??= [];
    if (p.photos.filter((x) => x.milestoneId === m.id).length >= MAX_PHOTOS_PER_MILESTONE) throw new ConflictError(`At most ${MAX_PHOTOS_PER_MILESTONE} photos per milestone`);
    const photo: Photo = { id: await saveImage(p.id, buf, ext), milestoneId: m.id, ext, caption: caption?.trim().slice(0, 120) || undefined, at: now() };
    p.photos.push(photo);
    p.timeline.unshift({ at: photo.at, text: `${m.pro.name} added a photo to "${m.name}"` });
    return photo;
  });
}
