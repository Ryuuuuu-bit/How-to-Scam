import { expect, it } from 'vitest';
import { content } from '../data';
import {
  choiceAvailable, newGame, openingFor, originFor, originSeedPrefix, originStage, replay, step,
  type Action, type GameState,
} from '../src';

const character = 'ex_insurance';
const examples = [['curry', 4], ['arcade', 2], ['dorm', 1]] as const;

function quietDay(s: GameState): Action {
  switch (s.phase) {
    case 'plan': return { t: 'choosePlan', methodId: null };
    case 'invest': return { t: 'confirmInvest' };
    case 'event': {
      const event = content.events.find(e => e.id === s.pendingEvents[0]);
      if (!event) throw new Error('Missing pending event for the test day');
      return { t: 'eventChoice', choiceIdx: event.choices.findIndex(c => choiceAvailable(s, c.requires)) };
    }
    case 'launder': return { t: 'launder', cardId: null };
    case 'shop': return { t: 'endDay' };
    default: throw new Error('Unexpected phase on quiet day: ' + s.phase);
  }
}

for (const [origin, example] of examples) {
  it.each(['help', 'later'] as const)(origin + ' remembers %s and grants its reward once', reply => {
    const seed = originSeedPrefix + 'preview-' + example;
    const actions: Action[] = [];
    let s = newGame(seed, character, content);
    function act(action: Action) {
      s = step(s, action, content);
      actions.push(action);
    }
    expect(originFor(seed)).toBe(origin);
    expect(openingFor(seed, character)).toBeNull();
    expect(originStage(s)).toBe('opening');
    const initialRng = s.rng;
    act({ t: 'replyOrigin', reply });
    expect(s.rng).toBe(initialRng);
    expect(() => step(s, { t: 'replyOrigin', reply }, content)).toThrow();
    while (s.day < 3 && actions.length < 30) {
      expect(originStage(s)).toBeNull();
      expect(() => step(s, { t: 'readOrigin' }, content)).toThrow();
      act(quietDay(s));
    }
    expect(s.day).toBe(3);
    expect(originStage(s)).toBe('followup');
    expect(originStage({ ...s, phase: 'escape' })).toBeNull();
    expect(originStage({ ...s, day: 4 })).toBe('followup');
    const before = s;
    act({ t: 'readOrigin' });
    expect(s.fame - before.fame).toBe(reply === 'help' ? 3 : 0);
    expect(s.cleanCash - before.cleanCash).toBe(reply === 'later' ? 150 : 0);
    expect(s.rng).toBe(before.rng);
    expect(s.originStory).toEqual({ reply, followedUpOn: 3 });
    expect(() => step(s, { t: 'readOrigin' }, content)).toThrow();
    act({ t: 'retire' });
    expect(replay(seed, character, JSON.parse(JSON.stringify(actions)), content)).toEqual(s);
  });
}

it.each(['v3:soi:live:old', 'daily:2026-11-22', originSeedPrefix + 'preview-0'])(
  'keeps classic and daily runs playable with seed %s', seed => {
    const s = newGame(seed, character, content);
    expect(originStage(s)).toBeNull();
    expect(() => step(s, { t: 'replyOrigin', reply: 'later' }, content)).toThrow();
    expect(step(s, quietDay(s), content).phase).toBe('invest');
  },
);
