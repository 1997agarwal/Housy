import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { readJson, withJson } from './kv';
import { useTempStore } from '../test/helpers';

describe('kv store safety', () => {
  useTempStore();

  it('a missing file is an empty store', async () => {
    expect(await readJson('nothing', [])).toEqual([]);
    expect(await withJson<number[], number>('nothing', () => [], (d) => { d.push(1); return d.length; })).toBe(1);
    expect(JSON.parse(readFileSync('.data/nothing.json', 'utf8'))).toEqual([1]);
  });

  it('NEVER overwrites a corrupted file with an empty store', async () => {
    mkdirSync('.data');
    writeFileSync('.data/db.json', '[{"id":"HSY-1"}, {"id": broken');
    await expect(readJson('db', [])).rejects.toThrow(/unreadable/);
    await expect(withJson<unknown[], void>('db', () => [], (d) => { d.push('new'); })).rejects.toThrow(/unreadable/);
    expect(readFileSync('.data/db.json', 'utf8')).toBe('[{"id":"HSY-1"}, {"id": broken');   // untouched, recoverable by hand
  });

  it('NEVER overwrites the store when the read fails for another reason', async () => {
    mkdirSync('.data/db.json', { recursive: true });                                        // a directory where the file should be → EISDIR
    await expect(withJson<unknown[], void>('db', () => [], (d) => { d.push('new'); })).rejects.toThrow();
  });

  it('a failed operation does not block later ones', async () => {
    await expect(withJson('q', () => [], () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(await withJson<number[], number>('q', () => [], (d) => { d.push(2); return d.length; })).toBe(1);
  });

  it('serialises concurrent writers on one file', async () => {
    await Promise.all(Array.from({ length: 40 }, (_, i) => withJson<number[], void>('c', () => [], (d) => { d.push(i); })));
    expect(new Set(await readJson<number[]>('c', [])).size).toBe(40);
  });
});
