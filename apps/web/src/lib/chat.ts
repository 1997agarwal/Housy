import { randomUUID } from 'crypto';
import { readJson, withJson } from './kv';
import { getProject, listProjects, ConflictError, NotFoundError, ValidationError } from './projects';
import { reviewablePros } from './reviews';
import { rateLimit } from './ratelimit';
import { toNum } from './num';
import { saveAudio, readAudio, type AudioExt as StoredExt } from './uploads';
import { MAX_CHAT_TEXT, MAX_MESSAGES_PER_PROJECT, MAX_VOICE_SECONDS, type ChatMessage, type ChatThread } from './chat-shared';
import type { Pro } from './pros';

// One store for all chat: messages per project + the owner's "read up to" cursor per thread.
interface ChatStore { messages: Record<string, ChatMessage[]>; reads: Record<string, string> }
const fresh = (): ChatStore => ({ messages: {}, reads: {} });
const cursor = (projectId: string, proId: string) => `${projectId}:${proId}`;
const newId = () => 'MSG' + randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
export class RateLimitedError extends Error {}
const preview = (m: ChatMessage) => (m.kind === 'voice' ? `🎤 Voice note (${m.audio?.seconds ?? 0}s)` : (m.text ?? '').slice(0, 60));

// Who can be talked to on a project: the first-visit expert, plus every crew assigned once a quote is accepted.
async function context(projectId: string, owner: string) {
  const p = await getProject(projectId, owner);
  if (!p) throw new NotFoundError('Project not found');       // not yours == doesn't exist
  return { project: p, pros: reviewablePros(p) };
}
function needPro(pros: Pro[], proId: unknown): Pro {
  const pro = pros.find((x) => x.id === proId);
  if (!pro) throw new ValidationError('That person is not on this project');
  return pro;
}

export async function listThreads(projectId: string, owner: string): Promise<ChatThread[]> {
  const { pros } = await context(projectId, owner);
  const store = await readJson<ChatStore>('chat', fresh());
  const msgs = store.messages[projectId] ?? [];
  return pros.map((pro) => {
    const mine = msgs.filter((m) => m.proId === pro.id);
    const seen = store.reads[cursor(projectId, pro.id)] ?? '';
    const last = mine[mine.length - 1];
    return {
      proId: pro.id, name: pro.name, role: pro.role, trade: pro.trade,
      unread: mine.filter((m) => m.from === 'pro' && m.at > seen).length,
      last: last ? { at: last.at, from: last.from, preview: preview(last) } : undefined,
    };
  }).sort((a, b) => (b.last?.at ?? '').localeCompare(a.last?.at ?? '') || a.name.localeCompare(b.name));
}

export async function getMessages(projectId: string, owner: string, proId: string, since?: string): Promise<ChatMessage[]> {
  const { pros } = await context(projectId, owner);
  needPro(pros, proId);
  const all = (await readJson<ChatStore>('chat', fresh())).messages[projectId] ?? [];
  return all.filter((m) => m.proId === proId && (!since || m.at > since));
}

async function append(projectId: string, msg: Omit<ChatMessage, 'id' | 'at'>): Promise<ChatMessage> {
  return withJson<ChatStore, ChatMessage>('chat', fresh, (store) => {
    const list = (store.messages[projectId] ??= []);
    if (list.length >= MAX_MESSAGES_PER_PROJECT) throw new ConflictError('This conversation has reached its message limit — contact Housy support');
    // Strictly increasing timestamps so "since" polling and read cursors never miss or repeat a message sent in the same millisecond.
    const last = list[list.length - 1]?.at;
    let at = new Date().toISOString();
    if (last && at <= last) at = new Date(Date.parse(last) + 1).toISOString();
    const m: ChatMessage = { id: newId(), at, ...msg };
    list.push(m);
    return m;
  });
}

async function assertCanSend(projectId: string, owner: string, proId: unknown) {
  const { project, pros } = await context(projectId, owner);
  if (project.status === 'cancelled') throw new ConflictError('This project was cancelled');
  needPro(pros, proId);
}
const cleanText = (raw: unknown) => {
  const t = typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').trim() : '';
  if (t.length < 1) throw new ValidationError('Write a message first');
  if (t.length > MAX_CHAT_TEXT) throw new ValidationError(`Messages can be up to ${MAX_CHAT_TEXT} characters`);
  return t;
};
// Sending is throttled per owner so a script can't flood the store (one file is rewritten per message).
async function throttle(owner: string) {
  const wait = await rateLimit([[`chat:${owner}`, 30]], 60_000);
  if (wait) throw new RateLimitedError(`You are sending messages too fast — try again in ${wait}s`);
}

export async function sendText(projectId: string, owner: string, proId: string, text: unknown): Promise<ChatMessage> {
  await assertCanSend(projectId, owner, proId);
  const t = cleanText(text);
  await throttle(owner);
  return append(projectId, { proId, from: 'owner', kind: 'text', text: t });
}

export async function sendVoice(projectId: string, owner: string, proId: string, buf: Buffer, ext: StoredExt, secondsRaw: unknown): Promise<ChatMessage> {
  await assertCanSend(projectId, owner, proId);
  const seconds = Math.round(toNum(secondsRaw));
  if (!(seconds >= 1 && seconds <= MAX_VOICE_SECONDS)) throw new ValidationError(`Voice notes can be 1–${MAX_VOICE_SECONDS} seconds`);
  await throttle(owner);
  const id = await saveAudio(projectId, buf, ext);
  return append(projectId, { proId, from: 'owner', kind: 'voice', audio: { id, ext, seconds } });
}

// DEMO: stands in for the crew's side (production: their replies arrive over WhatsApp / a crew app, authenticated separately).
export async function crewReply(projectId: string, owner: string, proId: string, text: unknown): Promise<ChatMessage> {
  await assertCanSend(projectId, owner, proId);
  return append(projectId, { proId, from: 'pro', kind: 'text', text: cleanText(text) });
}

export async function markRead(projectId: string, owner: string, proId: string): Promise<void> {
  const { pros } = await context(projectId, owner);
  needPro(pros, proId);
  await withJson<ChatStore, void>('chat', fresh, (store) => {
    const last = (store.messages[projectId] ?? []).filter((m) => m.proId === proId).at(-1)?.at;
    if (last) store.reads[cursor(projectId, proId)] = last;
  });
}

// Unread crew messages per project, for badges on the projects list.
export async function unreadCounts(owner: string): Promise<Record<string, number>> {
  const store = await readJson<ChatStore>('chat', fresh());
  const out: Record<string, number> = {};
  for (const p of await listProjects(owner)) {
    let n = 0;
    for (const m of store.messages[p.id] ?? []) if (m.from === 'pro' && m.at > (store.reads[cursor(p.id, m.proId)] ?? '')) n++;
    if (n) out[p.id] = n;
  }
  return out;
}

export async function voiceFile(projectId: string, owner: string, messageId: string): Promise<{ buf: Buffer; ext: StoredExt } | null> {
  await context(projectId, owner);
  const m = ((await readJson<ChatStore>('chat', fresh())).messages[projectId] ?? []).find((x) => x.id === messageId && x.kind === 'voice');
  if (!m?.audio) return null;
  const buf = await readAudio(projectId, m.audio.id, m.audio.ext);
  return buf ? { buf, ext: m.audio.ext } : null;
}
