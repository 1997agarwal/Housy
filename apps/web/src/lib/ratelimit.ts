import { withJson } from './kv';

const MAX_KEYS = 20_000;   // bounds the file even if an attacker sends a different (spoofed) IP with every request

// Sliding-window limiter. Returns seconds to wait if ANY key is over its limit; otherwise records the hit and returns 0.
export function rateLimit(checks: [key: string, limit: number][], windowMs: number, maxKeys = MAX_KEYS): Promise<number> {
  return withJson<Record<string, number[]>, number>('ratelimit', () => ({}), (store) => {
    const now = Date.now();
    for (const k of Object.keys(store)) { store[k] = store[k].filter((t) => now - t < windowMs); if (!store[k].length) delete store[k]; }
    const keys = Object.keys(store);
    if (keys.length > maxKeys) {                                    // evict the stalest entries first
      keys.sort((a, b) => store[a][store[a].length - 1] - store[b][store[b].length - 1]);
      for (const k of keys.slice(0, keys.length - Math.floor(maxKeys / 2))) delete store[k];
    }
    for (const [key, limit] of checks) {
      const hits = store[key] ?? [];
      if (hits.length >= limit) return Math.ceil((hits[0] + windowMs - now) / 1000);
    }
    for (const [key] of checks) (store[key] ??= []).push(now);
    return 0;
  });
}
