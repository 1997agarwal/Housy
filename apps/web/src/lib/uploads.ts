import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Local-disk image storage under .data/uploads. Swap for Supabase Storage without touching callers.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export type ImageExt = 'jpg' | 'png' | 'webp';
export const MIME: Record<ImageExt, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Identify by magic bytes, never by the client's claimed type or filename.
export function sniffImage(b: Buffer): ImageExt | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

const SAFE = /^[A-Za-z0-9-]+$/;
const dir = (projectId: string) => {
  if (!SAFE.test(projectId)) throw new Error('bad project id');
  return path.join(process.cwd(), '.data', 'uploads', projectId);
};

export async function saveImage(projectId: string, buf: Buffer, ext: ImageExt): Promise<string> {
  const id = randomUUID();
  await fs.mkdir(dir(projectId), { recursive: true });
  await fs.writeFile(path.join(dir(projectId), `${id}.${ext}`), buf);
  return id;
}

export async function readImage(projectId: string, id: string, ext: ImageExt): Promise<Buffer | null> {
  if (!SAFE.test(id) || !(ext in MIME)) return null;
  try { return await fs.readFile(path.join(dir(projectId), `${id}.${ext}`)); } catch { return null; }
}

// Accepts a data URL ("data:image/jpeg;base64,...") and returns the validated bytes.
export function decodeDataUrl(dataUrl: unknown): { buf: Buffer; ext: ImageExt } {
  if (typeof dataUrl !== 'string') throw new Error('No image provided');
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error('Upload a JPEG, PNG or WebP image');
  if (m[1].length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) throw new Error('Image is too large (max 2 MB)');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('Image is too large (max 2 MB)');
  const ext = sniffImage(buf);
  if (!ext) throw new Error('That file is not a valid image');
  return { buf, ext };
}

// ── Voice notes (chat) ───────────────────────────────────────────────
export const MAX_AUDIO_BYTES = 1_500_000;                       // ~60 s of speech at browser recorder bitrates, with headroom
export type AudioExt = 'webm' | 'ogg' | 'm4a' | 'mp3' | 'wav';
export const AUDIO_MIME: Record<AudioExt, string> = { webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav' };

// By magic bytes only: what MediaRecorder produces (WebM/Ogg on Chrome & Firefox, MP4 on Safari) plus common uploads.
export function sniffAudio(b: Buffer): AudioExt | null {
  if (b.length < 16) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (b.subarray(0, 4).toString('latin1') === 'OggS') return 'ogg';
  if (b.subarray(4, 8).toString('latin1') === 'ftyp') return 'm4a';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WAVE') return 'wav';
  if (b.subarray(0, 3).toString('latin1') === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  return null;
}

export function decodeAudioDataUrl(dataUrl: unknown): { buf: Buffer; ext: AudioExt } {
  if (typeof dataUrl !== 'string') throw new Error('No voice note provided');
  const m = /^data:audio\/[a-z0-9.+-]+(?:;[^;,]*)*;base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
  if (!m) throw new Error('That is not a voice recording');
  if (m[1].length > Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 4) throw new Error('Voice note is too long');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > MAX_AUDIO_BYTES) throw new Error('Voice note is too long');
  const ext = sniffAudio(buf);
  if (!ext) throw new Error('That file is not a valid voice recording');
  return { buf, ext };
}

export async function saveAudio(projectId: string, buf: Buffer, ext: AudioExt): Promise<string> {
  const id = randomUUID();
  await fs.mkdir(dir(projectId), { recursive: true });
  await fs.writeFile(path.join(dir(projectId), `chat-${id}.${ext}`), buf);
  return id;
}

export async function readAudio(projectId: string, id: string, ext: AudioExt): Promise<Buffer | null> {
  if (!SAFE.test(id) || !(ext in AUDIO_MIME)) return null;
  try { return await fs.readFile(path.join(dir(projectId), `chat-${id}.${ext}`)); } catch { return null; }
}
