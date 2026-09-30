import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { readJson, withJson } from './kv';
import { rateLimit } from './ratelimit';
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
interface OtpRec { nonce: string; hash: string; exp: number; attempts: number; sentAt: number }
type OtpStore = Record<string, OtpRec>;
const hashCode = (phone: string, code: string) => createHash('sha256').update(`${secret()}|${phone}|${code}`).digest('hex');
// The code is derived from a stored random nonce, so a re-request inside the validity window can resend the SAME code.
const deriveCode = (phone: string, nonce: string) => String(100000 + (createHmac('sha256', secret()).update(`otp|${phone}|${nonce}`).digest().readUInt32BE(0) % 900000));

export async function requestOtp(rawPhone: unknown, ip = 'unknown'): Promise<Delivery> {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new AuthError('Enter a valid 10-digit Indian mobile number');
  const wait0 = await rateLimit([[`ip:${ip}`, MAX_PER_IP_HOUR]], HOUR);
  if (wait0) throw new AuthError(`Too many code requests. Try again in ${Math.ceil(wait0 / 60)} min`, 429);

  // A still-valid code is re-sent, not replaced: otherwise anyone could invalidate a victim's real code (and reset its
  // attempt counter) just by requesting another one for their number. Only genuinely NEW codes count against the
  // per-phone hourly cap, so an attacker can't use it up to lock the owner out either.
  const live = ((await readJson<OtpStore>('otp', {}))[phone]?.exp ?? 0) > Date.now();
  if (!live) {
    const wait1 = await rateLimit([[`phone:${phone}`, MAX_PER_PHONE_HOUR]], HOUR);
    if (wait1) throw new AuthError(`Too many code requests for this number. Try again in ${Math.ceil(wait1 / 60)} min`, 429);
  }

  const r = await withJson<OtpStore, { wait?: number; code?: string; created?: boolean }>('otp', () => ({}), (store) => {
    const now = Date.now();
    for (const [p, v] of Object.entries(store)) if (v.exp < now) delete store[p]; // purge expired
    const prev = store[phone];
    if (prev && now - prev.sentAt < RESEND_MS) return { wait: Math.ceil((RESEND_MS - (now - prev.sentAt)) / 1000) };
    if (prev) { prev.sentAt = now; return { code: deriveCode(phone, prev.nonce), created: false }; }   // same code, same attempt count
    const nonce = randomBytes(12).toString('hex');
    const code = deriveCode(phone, nonce);
    store[phone] = { nonce, hash: hashCode(phone, code), exp: now + OTP_TTL_MS, attempts: 0, sentAt: now };
    return { code, created: true };
  });
  if (r.wait) throw new AuthError(`Please wait ${r.wait}s before requesting another code`, 429);
  try {
    return await deliverOtp(phone, r.code!);
  } catch (e) {
    if (r.created) await withJson<OtpStore, void>('otp', () => ({}), (s) => { delete s[phone]; }); // don't leave a code nobody received
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
