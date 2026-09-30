import { promises as fs } from 'fs';
import path from 'path';
import { getCity } from './cities';
import { getType } from './catalog';
import { ValidationError } from './projects';

export interface WaitlistEntry { id: string; createdAt: string; city: string; name: string; phone: string; typeId?: string }
const FILE = path.join(process.cwd(), '.data', 'waitlist.json');
let lock: Promise<unknown> = Promise.resolve();

export function addToWaitlist(input: { city?: string; name?: string; phone?: string; typeId?: string }) {
  const city = getCity(input.city);
  if (!city) throw new ValidationError('Choose a city');
  if (city.status === 'live') throw new ValidationError(`${city.name} is already live — you can book directly`);
  if (!input.name?.trim()) throw new ValidationError('Name is required');
  const digits = (input.phone ?? '').replace(/[\s-]/g, '');
  const local = digits.length > 10 ? digits.replace(/^(\+91|91|0)/, '') : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new ValidationError('Enter a valid 10-digit Indian mobile number');
  const typeId = input.typeId && getType(input.typeId) ? input.typeId : undefined;

  const run = lock.then(async () => {
    let all: WaitlistEntry[] = [];
    try { all = JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { /* first entry */ }
    // Idempotent per phone+city so a double-click doesn't create duplicates.
    const existing = all.find((e) => e.city === city.id && e.phone === local);
    if (existing) return existing;
    const entry: WaitlistEntry = { id: 'WL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: new Date().toISOString(), city: city.id, name: input.name!.trim(), phone: local, typeId };
    all.push(entry);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2));
    return entry;
  });
  lock = run.catch(() => undefined);
  return run;
}
