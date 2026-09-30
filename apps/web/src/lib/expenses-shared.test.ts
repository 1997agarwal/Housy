import { describe, expect, it } from 'vitest';
import { expensesCsv, summarize, type Expense } from './expenses-shared';

const e = (o: Partial<Expense> = {}): Expense => ({ id: 'E1', category: 'materials', amount: 1000, date: '2026-10-01', method: 'upi', createdAt: '2026-10-01T00:00:00Z', ...o });

describe('summarize', () => {
  it('adds Housy payments and own expenses; projects committed + own', () => {
    const s = summarize({ paid: 20000, quoteTotal: 100000, accepted: true, expenses: [e({ amount: 5000 }), e({ id: 'E2', category: 'fees', amount: 2500 })] });
    expect(s).toMatchObject({ ownSpent: 7500, housyPaid: 20000, spentSoFar: 27500, housyCommitted: 100000, projected: 107500, status: 'none' });
  });
  it('ignores an unaccepted quote (nothing committed yet)', () => {
    expect(summarize({ paid: 0, quoteTotal: 100000, accepted: false }).projected).toBe(0);
  });
  it('budget status: ok → watch at 90 % → over', () => {
    const at = (budget: number) => summarize({ budget, paid: 0, quoteTotal: 90000, accepted: true, expenses: [] });
    expect(at(200000)).toMatchObject({ status: 'ok', remaining: 110000, pctOfBudget: 45 });
    expect(at(100000).status).toBe('watch');            // exactly 90 %
    expect(at(90000).status).toBe('watch');             // exactly 100 % is not yet over
    expect(at(89999)).toMatchObject({ status: 'over', remaining: -1 });
    expect(summarize({ paid: 0, quoteTotal: 90000, accepted: true }).status).toBe('none');
    expect(summarize({ budget: 0, paid: 0 }).status).toBe('none');
  });
  it('groups categories, largest first, with Housy payments as one line', () => {
    const s = summarize({ paid: 30000, expenses: [e({ amount: 4000 }), e({ id: 'E2', amount: 1000 }), e({ id: 'E3', category: 'fixtures', amount: 9000 })] });
    expect(s.categories.map((c) => [c.label, c.amount])).toEqual([['Paid via Housy', 30000], ['Fixtures & appliances', 9000], ['Materials', 5000]]);
  });
});

describe('expensesCsv', () => {
  it('has a header, sorts by date, and quotes commas/quotes/newlines', () => {
    const csv = expensesCsv([e({ date: '2026-10-05', note: 'cement, 20 bags' }), e({ id: 'E2', date: '2026-10-01', note: 'said "ok"\nthanks' })]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Date,Category,Amount (INR),Paid by,Note');
    expect(lines[1].startsWith('2026-10-01')).toBe(true);
    expect(csv).toContain('"cement, 20 bags"');
    expect(csv).toContain('"said ""ok""\nthanks"');
  });
  it('neutralises spreadsheet formulas in user text', () => {
    for (const evil of ['=HYPERLINK("http://evil","x")', '+1+1', '-2+3', '@SUM(A1)', '\t=1']) {
      const csv = expensesCsv([e({ note: evil })]);
      const note = csv.split('\r\n')[1].split(',').slice(4).join(',');
      expect(note.replace(/^"/, '').startsWith("'"), evil).toBe(true);
    }
  });
});
