import { expect, it } from 'vitest';
import { content } from '../data';
import { careerOrigins, careerSeedPrefix, isEventEligible, newGame, openingFor, originFor, originStage, step } from '../src';
import { pickEnding } from '../src/engine/score';

const seed = careerSeedPrefix + 'preview-0';
const classic = 'v3:soi:live:origin:preview-4';

it.each(content.characters)('matches $id to their own contact across both days', ({ id }) => {
  const story = originFor(seed, id);
  expect(story).toBe(careerOrigins[id as keyof typeof careerOrigins]);
  expect(story).toBeTruthy();
  expect(openingFor(seed, id)).toBeNull();
  for (const reply of ['help', 'later'] as const) {
    const s = step(newGame(seed, id, content), { t: 'replyOrigin', reply }, content);
    expect(originStage({ ...s, day: 3 })).toBe('followup');
    expect(step({ ...s, day: 3 }, { t: 'readOrigin' }, content).originStory).toEqual({ reply, followedUpOn: 3 });
  }
  expect(originFor(classic, id)).toBe('curry');
});

it('uses career and decisions for seven retirements while preserving special and legacy endings', () => {
  const base = newGame(seed, 'ex_insurance', content);
  const paths = content.characters.map(({ id }) => pickEnding({ ...base, characterId: id }, content, 'retired'));
  const crew = ['first', 'second'].map(id => ({ id, skill: 2, wage: 100, loyalty: 75 }));
  const cooperative = pickEnding({ ...base, henchmen: crew }, content, 'retired');
  expect(new Set([...paths, cooperative]).size).toBe(7);
  expect(pickEnding({ ...base, fame: 30 }, content, 'retired')).toBe('retire_radio');
  expect(pickEnding({ ...base, flags: ['soi_served_meals'] }, content, 'retired')).toBe('retire_kitchen');
  expect(pickEnding({ ...base, cleanCash: 500000 }, content, 'retired')).toBe('rich_alone');
  expect(pickEnding({ ...base, flags: ['promised_family'] }, content, 'retired')).toBe('home_again');
  expect(pickEnding(base, content, 'caught')).toBe('jailed');
  expect(pickEnding(base, content, 'survived')).toBe('confused_retiree');
  expect(pickEnding({ ...base, seed: classic }, content, 'retired')).toBe('confused_retiree');
});

it.each(content.events.filter(e => e.when.careerEdition))('resolves both $id punchlines in the random event pool', ev => {
  const s = { ...newGame(seed, 'phone_tech', content), day: 5 };
  expect(isEventEligible(s, content, ev)).toBe(true);
  expect(isEventEligible({ ...s, seed: classic }, content, ev)).toBe(false);
  expect(isEventEligible({ ...s, seenEvents: [ev.id] }, content, ev)).toBe(false);
  for (const choiceIdx of [0, 1]) {
    const next = step({ ...s, phase: 'event', pendingEvents: [ev.id] }, { t: 'eventChoice', choiceIdx }, content);
    expect(next.lastResults[0]?.textKey).toBe(ev.id + ':' + choiceIdx + ':0');
    expect(next.fame > s.fame || next.karma > s.karma).toBe(true);
    if (ev.id === 'soi_rice') {
      expect(pickEnding(next, content, 'retired')).toBe(choiceIdx === 0 ? 'retire_kitchen' : 'retire_repair');
    }
  }
});
