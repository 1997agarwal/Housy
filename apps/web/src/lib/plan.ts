import { readJson, withJson } from './kv';
import { validatePlan, type Plan } from './plan-shared';

// One saved home plan per user (their property). Swap for a table keyed by property_id later.
export const getPlan = async (owner: string): Promise<Plan | null> => (await readJson<Record<string, Plan>>('plans', {}))[owner] ?? null;

export async function savePlan(owner: string, raw: unknown): Promise<Plan> {
  const plan = { ...validatePlan(raw), updatedAt: new Date().toISOString() };
  return withJson<Record<string, Plan>, Plan>('plans', () => ({}), (all) => { all[owner] = plan; return plan; });
}
