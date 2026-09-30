// Guards Hindi coverage of everything the SERVER says (errors, timeline, quote findings). The source is scanned, so a
// newly added `throw new ValidationError('…')` with no Hindi in server-text.ts fails here instead of shipping in English.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { translateServerText } from './server-text';
import { act, addPhoto, createProject, getProject, validateCreate } from './projects';
import { useTempStore } from '../test/helpers';

const SRC = join(__dirname, '..');
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
// kv.ts errors are fatal data-integrity guards for operators; app/admin is the English-only ops console.
const files = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.includes(`${SRC}/test/`) && !f.endsWith('/lib/kv.ts') && !f.includes(`${SRC}/app/admin/`));
const HI = /[ऀ-ॿ]/;

// Reads the string/template literals inside a balanced (...) starting at `open`. `${…}` becomes a sample value.
function literalsIn(src: string, open: number): string[] {
  const out: string[] = [];
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') { if (--depth === 0) break; }
    else if (c === "'" || c === '"' || c === '`') {
      let s = '';
      for (i++; i < src.length && src[i] !== c; i++) {
        if (src[i] === '\\') { s += src[++i]; continue; }
        if (c === '`' && src[i] === '$' && src[i + 1] === '{') {
          let d = 0;
          for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; }
          s += '5';
          continue;
        }
        s += src[i];
      }
      out.push(s);
    }
  }
  return out;
}

const messages = new Map<string, string>();   // message → where it came from
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const add = (m: string, at: number) => { if (/[A-Za-z]{3}/.test(m)) messages.set(m, `${f.replace(SRC, 'src')}:${src.slice(0, at).split('\n').length}`); };
  for (const m of src.matchAll(/new (?:Validation|Conflict|NotFound|Auth|Profile|Plan|RateLimited|PayloadTooLarge|NoCoverage|SmsUnavailable|Chat|Upload|Issue|Review)?Error\(/g)) {
    const open = m.index! + m[0].length - 1;
    for (const lit of literalsIn(src, open)) add(lit, m.index!);
  }
  if (f.includes(`${SRC}/app/api/`)) for (const m of src.matchAll(/error: ('(?:[^'\\]|\\.)*'|"[^"]*")/g)) add(m[1].slice(1, -1).replace(/\\'/g, "'"), m.index!);
  if (f.endsWith('.tsx')) for (const m of src.matchAll(/\.error \|\| '((?:[^'\\]|\\.)*)'/g)) add(m[1], m.index!);
  if (f.endsWith('.tsx')) for (const m of src.matchAll(/setError\('((?:[^'\\]|\\.)*)'\)/g)) add(m[1], m.index!);
  if (f.endsWith('/auth.ts')) for (const m of src.matchAll(/msg: ('(?:[^'\\]|\\.)*'|`[^`]*`)/g)) add(m[1].slice(1, -1).replace(/\$\{[^}]*\}/g, '5'), m.index!);
}
// Not user-facing prose (identifiers, HTTP details, developer-only guards).
const IGNORE = /^([a-z]+\.[A-Za-z_.]+|Error|[a-z_]+|[A-Z][A-Za-z]+Error|application\/json|Content-Type|\d+)$/;

describe('server text → Hindi', () => {
  it('found the throw sites (the scan itself works)', () => {
    expect(messages.size).toBeGreaterThan(90);
  });

  it('every message the server can throw or return has a Hindi translation', () => {
    const missing = [...messages].filter(([m]) => !IGNORE.test(m) && !HI.test(translateServerText(m, 'hi'))).map(([m, at]) => `${at}  ${m}`);
    expect(missing).toEqual([]);
  });

  it('English and unknown text pass through untouched', () => {
    expect(translateServerText('Enter a valid 10-digit mobile number', 'en')).toBe('Enter a valid 10-digit mobile number');
    expect(translateServerText('something a user typed', 'hi')).toBe('something a user typed');
    expect(translateServerText('', 'hi')).toBe('');
  });
});

describe('project timeline & quote findings → Hindi', () => {
  useTempStore();
  it('every line a full project lifecycle writes is translated', async () => {
    const OWNER = '9876543210';
    const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
    const slot = () => new Date(Date.now() + 2 * 864e5).toISOString();
    const p0 = await createProject(validateCreate({ typeId: 'new-bathroom', city: 'bareilly', area: 45, tier: 'standard', drainFt: 15, name: 'R', phone: '9811122233', slot: slot() }), OWNER);
    let p = await act(p0.id, { action: 'reschedule', slot: new Date(Date.now() + 3 * 864e5).toISOString() }, OWNER);
    p = await act(p.id, { action: 'complete_visit', measuredArea: 60, measuredDrainFt: 30, note: 'old wall is 9-inch brick' }, OWNER);
    p = await act(p.id, { action: 'accept_quote' }, OWNER);
    p = await act(p.id, { action: 'set_budget', budget: 500000 }, OWNER);
    p = await act(p.id, { action: 'add_expense', category: 'materials', amount: 1200, date: new Date().toISOString().slice(0, 10), method: 'cash', note: 'cement' }, OWNER);
    p = await act(p.id, { action: 'request_change', title: 'Extra socket', description: 'For the geyser point', trade: 'electrician' }, OWNER);
    const ch = p.changes![0];
    p = await act(p.id, { action: 'price_change', changeId: ch.id, amount: 1500, days: 1 }, OWNER);
    p = await act(p.id, { action: 'approve_change', changeId: ch.id }, OWNER);
    p = await act(p.id, { action: 'request_change', title: 'Niche', description: 'A niche in the wall', trade: 'mason' }, OWNER);
    p = await act(p.id, { action: 'decline_change', changeId: p.changes![1].id }, OWNER);
    for (let round = 0; ; round++) {
      const m = p.milestones.find((x) => x.status !== 'paid');
      if (!m) break;
      p = await act(p.id, { action: 'start', milestoneId: m.id }, OWNER);
      await addPhoto(p.id, OWNER, m.id, PNG, 'png', 'done');
      if (round === 0) {
        p = await act(p.id, { action: 'submit', milestoneId: m.id, note: 'ready' }, OWNER);
        p = await act(p.id, { action: 'request_changes', milestoneId: m.id, feedback: 'joints are uneven' }, OWNER);
        await new Promise((r) => setTimeout(r, 5));
        await addPhoto(p.id, OWNER, m.id, PNG, 'png');
      }
      p = await act(p.id, { action: 'submit', milestoneId: m.id, note: 'ready' }, OWNER);
      p = await act(p.id, { action: 'approve', milestoneId: m.id }, OWNER);
    }
    p = (await getProject(p.id, OWNER))!;
    const lines = [...p.timeline.map((t) => t.text), ...(p.quote?.findings ?? [])];
    expect(lines.length).toBeGreaterThan(15);
    const missing = lines.filter((l) => !HI.test(translateServerText(l, 'hi')));
    expect(missing).toEqual([]);
  });
});
