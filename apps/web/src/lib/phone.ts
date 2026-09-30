// Indian mobile number → 10-digit local form, or null if invalid.
export function normalizePhone(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/[\s-]/g, '');
  // Only strip a country/trunk prefix when the number is longer than 10 digits (9123456789 is a valid number).
  const local = digits.length > 10 ? digits.replace(/^(\+91|91|0)/, '') : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}
