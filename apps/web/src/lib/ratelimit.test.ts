import { readFileSync } from 'fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from './ratelimit';
import { useTempStore } from '../test/helpers';

describe('rateLimit', () => {
  useTempStore();
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit, then says how long to wait', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
    for (let i = 0; i < 3; i++) expect(await rateLimit([['k', 3]], 60_000)).toBe(0);
    expect(await rateLimit([['k', 3]], 60_000)).toBe(60);
    vi.setSystemTime(new Date('2026-10-01T10:00:30Z'));
    expect(await rateLimit([['k', 3]], 60_000)).toBe(30);
    vi.setSystemTime(new Date('2026-10-01T10:01:01Z'));                 // window slid past the first hits
    expect(await rateLimit([['k', 3]], 60_000)).toBe(0);
  });

  it('if ANY key is over its limit nothing is recorded for the others', async () => {
    for (let i = 0; i < 2; i++) await rateLimit([['a', 2]], 60_000);
    expect(await rateLimit([['a', 2], ['b', 5]], 60_000)).toBeGreaterThan(0);
    expect(await rateLimit([['b', 1]], 60_000)).toBe(0);                // b was not charged by the rejected call
  });

  it('the store is size-bounded: a flood of distinct (spoofed) keys cannot grow it forever', async () => {
    for (let i = 0; i < 60; i++) await rateLimit([[`ip:${i}`, 5]], 3_600_000, 20);
    const store = JSON.parse(readFileSync('.data/ratelimit.json', 'utf8'));
    expect(Object.keys(store).length).toBeLessThanOrEqual(21);
  });
});
