import { expect, it } from 'vitest';
import { content } from '../data';
import { newGame, questSeedPrefix, sketchSeedPrefix } from '../src';
import { choiceAvailable, resolveEventChoice, rollDailyEvents } from '../src/engine/events';
import { Rng } from '../src/engine/rng';

it.each(content.characters)('offers three optional quests to $id with remembered contacts', ch => {
  const quests = content.events.filter(e => e.careerQuest && e.when.characters?.includes(ch.id));
  expect(quests).toHaveLength(3);
  const state = newGame(questSeedPrefix + 'test', ch.id, content);
  const rng = new Rng(10);
  for (const quest of quests) {
    state.day = quest.careerQuest?.fromDay ?? 0;
    state.pendingEvents = [];
    rollDailyEvents(state, content, rng);
    expect(state.pendingEvents.filter(id => id.startsWith('side_'))).toEqual([quest.id]);
    if (quest.careerQuest?.chapter === 1) {
      const skipped = structuredClone(state);
      resolveEventChoice(skipped, content, rng, quest.choices.length - 1);
      expect([skipped.cleanCash, skipped.flags]).toEqual([state.cleanCash, state.flags]);
      resolveEventChoice(state, content, rng, 1);
    } else {
      const partner = quest.choices.find(c => c.requires);
      expect(partner).toBeDefined();
      expect(choiceAvailable(state, partner?.requires)).toBe(true);
      expect(choiceAvailable({ ...state, flags: [] }, partner?.requires)).toBe(false);
      const before = state.cleanCash;
      resolveEventChoice(state, content, rng, 0);
      expect(state.cleanCash).toBeGreaterThan(before);
    }
  }
  const old = newGame(sketchSeedPrefix + 'test', ch.id, content);
  old.day = 30;
  rollDailyEvents(old, content, rng);
  expect(old.pendingEvents.some(id => id.startsWith('side_'))).toBe(false);
});
