import { describe, expect, it } from 'vitest';
import { ProfileError, validateProfile } from './profile-shared';
import { getProfile, saveProfile } from './profile';
import { useTempStore } from '../test/helpers';

const good = { name: 'Harshita G', email: 'h@example.com', language: 'hi', persona: 'away', city: 'Bareilly', propertyType: 'house',
  propertyAreaSqft: '2000', propertyValueLakh: 100, goals: ['renovate', 'interiors', 'renovate'], timeline: '1-3m' };

describe('validateProfile', () => {
  it('normalises a valid profile (city name → id, dedupes goals, coerces numbers)', () => {
    const v = validateProfile(good);
    expect(v.city).toBe('bareilly');
    expect(v.goals).toEqual(['renovate', 'interiors']);
    expect(v.propertyAreaSqft).toBe(2000);
  });
  it('treats email/area/value as optional', () => {
    const v = validateProfile({ ...good, email: '', propertyAreaSqft: '', propertyValueLakh: undefined });
    expect(v.email).toBeUndefined();
    expect(v.propertyAreaSqft).toBeUndefined();
  });
  it.each([
    ['name too short', { name: 'H' }], ['bad email', { email: 'nope' }], ['bad persona', { persona: 'alien' }],
    ['unknown city', { city: 'atlantis' }], ['no goals', { goals: [] }], ['only invalid goals', { goals: ['hack'] }],
    ['negative value', { propertyValueLakh: -5 }], ['bad timeline', { timeline: 'yesterday' }], ['bad language', { language: 'fr' }],
    ['bad type', { propertyType: 'castle' }], ['prototype key as enum', { persona: '__proto__' }], ['constructor as enum', { language: 'constructor' }],
  ])('rejects %s', (_n, patch) => expect(() => validateProfile({ ...good, ...patch })).toThrow(ProfileError));
});

describe('profile storage', () => {
  useTempStore();
  it('saves, reads back, and keeps createdAt on update', async () => {
    expect(await getProfile('9876543210')).toBeNull();
    const a = await saveProfile('9876543210', good);
    const b = await saveProfile('9876543210', { ...good, name: 'Harshita A.' });
    expect((await getProfile('9876543210'))!.name).toBe('Harshita A.');
    expect(b.createdAt).toBe(a.createdAt);
  });
  it('keeps profiles separate per phone', async () => {
    await saveProfile('9876543210', good);
    expect(await getProfile('9123456789')).toBeNull();
  });
});

describe('profile numbers are strictly parsed', () => {
  it('rejects array/boolean coercions for area and value (Number([100]) === 100)', () => {
    for (const bad of [[100], true, {}]) {
      expect(() => validateProfile({ ...good, propertyAreaSqft: bad })).toThrow(ProfileError);
      expect(() => validateProfile({ ...good, propertyValueLakh: bad })).toThrow(ProfileError);
    }
    expect(validateProfile({ ...good, propertyAreaSqft: '  ' }).propertyAreaSqft).toBeUndefined();   // blank means "not given"
  });
});
