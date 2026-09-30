import { withJson } from './kv';
import { normalizePhone } from './phone';
import { getCity } from './cities';
import { getType } from './catalog';
import { ValidationError } from './projects';

export interface WaitlistEntry { id: string; createdAt: string; city: string; name: string; phone: string; typeId?: string }
export function addToWaitlist(input: { city?: string; name?: string; phone?: string; typeId?: string }) {
  const city = getCity(input.city);
  if (!city) throw new ValidationError('Choose a city');
  if (city.status === 'live') throw new ValidationError(`${city.name} is already live — you can book directly`);
  if (!input.name?.trim()) throw new ValidationError('Name is required');
  const local = normalizePhone(input.phone);
  if (!local) throw new ValidationError('Enter a valid 10-digit Indian mobile number');
  const typeId = input.typeId && getType(input.typeId) ? input.typeId : undefined;

  // Idempotent per phone+city so a double-click doesn't create duplicates.
  return withJson<WaitlistEntry[], WaitlistEntry>('waitlist', () => [], (all) => {
    const existing = all.find((e) => e.city === city.id && e.phone === local);
    if (existing) return existing;
    const entry: WaitlistEntry = { id: 'WL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: new Date().toISOString(), city: city.id, name: input.name!.trim(), phone: local, typeId };
    all.push(entry);
    return entry;
  });
}
