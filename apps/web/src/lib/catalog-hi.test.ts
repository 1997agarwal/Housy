import { describe, expect, it } from 'vitest';
import { CITIES } from './cities';
import { PROJECT_TYPES, STYLES } from './catalog';
import { finishLabel, optionLabel, roomName, stateName, styleName, ROOM_TYPE_HI } from './catalog-hi';
import { ROOM_TYPES } from './plan-shared';

const HI = /[ऀ-ॿ]/;
describe('catalog-hi covers every id-keyed name', () => {
  it('states, styles, interiors rooms, finishes and options', () => {
    for (const c of CITIES) expect(HI.test(stateName(c.state, 'hi')), c.state).toBe(true);
    for (const s of STYLES) expect(HI.test(styleName(s, 'hi')), s).toBe(true);
    for (const t of PROJECT_TYPES) {
      for (const r of t.rooms ?? []) expect(HI.test(roomName(r.id, r.name, 'hi')), r.id).toBe(true);
      for (const f of t.finishes ?? []) {
        expect(HI.test(finishLabel(f.id, f.label, 'hi')), f.id).toBe(true);
        for (const o of f.options) expect(HI.test(optionLabel(o.id, o.label, 'hi')), o.id).toBe(true);
      }
    }
    for (const k of Object.keys(ROOM_TYPES)) expect(HI.test(ROOM_TYPE_HI[k]), k).toBe(true);
  });
  it('English is untouched', () => {
    expect(styleName('Modern', 'en')).toBe('Modern');
    expect(roomName('living', 'Living room', 'en')).toBe('Living room');
  });
});
