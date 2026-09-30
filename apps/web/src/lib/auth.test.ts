import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTempStore } from '../test/helpers';

// A minimal stand-in for next/headers' cookie jar.
const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (k: string) => (jar.has(k) ? { value: jar.get(k)! } : undefined),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
  }),
}));

import { AuthError, clearSession, currentSession, requestOtp, verifyOtp } from './auth';

const codeOf = async (phone: string, ip?: string) => {
  const d = await requestOtp(phone, ip);
  if (d.mode !== 'demo') throw new Error('expected demo mode');
  return d.code;
};
const rejects = async (p: Promise<unknown>, status: number, msg?: RegExp) => {
  const e = await p.then(() => null, (x) => x);
  expect(e).toBeInstanceOf(AuthError);
  expect(e.status).toBe(status);
  if (msg) expect(e.message).toMatch(msg);
};

describe('OTP + session', () => {
  useTempStore();
  beforeEach(() => { jar.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-01T10:00:00Z')); });

  it('logs in with the right code, sets a session, and the code is single-use', async () => {
    const code = await codeOf('9876543210');
    const s = await verifyOtp('9876543210', code, 'Asha');
    expect(s).toEqual({ phone: '9876543210', name: 'Asha' });
    expect(await currentSession()).toEqual({ phone: '9876543210', name: 'Asha' });
    await rejects(verifyOtp('9876543210', code), 401, /expired|request a new/i);
  });

  it('rejects bad phones and malformed codes', async () => {
    await rejects(requestOtp('123'), 400);
    await codeOf('9876543210');
    await rejects(verifyOtp('9876543210', '12'), 400);
    await rejects(verifyOtp('9876543210', 'abcdef'), 400);
  });

  it('locks the code after 5 wrong attempts — even the correct code then fails', async () => {
    const code = await codeOf('9876543210');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await rejects(verifyOtp('9876543210', wrong), 401, /Incorrect/);
    await rejects(verifyOtp('9876543210', wrong), 401, /Too many attempts/);
    await rejects(verifyOtp('9876543210', code), 401);
    expect(await currentSession()).toBeNull();
  });

  it('expires codes after 5 minutes', async () => {
    const code = await codeOf('9876543210');
    vi.setSystemTime(new Date('2026-10-01T10:05:01Z'));
    await rejects(verifyOtp('9876543210', code), 401, /expired/);
  });

  it('enforces the 30 s resend gap', async () => {
    await codeOf('9876543210');
    await rejects(requestOtp('9876543210'), 429, /wait/);
    vi.setSystemTime(new Date('2026-10-01T10:00:31Z'));
    await expect(requestOtp('9876543210')).resolves.toBeTruthy();
  });

  it('caps NEW codes per phone (5/hour) and requests per IP (10/hour)', async () => {
    // Each request 5+ minutes apart finds the previous code expired, so it is a genuinely new code.
    for (let i = 0; i < 5; i++) { await codeOf('9876543210', `1.1.1.${i}`); vi.setSystemTime(new Date(Date.now() + 301_000)); }
    await rejects(requestOtp('9876543210', '9.9.9.9'), 429, /Too many code requests/);
    // one IP hammering different numbers
    for (let i = 0; i < 10; i++) await codeOf(`98000000${10 + i}`, '2.2.2.2');
    await rejects(requestOtp('9800000099', '2.2.2.2'), 429, /Too many code requests/);
    // ...and the window slides
    vi.setSystemTime(new Date(Date.now() + 3_600_001));
    await expect(requestOtp('9800000099', '2.2.2.2')).resolves.toBeTruthy();
  });

  it('re-requesting inside the validity window re-sends the SAME code (nobody can invalidate a real code)', async () => {
    const c1 = await codeOf('9876543210');
    vi.setSystemTime(new Date('2026-10-01T10:00:31Z'));
    expect(await codeOf('9876543210', '6.6.6.6')).toBe(c1);          // an attacker re-requesting changes nothing
    vi.setSystemTime(new Date('2026-10-01T10:01:02Z'));
    expect(await codeOf('9876543210', '7.7.7.7')).toBe(c1);
    await expect(verifyOtp('9876543210', c1)).resolves.toBeTruthy();   // the victim's code still works
  });

  it('re-requesting does NOT reset the wrong-attempt counter', async () => {
    const code = await codeOf('9876543210');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 3; i++) await rejects(verifyOtp('9876543210', wrong), 401, /Incorrect/);
    vi.setSystemTime(new Date('2026-10-01T10:00:31Z'));
    await codeOf('9876543210');                                        // "fresh" request
    await rejects(verifyOtp('9876543210', wrong), 401, /Incorrect/);
    await rejects(verifyOtp('9876543210', wrong), 401, /Incorrect/);   // 5th wrong attempt overall
    await rejects(verifyOtp('9876543210', code), 401, /Too many attempts/);
  });

  it('an attacker cannot use up the hourly cap to lock the owner out: reused codes are free', async () => {
    const code = await codeOf('9876543210', '1.1.1.1');
    for (let i = 1; i <= 8; i++) { vi.setSystemTime(new Date(Date.now() + 31_000)); expect(await codeOf('9876543210', `5.5.5.${i}`)).toBe(code); }
    vi.setSystemTime(new Date(Date.now() + 600_000));                  // code expired → the owner asks for a new one
    await expect(requestOtp('9876543210', '3.3.3.3')).resolves.toBeTruthy();
  });

  it('after a code expires, the next request issues a different one', async () => {
    const c1 = await codeOf('9876543210');
    vi.setSystemTime(new Date('2026-10-01T10:06:00Z'));
    const c2 = await codeOf('9876543210');
    await expect(verifyOtp('9876543210', c2)).resolves.toBeTruthy();
    expect(typeof c1).toBe('string');
  });

  it('rejects a tampered or foreign session cookie, and honours logout', async () => {
    await verifyOtp('9876543210', await codeOf('9876543210'), 'Asha');
    const good = jar.get('housy_session')!;
    const [payload, mac] = good.split('.');
    const forged = Buffer.from(JSON.stringify({ phone: '9123456789', name: 'Evil', exp: Date.now() + 1e9 })).toString('base64url');
    jar.set('housy_session', `${forged}.${mac}`);           // valid MAC for a different payload
    expect(await currentSession()).toBeNull();
    jar.set('housy_session', `${payload}.${mac.slice(0, -2)}xx`);
    expect(await currentSession()).toBeNull();
    jar.set('housy_session', 'garbage');
    expect(await currentSession()).toBeNull();
    jar.set('housy_session', good);
    expect((await currentSession())!.phone).toBe('9876543210');
    await clearSession();
    expect(await currentSession()).toBeNull();
  });

  it('expires sessions after 30 days', async () => {
    await verifyOtp('9876543210', await codeOf('9876543210'));
    vi.setSystemTime(new Date(Date.now() + 31 * 864e5));
    expect(await currentSession()).toBeNull();
  });
});
