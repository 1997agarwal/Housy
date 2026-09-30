import { promises as fs } from 'fs';
import path from 'path';

// Tiny JSON-file store with a process-wide lock per file.
// The lock lives on globalThis because Next can bundle each route separately, which would give every
// route its own module-level lock and let two routes race on the same file.
const g = globalThis as unknown as { __housyLocks?: Map<string, Promise<unknown>> };
const locks = (g.__housyLocks ??= new Map());
const file = (name: string) => path.join(process.cwd(), '.data', `${name}.json`);

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file(name), 'utf8')); } catch { return fallback; }
}

// Serialised read-modify-write. `fn` mutates `data` in place and returns a result. If it throws,
// nothing is written (so return a result object instead of throwing when a change must persist).
export function withJson<T, R>(name: string, fallback: () => T, fn: (data: T) => R | Promise<R>): Promise<R> {
  const prev = locks.get(name) ?? Promise.resolve();
  const run = prev.then(async () => {
    const data = await readJson<T>(name, fallback());
    const result = await fn(data);
    const target = file(name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, target); // atomic replace: readers never see a half-written file
    return result;
  });
  locks.set(name, run.catch(() => undefined));
  return run;
}
