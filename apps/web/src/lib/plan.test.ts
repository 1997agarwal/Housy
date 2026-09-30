import { describe, expect, it } from 'vitest';
import { getPlan, savePlan } from './plan';
import { PlanError, fromTemplate } from './plan-shared';
import { useTempStore } from '../test/helpers';

describe('plan storage', () => {
  useTempStore();
  it('saves, returns, and overwrites a user’s plan', async () => {
    expect(await getPlan('9876543210')).toBeNull();
    const saved = await savePlan('9876543210', fromTemplate('2bhk'));
    expect(saved.rooms).toHaveLength(6);
    expect(saved.updatedAt).toBeTruthy();
    expect((await getPlan('9876543210'))!.septic).toEqual({ x: 40, y: 22 });
    await savePlan('9876543210', { rooms: [] });
    expect((await getPlan('9876543210'))!.rooms).toEqual([]);
  });
  it('is private per user', async () => {
    await savePlan('9876543210', fromTemplate('3bhk'));
    expect(await getPlan('9123456789')).toBeNull();
  });
  it('refuses invalid plans and keeps the previous one', async () => {
    await savePlan('9876543210', fromTemplate('2bhk'));
    await expect(savePlan('9876543210', { rooms: [{ id: 'r1', name: 'X', type: 'living', x: 0, y: 0, w: 999, l: 10 }] })).rejects.toThrow(PlanError);
    expect((await getPlan('9876543210'))!.rooms).toHaveLength(6);
  });
});
