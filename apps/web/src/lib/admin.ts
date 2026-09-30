import { readJson } from './kv';
import { normalizePhone } from './phone';
import { CITIES, getCity } from './cities';
import type { Project } from './projects';
import type { WaitlistEntry } from './waitlist';
import { AuthError } from './auth';

// Ops access is an allow-list of verified phone numbers in HOUSY_ADMIN_PHONES (comma-separated). Empty = nobody.
export function isAdmin(phone: string): boolean {
  return (process.env.HOUSY_ADMIN_PHONES ?? '').split(',').map((p) => normalizePhone(p)).filter(Boolean).includes(phone);
}
export function assertAdmin(phone: string) {
  if (!isAdmin(phone)) throw new AuthError('Not authorised', 403);
}

export async function summary() {
  const [projects, waitlist] = await Promise.all([readJson<Project[]>('db', []), readJson<WaitlistEntry[]>('waitlist', [])]);
  const cities = CITIES.map((c) => {
    const w = waitlist.filter((e) => e.city === c.id);
    const ps = projects.filter((p) => getCity(p.city)?.id === c.id);
    return {
      id: c.id, name: c.name, status: c.status, waitlist: w.length, projects: ps.length,
      byStatus: ps.reduce<Record<string, number>>((a, p) => ((a[p.status] = (a[p.status] ?? 0) + 1), a), {}),
      value: ps.filter((p) => p.quote?.accepted).reduce((a, p) => a + (p.quote?.total ?? 0), 0),
      topInterest: Object.entries(w.reduce<Record<string, number>>((a, e) => (e.typeId ? ((a[e.typeId] = (a[e.typeId] ?? 0) + 1), a) : a), {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    };
  });
  return {
    totals: { projects: projects.length, waitlist: waitlist.length, accepted: projects.filter((p) => p.quote?.accepted).length },
    cities: cities.sort((a, b) => b.waitlist + b.projects - (a.waitlist + a.projects)),
    // Phones are masked: ops sees demand, not contact details, until there is a real need.
    recentWaitlist: waitlist.slice(-10).reverse().map((e) => ({ ...e, phone: e.phone.slice(0, 2) + '******' + e.phone.slice(-2) })),
  };
}
