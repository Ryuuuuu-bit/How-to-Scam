import { expect, it, vi } from 'vitest';
import { campaignSeed, newGame } from '@hts/shared';
import { content } from '@hts/shared/data';
import { resolveEventChoice } from '../../shared/src/engine/events';
import { Rng } from '../../shared/src/engine/rng';
import { describeResult } from '../src/game/results';

it('resolves every authored outcome and shows its Thai result for the selected choice', () => {
  for (const event of content.events) {
    for (const [ci, choice] of event.choices.entries()) {
      const req = choice.requires;
      const character = req?.characters?.[0] ?? event.when.characters?.[0] ?? 'ex_insurance';
      for (const [oi, outcome] of choice.outcomes.entries()) {
        const state = newGame(campaignSeed(90, 'qa'), character, content);
        state.pendingEvents = [event.id];
        state.day = event.when.day?.[0] ?? 1;
        state.dirtyCash = Math.max(state.dirtyCash, req?.minDirtyCash ?? 0);
        state.fame = Math.max(state.fame, req?.minFame ?? 0);
        state.flags.push(...(req?.flags ?? []));
        for (const item of req?.upgrades ?? []) state.upgrades[item] = 1;
        for (let n = 0; n < (req?.minHenchmen ?? 0); n++) {
          state.henchmen.push({ id: 'qa-' + n, skill: 1, wage: 1, loyalty: 50 });
        }
        const rng = new Rng(1);
        vi.spyOn(rng, 'weightedIndex').mockReturnValueOnce(oi);
        resolveEventChoice(state, content, rng, ci);
        const result = state.lastResults.at(-1);
        if (!result) throw Error('Missing result for ' + event.id);
        const key = [event.id, ci, oi].join(':');
        expect(result.textKey).toBe(key);
        expect(describeResult(result, state)?.title, key).toBe(outcome.text.th);
        for (const text of [event.title.th, event.body.th, choice.text.th, outcome.text.th]) {
          expect(text, key).toMatch(/[ก-ฮ]/);
          expect(text, key).not.toContain('\uFFFD');
        }
      }
    }
  }
});
