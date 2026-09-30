import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach } from 'vitest';

// Runs each test in an empty temp working directory so the JSON store (.data/) starts clean.
export function useTempStore() {
  let dir = '';
  const cwd = process.cwd();
  beforeEach(() => { dir = mkdtempSync(path.join(tmpdir(), 'housy-')); process.chdir(dir); });
  afterEach(() => { process.chdir(cwd); rmSync(dir, { recursive: true, force: true }); });
}
