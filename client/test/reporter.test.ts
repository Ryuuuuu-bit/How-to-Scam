import { expect, it } from 'vitest';
import { newGame, priceOf, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import { dailyArticles } from '../src/game/newspaper';
import { isEventEligible, rollDailyEvents } from '../../shared/src/engine/events';
import { Rng } from '../../shared/src/engine/rng';

it.each([0, 1])('plays the counter once and records camera choice %i', choiceIdx => {
  const s = step(newGame('v3:soi:live:test', 'ex_insurance', content),
    { t: 'choosePlan', methodId: 'fake_shop' }, content);
  const rng = new Rng(s.rng);
  rollDailyEvents(s, content, rng);
  expect(s.pendingEvents[0]).toBe('counter_live');
  const next = step({ ...s, phase: 'event' }, { t: 'eventChoice', choiceIdx }, content);
  expect(next.dirtyCash - s.dirtyCash).toBe(choiceIdx ? 0 : 500);
  expect(next.fame - s.fame).toBe(choiceIdx ? 4 : 0);
  expect(dailyArticles({ ...next, day: 2 }, content)).not.toHaveLength(0);
  next.pendingEvents = [];
  rollDailyEvents(next, content, rng);
  expect(next.pendingEvents).not.toContain('counter_live');
  const event = content.events.find(e => e.id === 'counter_live');
  if (!event) throw Error('missing live event');
  expect(isEventEligible({ ...s, seed: 'v3:soi:older', pendingEvents: [], seenEvents: [] }, content, event)).toBe(false);
});

it.each(['lift', 'stay'] as const)('prints the matching live-sale ending for %s', (ending) => {
  const event = content.events.find(e => e.id === 'cf_orange_cat');
  if (!event) throw Error('missing cat event');
  const planned = step(newGame('v3:soi:test', 'live_seller', content), { t: 'choosePlan', methodId: 'fake_shop' }, content);
  expect(isEventEligible(planned, content, event)).toBe(true);
  expect(isEventEligible({ ...planned, seed: 'v3:older' }, content, event)).toBe(false);
  expect(isEventEligible({ ...planned, todayMethodId: null }, content, event)).toBe(false);
  const next = step({ ...planned, phase: 'event', pendingEvents: [event.id] },
    { t: 'eventChoice', choiceIdx: event.choices.findIndex(c => c.liveCat === ending) }, content);
  expect(dailyArticles(next, content)).toEqual([]);
  const [article] = dailyArticles({ ...next, day: 2 }, content);
  if (!article) throw Error('missing daily article');
  expect(article.headline).toContain(ending === 'stay' ? 'จำไม่ได้' : 'ออกตาม');
  expect(article.events.join(' ')).toContain('กลุ่มเตือนภัย');
});

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
