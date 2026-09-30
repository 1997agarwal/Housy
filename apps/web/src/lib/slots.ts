// Bookable visit slots: the next 3 days at 10am and 3pm (local time).
export function visitSlots(): { value: string; text: string }[] {
  const out: { value: string; text: string }[] = [];
  for (let d = 1; d <= 3; d++) for (const h of [10, 15]) {
    const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0);
    out.push({ value: t.toISOString(), text: t.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) });
  }
  return out;
}
