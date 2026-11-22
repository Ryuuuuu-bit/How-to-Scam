import { expect, it } from 'vitest';
import { content, soiSketches } from '../data';
import { careerSeedPrefix, isEventEligible, newGame, sketchSeedPrefix, step } from '../src';

it.each(soiSketches)('rolls $id only for new games and records each choice once', sketch => {
  const event = content.events.find(e => e.id === sketch.id);
  if (!event) throw new Error('Missing random event ' + sketch.id);
  const start = newGame(sketchSeedPrefix + 'show', 'phone_tech', content);
  const planned = step({ ...start, day: 3 }, { t: 'choosePlan', methodId: null }, content);
  expect(isEventEligible(planned, content, event)).toBe(true);
  expect(isEventEligible({ ...planned, seed: careerSeedPrefix + 'old' }, content, event)).toBe(false);
  expect(isEventEligible({ ...planned, seenEvents: [event.id] }, content, event)).toBe(false);
  for (const [choiceIdx, choice] of sketch.choices.entries()) {
    const next = step({ ...planned, phase: 'event', pendingEvents: [event.id] }, { t: 'eventChoice', choiceIdx }, content);
    expect(next[choice.stat] - planned[choice.stat]).toBe(choice.gain);
    expect(next.history.at(-1)?.events).toEqual([event.id]);
    expect(next.lastResults.find(r => r.kind === 'event')?.textKey).toBe(event.id + ':' + choiceIdx + ':0');
  }
});
