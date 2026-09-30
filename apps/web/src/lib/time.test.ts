import { describe, expect, it } from 'vitest';
import { formatIST, todayIST, visitSlots } from './time';

describe('IST helpers', () => {
  it('todayIST is the Indian calendar date, not the UTC or viewer date', () => {
    expect(todayIST(new Date('2026-10-01T20:00:00Z'))).toBe('2026-10-02');   // 01:30 IST next day (UTC is still the 1st)
    expect(todayIST(new Date('2026-10-01T18:29:00Z'))).toBe('2026-10-01');   // 23:59 IST
    expect(todayIST(new Date('2026-10-01T18:31:00Z'))).toBe('2026-10-02');   // 00:01 IST
  });

  it('offers 6 slots — 10:00 and 15:00 IST on each of the next three IST days', () => {
    const slots = visitSlots('en-IN', new Date('2026-10-01T05:00:00Z'));     // 10:30 IST on 1 Oct
    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.value)).toEqual([
      '2026-10-02T04:30:00.000Z', '2026-10-02T09:30:00.000Z',              // 10:00 & 15:00 IST on 2 Oct
      '2026-10-03T04:30:00.000Z', '2026-10-03T09:30:00.000Z',
      '2026-10-04T04:30:00.000Z', '2026-10-04T09:30:00.000Z',
    ]);
    expect(slots[0].text).toMatch(/10:00\s?am.*IST/i);
    expect(slots[1].text).toMatch(/3:00\s?pm.*IST/i);
  });

  it('is identical for every viewer time zone (it depends only on the instant)', () => {
    const now = new Date('2026-10-01T05:00:00Z');
    const original = process.env.TZ;
    const seen = new Set<string>();
    for (const tz of ['Asia/Kolkata', 'America/New_York', 'Pacific/Auckland', 'UTC']) {
      process.env.TZ = tz;
      seen.add(JSON.stringify(visitSlots('en-IN', now)));
    }
    process.env.TZ = original;
    expect(seen.size).toBe(1);
  });

  it('uses the correct IST day around midnight', () => {
    // 01:00 IST on 2 Oct is still 1 Oct in UTC; "tomorrow" must be 3 Oct IST, never 2 Oct.
    const first = visitSlots('en-IN', new Date('2026-10-01T19:30:00Z'))[0];
    expect(first.value).toBe('2026-10-03T04:30:00.000Z');
  });

  it('every slot is in the future', () => {
    const now = new Date();
    for (const s of visitSlots('en-IN', now)) expect(Date.parse(s.value)).toBeGreaterThan(now.getTime());
  });

  it('formatIST always states the zone and renders in IST', () => {
    expect(formatIST('2026-10-02T04:30:00Z', 'en-IN', { hour: 'numeric', minute: '2-digit' })).toMatch(/10:00\s?am IST/i);
  });
});
