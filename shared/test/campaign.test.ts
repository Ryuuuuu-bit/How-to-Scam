import { expect, it } from 'vitest';
import { content } from '../data';
import { campaignSeed, choiceAvailable, durations, newGame, replay, step, type Action } from '../src';
import { botAction } from './helpers';
import { Rng } from '../src/engine/rng';

it.each(durations)('finishes and replays a %i-day campaign with its own story chapters', days => {
  const seed = campaignSeed(days, 'quiet-campaign');
  const character = 'ex_insurance';
  let state = newGame(seed, character, content);
  const actions: Action[] = [];
  while (state.phase !== 'ended' && actions.length < 3000) {
    const action = state.phase === 'plan' ? { t: 'choosePlan' as const, methodId: null } : botAction(state);
    actions.push(action);
    state = step(state, action, content);
  }
  expect(state.end?.reason).toBe('survived');
  expect(state.day).toBe(days);
  expect(state.seenEvents).toContain('life_turn_24');
  expect(state.seenEvents.includes('life_turn_52')).toBe(days >= 60);
  expect(state.seenEvents.includes('life_turn_84')).toBe(days === 90);
  expect(replay(seed, character, actions, content)).toEqual(state);
});

it('exposes each campaign scene through a playable root or a scheduled choice', () => {
  for (const [i, days] of durations.entries()) {
    const scenes = content.events.filter(e => e.lifeStory && (e.when.day?.[0] ?? 1) <= days);
    const reachable = new Set(scenes.filter(e => !e.chainOnly).map(e => e.id));
    for (const id of reachable) {
      const scene = scenes.find(e => e.id === id)!;
      for (const choice of scene.choices) for (const outcome of choice.outcomes)
        for (const effect of outcome.effects) if (effect.kind === 'schedule') reachable.add(effect.eventId);
    }
    expect(reachable.size).toBe([322, 364, 406][i]);
    expect(reachable.size).toBe(scenes.length);
  }
  const room = content.events.find(e => e.id === 'life_turn_24')!;
  const player = newGame(campaignSeed(60, 'room'), 'ex_insurance', content);
  expect(room.choices.filter(c => choiceAvailable(player, c.requires))).toHaveLength(2);
  player.flags.push('life_lodger');
  expect(room.choices.filter(c => choiceAvailable(player, c.requires))).toHaveLength(3);
});

it('plays every new scene across seeded runs with different life choices', () => {
  const catalog = new Map(content.events.map(ev => [ev.id, ev]));
  const reached = new Set<string>();
  for (let i = 0; i < 600 && reached.size < 406; i++) {
    const rng = new Rng(i + 1);
    const seed = campaignSeed(durations[i % 3]!, 'coverage-' + i);
    let s = newGame(seed, content.characters[i % content.characters.length]!.id, content);
    while (s.phase !== 'ended') {
      let action: Action;
      if (s.phase === 'plan') action = { t: 'choosePlan', methodId: null };
      else if (s.phase === 'event') {
        const ev = catalog.get(s.pendingEvents[0]!)!;
        if (ev.lifeStory) reached.add(ev.id);
        const indices = ev.choices.flatMap((c, index) => choiceAvailable(s, c.requires) ? [index] : []);
        action = { t: 'eventChoice', choiceIdx: rng.pick(indices) };
      } else action = botAction(s);
      s = step(s, action, content);
    }
  }
  expect(reached.size).toBe(406);
}, 60_000);
