import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { withJson } from './kv';
import { normalizePhone } from './phone';
import { deliverOtp, type Delivery } from './sms';

export interface Session { phone: string; name: string }
export class AuthError extends Error { constructor(msg: string, public status = 400) { super(msg); } }

const COOKIE = 'housy_session';
const SESSION_DAYS = 30;
const OTP_TTL_MS = 5 * 60_000, RESEND_MS = 30_000, MAX_ATTEMPTS = 5;
// Hourly caps on OTP requests. They stop the endpoint being used to text-bomb numbers or burn SMS budget.
const HOUR = 3_600_000, MAX_PER_IP_HOUR = 10, MAX_PER_PHONE_HOUR = 5;

function secret(): string {
  const s = process.env.HOUSY_SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new AuthError('Server is missing HOUSY_SESSION_SECRET', 500);
  return 'dev-only-insecure-secret';
}
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');
const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

// ── Session cookie: base64url(json).hmac ─────────────────────────────
function encode(s: Session): string {
  const payload = Buffer.from(JSON.stringify({ ...s, exp: Date.now() + SESSION_DAYS * 864e5 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function decode(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac || !safeEq(mac, sign(payload))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return d.exp > Date.now() && typeof d.phone === 'string' ? { phone: d.phone, name: String(d.name ?? '') } : null;
  } catch { return null; }
}
export async function currentSession(): Promise<Session | null> {
  return decode((await cookies()).get(COOKIE)?.value);
}
export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, encode(s), {
    httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: SESSION_DAYS * 86400,
  });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }

// ── OTP ──────────────────────────────────────────────────────────────
interface OtpRec { hash: string; exp: number; attempts: number; sentAt: number }
type OtpStore = Record<string, OtpRec>;
const hashCode = (phone: string, code: string) => createHash('sha256').update(`${secret()}|${phone}|${code}`).digest('hex');

// Sliding-window limiter. Returns seconds to wait if any key is over its limit; otherwise records the hit and returns 0.
async function rateLimit(checks: [key: string, limit: number][], windowMs: number): Promise<number> {
  return withJson<Record<string, number[]>, number>('ratelimit', () => ({}), (store) => {
    const now = Date.now();
    for (const k of Object.keys(store)) { store[k] = store[k].filter((t) => now - t < windowMs); if (!store[k].length) delete store[k]; }
    for (const [key, limit] of checks) {
      const hits = store[key] ?? [];
      if (hits.length >= limit) return Math.ceil((hits[0] + windowMs - now) / 1000);
    }
    for (const [key] of checks) (store[key] ??= []).push(now);
    return 0;
  });
}

export async function requestOtp(rawPhone: unknown, ip = 'unknown'): Promise<Delivery> {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new AuthError('Enter a valid 10-digit Indian mobile number');
  const wait0 = await rateLimit([[`ip:${ip}`, MAX_PER_IP_HOUR], [`phone:${phone}`, MAX_PER_PHONE_HOUR]], HOUR);
  if (wait0) throw new AuthError(`Too many code requests. Try again in ${Math.ceil(wait0 / 60)} min`, 429);
  const code = String(randomInt(100000, 1000000));
  const r = await withJson<OtpStore, { wait?: number }>('otp', () => ({}), (store) => {
    const now = Date.now();
    for (const [p, v] of Object.entries(store)) if (v.exp < now) delete store[p]; // purge expired
    const prev = store[phone];
    if (prev && now - prev.sentAt < RESEND_MS) return { wait: Math.ceil((RESEND_MS - (now - prev.sentAt)) / 1000) };
    store[phone] = { hash: hashCode(phone, code), exp: now + OTP_TTL_MS, attempts: 0, sentAt: now };
    return {};
  });
  if (r.wait) throw new AuthError(`Please wait ${r.wait}s before requesting another code`, 429);
  try {
    return await deliverOtp(phone, code);
  } catch (e) {
    await withJson<OtpStore, void>('otp', () => ({}), (s) => { delete s[phone]; }); // don't leave a code nobody received
    throw e;
  }
}

export async function verifyOtp(rawPhone: unknown, rawCode: unknown, name?: string): Promise<Session> {
  const phone = normalizePhone(rawPhone);
  const code = String(rawCode ?? '').trim();
  if (!phone || !/^\d{6}$/.test(code)) throw new AuthError('Enter the 6-digit code');
  // Failed attempts must persist, so report failure as a value rather than throwing inside the transaction.
  const res = await withJson<OtpStore, { ok: true } | { ok: false; msg: string }>('otp', () => ({}), (store) => {
    const rec = store[phone];
    if (!rec || rec.exp < Date.now()) return { ok: false, msg: 'Code expired — request a new one' };
    if (rec.attempts >= MAX_ATTEMPTS) { delete store[phone]; return { ok: false, msg: 'Too many attempts — request a new code' }; }
    rec.attempts++;
    if (!safeEq(rec.hash, hashCode(phone, code))) return { ok: false, msg: 'Incorrect code' };
    delete store[phone]; // single use
    return { ok: true };
  });
  if (!res.ok) throw new AuthError(res.msg, 401);
  const session = { phone, name: (name ?? '').trim().slice(0, 60) };
  await setSession(session);
  return session;
}

export async function requireSession(): Promise<Session> {
  const s = await currentSession();
  if (!s) throw new AuthError('Please log in with your mobile number', 401);
  return s;
}
