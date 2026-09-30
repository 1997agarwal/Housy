import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['9123456789', '9123456789'],          // starts with "91" but is a plain 10-digit number
    ['+91 98765 43210', '9876543210'],
    ['919876543210', '9876543210'],
    ['09876543210', '9876543210'],
    ['98765-43210', '9876543210'],
  ])('accepts %s', (raw, want) => expect(normalizePhone(raw)).toBe(want));

  it.each(['', '12345', '5876543210', '98765432101234', 'abcdefghij', null, undefined, '0912345678'])('rejects %s', (raw) =>
    expect(normalizePhone(raw)).toBeNull());
});
