import { readJson, withJson } from './kv';
import { normalizePhone } from './phone';
import { validateProfile, ProfileError, type Profile } from './profile-shared';

export * from './profile-shared';

export const getProfile = async (phone: string): Promise<Profile | null> =>
  (await readJson<Record<string, Profile>>('users', {}))[phone] ?? null;

export function saveProfile(phone: string, raw: unknown): Promise<Profile> {
  const p = normalizePhone(phone);
  if (!p) throw new ProfileError('Invalid account');
  const v = validateProfile(raw);
  return withJson<Record<string, Profile>, Profile>('users', () => ({}), (all) => {
    const now = new Date().toISOString();
    const saved: Profile = { ...v, phone: p, createdAt: all[p]?.createdAt ?? now, updatedAt: now };
    all[p] = saved;
    return saved;
  });
}
