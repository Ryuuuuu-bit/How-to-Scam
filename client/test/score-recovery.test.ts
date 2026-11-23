import { afterEach, expect, it, vi } from 'vitest';
import { campaignSeed } from '@hts/shared';
import { autoPlay } from '../../shared/test/helpers';
import { clearSubmittedRun, loadSavedRun } from '../src/game/useGame';

afterEach(() => vi.unstubAllGlobals());

it('can reopen a finished ranked game and only removes the acknowledged run', () => {
  const seed = campaignSeed(90, 'score-recovery');
  const { actions, state } = autoPlay(seed);
  const data = new Map([['hts.save.v2', JSON.stringify({ seed, actions, characterId: state.characterId, runId: 'ranked' })]]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    removeItem: (key: string) => data.delete(key),
  });
  clearSubmittedRun('previous-run');
  expect(loadSavedRun()?.state.end).toEqual(state.end);
  expect(state.phase).toBe('ended');
  clearSubmittedRun('ranked');
  expect(loadSavedRun()).toBeNull();
});
