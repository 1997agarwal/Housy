// All Housy properties are in India, so anything a visitor books or logs is expressed in IST regardless of the
// viewer's own time zone (an owner in New York must not be offered "10 am" New York time for a Bareilly visit).
export const IST = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 3_600_000;

// Today's calendar date in India, as YYYY-MM-DD (safe for <input type="date">).
export const todayIST = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export const formatIST = (iso: string | number | Date, locale = 'en-IN', opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) =>
  `${new Date(iso).toLocaleString(locale, { ...opts, timeZone: IST })} IST`;

// Bookable visit slots: the next 3 days (IST) at 10:00 and 15:00 IST, as absolute instants.
export function visitSlots(locale = 'en-IN', now = new Date()): { value: string; text: string }[] {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);            // shift so UTC getters read IST wall-clock
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate();
  const out: { value: string; text: string }[] = [];
  for (let add = 1; add <= 3; add++) for (const h of [10, 15]) {
    const instant = new Date(Date.UTC(y, m, d + add, h, 0) - IST_OFFSET_MS);
    out.push({ value: instant.toISOString(), text: formatIST(instant, locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) });
  }
  return out;
}
