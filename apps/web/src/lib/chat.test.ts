import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createProject, validateCreate, ConflictError, NotFoundError, ValidationError } from './projects';
import { crewReply, getMessages, listThreads, markRead, sendText, sendVoice, unreadCounts, voiceFile, RateLimitedError } from './chat';
import { decodeAudioDataUrl, sniffAudio, MAX_AUDIO_BYTES } from './uploads';
import { reviewablePros } from './reviews';
import { MAX_CHAT_TEXT, MAX_MESSAGES_PER_PROJECT } from './chat-shared';
import { useTempStore } from '../test/helpers';

const OWNER = '9876543210', OTHER = '9123456789';
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64, 7)]);
const OGG = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(64)]);
const M4A = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypM4A '), Buffer.alloc(64)]);
const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64)]);
const WAV = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(64)]);
const dataUrl = (mime: string, b: Buffer) => `data:${mime};base64,${b.toString('base64')}`;

async function project(accepted = false, owner = OWNER) {
  const p = await createProject(validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: new Date(Date.now() + 864e5).toISOString() } as never), owner);
  if (!accepted) return p;
  await act(p.id, { action: 'complete_visit' }, owner);
  return act(p.id, { action: 'accept_quote' }, owner);
}

describe('voice recording validation', () => {
  it('identifies audio by magic bytes, whatever the claimed type', () => {
    expect(sniffAudio(WEBM)).toBe('webm'); expect(sniffAudio(OGG)).toBe('ogg'); expect(sniffAudio(M4A)).toBe('m4a');
    expect(sniffAudio(MP3)).toBe('mp3'); expect(sniffAudio(WAV)).toBe('wav');
    expect(sniffAudio(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(sniffAudio(Buffer.alloc(8))).toBeNull();
    expect(sniffAudio(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();   // a PNG is not audio
  });
  it('accepts what browsers produce, including codec parameters', () => {
    expect(decodeAudioDataUrl(dataUrl('audio/webm;codecs=opus', WEBM)).ext).toBe('webm');
    expect(decodeAudioDataUrl(dataUrl('audio/ogg;codecs=opus', OGG)).ext).toBe('ogg');
    expect(decodeAudioDataUrl(dataUrl('audio/mp4', M4A)).ext).toBe('m4a');
  });
  it('rejects non-audio, mislabelled files, junk and oversize', () => {
    expect(() => decodeAudioDataUrl(dataUrl('audio/webm', Buffer.from('<html>not audio at all, really</html>')))).toThrow(/valid voice/);
    expect(() => decodeAudioDataUrl(dataUrl('image/png', WEBM))).toThrow(/not a voice/);
    expect(() => decodeAudioDataUrl(dataUrl('text/html', WEBM))).toThrow();
    for (const bad of [undefined, null, 5, {}, 'audio/webm', 'data:audio/webm;base64,***']) expect(() => decodeAudioDataUrl(bad)).toThrow();
    expect(() => decodeAudioDataUrl(dataUrl('audio/webm', Buffer.concat([WEBM, Buffer.alloc(MAX_AUDIO_BYTES)])))).toThrow(/too long/);
  });
});

describe('chat', () => {
  useTempStore();
  afterEach(() => vi.useRealTimers());

  it('threads: the visit expert before acceptance; expert + assigned crews after', async () => {
    const p = await project(false);
    expect((await listThreads(p.id, OWNER)).map((t) => t.proId)).toEqual([p.visit.expert.id]);
    const a = await project(true);
    const want = reviewablePros(a).map((x) => x.id).sort();
    expect((await listThreads(a.id, OWNER)).map((t) => t.proId).sort()).toEqual(want);
    expect(want.length).toBeGreaterThan(3);
  });

  it('sends and reads text; trims; validates length', async () => {
    const p = await project();
    const pro = p.visit.expert.id;
    const m = await sendText(p.id, OWNER, pro, '  Namaste, kal kitne baje aayenge?  ');
    expect(m).toMatchObject({ from: 'owner', kind: 'text', text: 'Namaste, kal kitne baje aayenge?', proId: pro });
    for (const bad of ['', '   ', undefined, null, 5, {}]) await expect(sendText(p.id, OWNER, pro, bad as never), String(bad)).rejects.toThrow(ValidationError);
    await expect(sendText(p.id, OWNER, pro, 'x'.repeat(MAX_CHAT_TEXT + 1))).rejects.toThrow(/up to 1000/);
    await expect(sendText(p.id, OWNER, pro, 'x'.repeat(MAX_CHAT_TEXT))).resolves.toBeTruthy();
    expect(await getMessages(p.id, OWNER, pro)).toHaveLength(2);
  });

  it('can only talk to people on the project, and only in your own projects', async () => {
    const p = await project(true);
    const pro = p.visit.expert.id;
    await expect(sendText(p.id, OWNER, 'bly-999', 'hi')).rejects.toThrow(/not on this project/);
    await expect(sendText(p.id, OWNER, '__proto__', 'hi')).rejects.toThrow(ValidationError);
    await expect(sendText(p.id, OTHER, pro, 'hi')).rejects.toThrow(NotFoundError);
    await expect(getMessages(p.id, OTHER, pro)).rejects.toThrow(NotFoundError);
    await expect(listThreads(p.id, OTHER)).rejects.toThrow(NotFoundError);
    await expect(markRead(p.id, OTHER, pro)).rejects.toThrow(NotFoundError);
    await expect(crewReply(p.id, OTHER, pro, 'hi')).rejects.toThrow(NotFoundError);
    await expect(sendText('HSY-NOPE00', OWNER, pro, 'hi')).rejects.toThrow(NotFoundError);
  });

  it('threads are separate conversations', async () => {
    const p = await project(true);
    const [a, b] = reviewablePros(p);
    await sendText(p.id, OWNER, a.id, 'to A'); await sendText(p.id, OWNER, b.id, 'to B');
    expect((await getMessages(p.id, OWNER, a.id)).map((m) => m.text)).toEqual(['to A']);
    expect((await getMessages(p.id, OWNER, b.id)).map((m) => m.text)).toEqual(['to B']);
  });

  it('unread counts follow the read cursor; only crew messages count', async () => {
    const p = await project(true);
    const [a, b] = reviewablePros(p);
    await sendText(p.id, OWNER, a.id, 'my own message');
    expect((await listThreads(p.id, OWNER)).every((t) => t.unread === 0)).toBe(true);        // my own messages are never "unread"
    await crewReply(p.id, OWNER, a.id, 'One'); await crewReply(p.id, OWNER, a.id, 'Two'); await crewReply(p.id, OWNER, b.id, 'Hello');
    const t = await listThreads(p.id, OWNER);
    expect(t.find((x) => x.proId === a.id)!.unread).toBe(2);
    expect(t.find((x) => x.proId === b.id)!.unread).toBe(1);
    expect(t[0].last?.from).toBe('pro');                                                       // most recent conversation first
    expect(await unreadCounts(OWNER)).toEqual({ [p.id]: 3 });
    await markRead(p.id, OWNER, a.id);
    expect((await listThreads(p.id, OWNER)).find((x) => x.proId === a.id)!.unread).toBe(0);
    expect(await unreadCounts(OWNER)).toEqual({ [p.id]: 1 });
    await crewReply(p.id, OWNER, a.id, 'Three');                                               // new message after reading → unread again
    expect(await unreadCounts(OWNER)).toEqual({ [p.id]: 2 });
    await markRead(p.id, OWNER, a.id); await markRead(p.id, OWNER, b.id);
    expect(await unreadCounts(OWNER)).toEqual({});
    expect(await unreadCounts(OTHER)).toEqual({});
  });

  it('messages sent in the same millisecond keep a strict order and are never missed by ?since= polling', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    const p = await project();
    const pro = p.visit.expert.id;
    const sent = [];
    for (let i = 0; i < 5; i++) sent.push(await crewReply(p.id, OWNER, pro, `m${i}`));         // clock frozen: identical wall time
    expect(new Set(sent.map((m) => m.at)).size).toBe(5);
    expect([...sent.map((m) => m.at)].sort()).toEqual(sent.map((m) => m.at));
    const all = await getMessages(p.id, OWNER, pro);
    expect(all.map((m) => m.text)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4']);
    expect((await getMessages(p.id, OWNER, pro, all[1].at)).map((m) => m.text)).toEqual(['m2', 'm3', 'm4']);   // exactly the newer ones
    expect(await getMessages(p.id, OWNER, pro, all[4].at)).toEqual([]);
  });

  it('voice notes: stored privately, playable by the owner only, with sane duration', async () => {
    const p = await project();
    const pro = p.visit.expert.id;
    const m = await sendVoice(p.id, OWNER, pro, WEBM, 'webm', 12.4);
    expect(m).toMatchObject({ kind: 'voice', from: 'owner', audio: { ext: 'webm', seconds: 12 } });
    expect(m.text).toBeUndefined();
    const f = await voiceFile(p.id, OWNER, m.id);
    expect(f!.buf.equals(WEBM)).toBe(true);
    await expect(voiceFile(p.id, OTHER, m.id)).rejects.toThrow(NotFoundError);
    expect(await voiceFile(p.id, OWNER, 'MSGNOPE')).toBeNull();
    for (const s of [0, 0.4, 61, 999, -3, NaN, 'abc', null, [5]]) await expect(sendVoice(p.id, OWNER, pro, WEBM, 'webm', s), String(s)).rejects.toThrow(ValidationError);
    await expect(sendVoice(p.id, OTHER, pro, WEBM, 'webm', 5)).rejects.toThrow(NotFoundError);
    expect((await listThreads(p.id, OWNER))[0].last?.preview).toMatch(/Voice note \(12s\)/);
  });

  it('a text message id is never served as audio', async () => {
    const p = await project();
    const m = await sendText(p.id, OWNER, p.visit.expert.id, 'hello');
    expect(await voiceFile(p.id, OWNER, m.id)).toBeNull();
  });

  it('no new messages after cancellation, but history stays readable', async () => {
    const p = await project();
    const pro = p.visit.expert.id;
    await sendText(p.id, OWNER, pro, 'before');
    await act(p.id, { action: 'cancel' }, OWNER);
    await expect(sendText(p.id, OWNER, pro, 'after')).rejects.toThrow(ConflictError);
    await expect(sendVoice(p.id, OWNER, pro, WEBM, 'webm', 3)).rejects.toThrow(ConflictError);
    await expect(crewReply(p.id, OWNER, pro, 'after')).rejects.toThrow(ConflictError);
    expect((await getMessages(p.id, OWNER, pro)).map((m) => m.text)).toEqual(['before']);
  });

  it('throttles floods (30 messages per minute per owner)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    const p = await project();
    const pro = p.visit.expert.id;
    for (let i = 0; i < 30; i++) await sendText(p.id, OWNER, pro, `spam ${i}`);
    await expect(sendText(p.id, OWNER, pro, 'one too many')).rejects.toThrow(RateLimitedError);
    vi.setSystemTime(new Date('2026-10-01T10:01:05Z'));
    await expect(sendText(p.id, OWNER, pro, 'later')).resolves.toBeTruthy();
  }, 30000);

  it('caps a conversation store per project', async () => {
    const p = await project();
    const pro = p.visit.expert.id;
    for (let i = 0; i < MAX_MESSAGES_PER_PROJECT; i++) await crewReply(p.id, OWNER, pro, `n${i}`);
    await expect(crewReply(p.id, OWNER, pro, 'overflow')).rejects.toThrow(/message limit/);
  }, 60000);
});
