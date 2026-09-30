import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdmin, summary } from './admin';
import { addToWaitlist } from './waitlist';
import { createProject, validateCreate } from './projects';
import { useTempStore } from '../test/helpers';

describe('admin', () => {
  useTempStore();
  afterEach(() => vi.unstubAllEnvs());

  it('is an allow-list of verified phones; empty means nobody', () => {
    expect(isAdmin('9876543210')).toBe(false);
    vi.stubEnv('HOUSY_ADMIN_PHONES', '+91 98765 43210, 9123456789');
    expect(isAdmin('9876543210')).toBe(true);
    expect(isAdmin('9123456789')).toBe(true);
    expect(isAdmin('9000000000')).toBe(false);
  });

  it('summarises demand per city and masks waitlist phones', async () => {
    await addToWaitlist({ city: 'agra', name: 'A', phone: '9876543210', typeId: 'kitchen' });
    await addToWaitlist({ city: 'agra', name: 'B', phone: '9123456789', typeId: 'kitchen' });
    await addToWaitlist({ city: 'mumbai', name: 'C', phone: '9812345678' });
    await createProject(validateCreate({ typeId: 'kitchen', city: 'bareilly', area: 90, tier: 'standard', name: 'R', phone: '9811122233', slot: new Date(Date.now() + 864e5).toISOString() } as any), '9000000001');
    const s = await summary();
    expect(s.totals).toMatchObject({ projects: 1, waitlist: 3 });
    expect(s.cities[0].id).toBe('agra');                       // most demand first
    expect(s.cities[0]).toMatchObject({ waitlist: 2, topInterest: 'kitchen' });
    expect(s.recentWaitlist.every((e) => /^\d{2}\*{6}\d{2}$/.test(e.phone))).toBe(true);
  });
});
