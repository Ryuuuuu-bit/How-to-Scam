import { expect, it } from 'vitest';
import { newGame, step, isEventEligible } from '../src';
import { content } from '../data';

it('remembers named recruits and applies each work perk once', () => {
  let s = newGame('staff', 'ex_insurance', content);
  s.dirtyCash = 20000;
  s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
  const natStory = content.events.find((e) => e.id === 'nat_receipt');
  if (!natStory) throw Error('missing story');
  expect(isEventEligible(s, content, natStory)).toBe(false);
  for (const itemId of ['intern_nat', 'host_tuk']) s = step(s, { t: 'invest', itemId }, content);
  expect(isEventEligible(s, content, natStory)).toBe(true);
  expect(s.history[0]?.recruits).toEqual(['intern_nat', 'host_tuk']);
  expect(() => step(s, { t: 'invest', itemId: 'host_tuk' }, content)).toThrow();
  const base = { ...s, henchmen: s.henchmen.filter((h) => h.recruit !== 'host_tuk') };
  const without = step(base, { t: 'confirmInvest' }, content);
  const result = step(s, { t: 'confirmInvest' }, content);
  expect(result.fame).toBe(without.fame + 2);
  expect(result.henchmen[0]?.skill).toBe(6);
});
