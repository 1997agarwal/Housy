// Strict number parsing for untrusted input. JavaScript's Number() is far too forgiving: Number([]) is 0,
// Number([50]) is 50, Number(true) is 1, Number(' ') is 0. Only real numbers and non-blank numeric strings count;
// everything else is NaN, which fails every range check downstream.
export function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return NaN;
}
