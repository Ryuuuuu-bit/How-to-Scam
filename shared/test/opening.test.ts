import { expect, it } from 'vitest';
import { content } from '../data';
import { newGame, openingFor, replay, step } from '../src';
import { updateLevel } from '../src/engine/day';

it('rolls optional openings once per seed and replays both choices', () => {
  const character = 'ex_insurance';
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const seed = 'v3:test' + i;
    const opening = openingFor(seed, character);
    seen.add(opening);
    for (const methodId of [null, 'fake_shop']) {
      const action = { t: 'choosePlan', methodId, opening: true } as const;
      const initial = newGame(seed, character, content);
      if (!opening) {
        expect(() => step(initial, action, content)).toThrow();
        continue;
      }
      const next = step(initial, action, content);
      expect(next.history[0]?.opening).toBe(opening);
      expect(replay(seed, character, [action], content)).toEqual(next);
      expect(step(initial, { t: 'choosePlan', methodId }, content).history[0]?.opening).toBeUndefined();
    }
  }
  expect(seen).toEqual(new Set([null, 'mother', 'guild', 'parcel']));
});

it('uses the casual thresholds only for new runs', () => {
  for (const [seed, thresholds] of [['v3:test', [20000, 95000, 340000]], ['old', [25000, 110000, 380000]]] as const) {
    const state = newGame(seed, 'ex_insurance', content);
    thresholds.forEach((threshold, i) => {
      state.totalLaundered = threshold - 1;
      updateLevel(state, content);
      expect(state.gangLevel).toBe(i + 1);
      state.totalLaundered++;
      updateLevel(state, content);
      expect(state.gangLevel).toBe(i + 2);
    });
  }
});
