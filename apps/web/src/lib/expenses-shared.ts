// Expense tracking: types, limits and pure summary math. Browser-safe.

export const EXPENSE_CATEGORIES = {
  materials: 'Materials', labor: 'Labour (outside Housy)', equipment: 'Equipment rental', fixtures: 'Fixtures & appliances',
  furniture: 'Furniture & décor', fees: 'Permits & fees', other: 'Other',
} as const;
export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES;
export const PAY_METHODS = { cash: 'Cash', upi: 'UPI', bank: 'Bank transfer', card: 'Card' } as const;
export type PayMethod = keyof typeof PAY_METHODS;
export const MAX_EXPENSES = 500;

export interface Expense { id: string; category: ExpenseCategory; amount: number; date: string; note?: string; method: PayMethod; createdAt: string }

export interface SummaryInput { budget?: number; paid: number; quoteTotal?: number; accepted?: boolean; expenses?: Expense[] }
export interface Summary {
  ownSpent: number; housyPaid: number; spentSoFar: number;
  housyCommitted: number;               // the accepted quote (money that will go through Housy)
  projected: number;                    // committed + own spending: where the project is heading
  budget?: number; remaining?: number; pctOfBudget?: number;
  status: 'none' | 'ok' | 'watch' | 'over';
  categories: { key: string; label: string; amount: number }[];   // largest first
}

export function summarize(i: SummaryInput): Summary {
  const own = i.expenses ?? [];
  const ownSpent = own.reduce((a, e) => a + e.amount, 0);
  const housyCommitted = i.accepted ? i.quoteTotal ?? 0 : 0;
  const projected = housyCommitted + ownSpent;
  const cats = new Map<string, number>();
  for (const e of own) cats.set(e.category, (cats.get(e.category) ?? 0) + e.amount);
  const categories = [
    ...(i.paid > 0 ? [{ key: 'housy', label: 'Paid via Housy', amount: i.paid }] : []),
    ...[...cats].map(([key, amount]) => ({ key, label: EXPENSE_CATEGORIES[key as ExpenseCategory], amount })),
  ].sort((a, b) => b.amount - a.amount);
  const s: Summary = { ownSpent, housyPaid: i.paid, spentSoFar: i.paid + ownSpent, housyCommitted, projected, categories, status: 'none' };
  if (i.budget && i.budget > 0) {
    s.budget = i.budget; s.remaining = i.budget - projected; s.pctOfBudget = Math.round((projected / i.budget) * 100);
    s.status = projected > i.budget ? 'over' : projected >= i.budget * 0.9 ? 'watch' : 'ok';
  }
  return s;
}

// CSV for the owner's accountant. Cells starting with = + - @ are prefixed so spreadsheets can't run them as formulas.
const cell = (v: string | number) => {
  let t = String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
export function expensesCsv(expenses: Expense[]): string {
  const rows = [['Date', 'Category', 'Amount (INR)', 'Paid by', 'Note'], ...[...expenses].sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [e.date, EXPENSE_CATEGORIES[e.category], e.amount, PAY_METHODS[e.method], e.note ?? ''])];
  return rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
