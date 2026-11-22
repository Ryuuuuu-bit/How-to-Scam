import { expect, it } from 'vitest';
import { newGame, priceOf, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import { dailyArticles } from '../src/game/newspaper';

it.each(['cat', 'henchman'] as const)('prints the %s interview the next morning', (subject) => {
  const s = step(
    newGame('paper', 'ex_insurance', content),
    { t: 'choosePlan', methodId: 'fake_shop' },
    content,
  );
  s.henchmen = [{ id: 'h1', skill: 8, loyalty: 70, wage: 500 }];
  s.phase = 'event';
  s.pendingEvents = ['reporter_aunt'];
  s.heat = 20;
  const event = content.events.find((e) => e.id === 'reporter_aunt');
  const choiceIdx = event?.choices.findIndex((c) => c.interview === subject) ?? -1;
  const resolved = step(s, { t: 'eventChoice', choiceIdx }, content);
  expect(resolved.heat - s.heat).toBe(subject === 'cat' ? -3 : 8);
  expect(resolved.fame - s.fame).toBe(subject === 'cat' ? 4 : 12);
  expect(dailyArticles(resolved, content)).toHaveLength(0);
  expect(dailyArticles({ ...resolved, day: 2 }, content)[0]?.headline).toContain(
    subject === 'cat' ? 'งับไมค์' : 'บริษัททำอะไร',
  );
});

it('records actual repeatable costs including discounts but excluding permanent hires', () => {
  let s = newGame('cost', 'phone_tech', content);
  s.dirtyCash = 10000;
  s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
  const before = s.history[0]?.repeatableCost ?? 0;
  const price = priceOf(s, content, 'sim_pack', 300);
  for (const itemId of ['sim_pack', 'henchman']) s = step(s, { t: 'invest', itemId }, content);
  expect(s.history[0]?.repeatableCost).toBe(before + price);
});
