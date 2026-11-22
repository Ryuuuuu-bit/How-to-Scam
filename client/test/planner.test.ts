import { expect, it } from 'vitest';
import { newGame, newsScout, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import { itemEffect, planEstimate, scoutHint } from '../src/game/plannerPreview';

it.each([
  ['soi_football', 'scoreboard', 'soi_derby'],
  ['mystery_stall', 'display_rack', 'soi_unboxing'],
  ['cat_dub', 'studio_mic', 'soi_cat_voice'],
])('plays the first shift at %s with its matching equipment and both choices', (job, gear, event) => {
  const start = newGame('planner-practice', 'phone_tech', content);
  const method = content.methods.find(m => m.id === job);
  if (!method) throw Error('missing job ' + job);
  const quoted = planEstimate(start, method, { [gear]: 1 });
  const planned = step(start, { t: 'choosePlan', methodId: job }, content);
  const equipped = step(planned, { t: 'invest', itemId: gear }, content);
  const worked = step(equipped, { t: 'confirmInvest' }, content);
  const result = worked.lastResults.find(r => r.kind === 'resolve');
  if (!result) throw Error('missing payout');
  const paid = method.cleanIncome ? result.cleanCash : result.dirtyCash;
  if (paid === undefined) throw Error('incorrect wallet');
  expect(paid).toBeGreaterThanOrEqual(quoted.income[0]);
  expect(paid).toBeLessThanOrEqual(quoted.income[1]);
  expect(worked.dirtyCash + worked.cleanCash).toBe(equipped.dirtyCash + equipped.cleanCash - method.cost + paid);
  expect(worked.pendingEvents[0]).toBe(event);
  for (const choiceIdx of [0, 1]) {
    const after = step(worked, { t: 'eventChoice', choiceIdx }, content);
    expect(after.history.at(-1)?.events).toContain(event);
  }
  const repeat = step({ ...equipped, seenEvents: [event] }, { t: 'confirmInvest' }, content);
  expect(repeat.pendingEvents).not.toContain(event);
});

it('shows both sides of the quieter shift and keeps supplies job-specific', () => {
  const item = content.shopItems.find(i => i.id === 'soft_launch');
  if (!item) throw Error('missing supply');
  expect(itemEffect(item)).toContain('รายได้ −8%');
  expect(itemEffect(item)).toContain('−35%');
  const start = newGame('planner-practice', 'phone_tech', content);
  const job = content.methods.find(m => m.id === 'soi_football');
  if (!job) throw Error('missing football job');
  const baseline = planEstimate(start, job, {});
  const quiet = planEstimate(start, job, { soft_launch: 1 });
  expect(quiet.income[1]).toBeLessThan(baseline.income[1]);
  expect(quiet.heat[1]).toBeLessThan(baseline.heat[1]);
  expect(planEstimate(start, job, { studio_mic: 1 })).toEqual(baseline);
});

it('updates both ends of the estimate for each ad and uses a range for new recruits', () => {
  const s = newGame('preview', 'ex_insurance', content);
  s.news = null;
  s.modifiers = [];
  const method = content.methods.find((m) => m.id === 'fake_shop');
  if (!method) throw Error('missing method');
  const base = planEstimate(s, method, {});
  expect(planEstimate(s, method, { ads: 2, henchman: 1 }).income).toEqual([
    Math.round(base.income[0] * 1.35),
    Math.round(base.income[1] * 1.45),
  ]);
});

it('charges once per planning day and keeps forecasts separate from the run', () => {
  const s = newGame('report', 'ex_insurance', content);
  expect(() => step(s, { t: 'scoutNews' }, content)).toThrow();
  s.day = 2;
  s.dirtyCash = 5000;
  const paid = step(s, { t: 'scoutNews' }, content);
  expect(paid.dirtyCash).toBe(5000 - newsScout.price);
  expect(() => step(paid, { t: 'scoutNews' }, content)).toThrow();
  const before = structuredClone(paid);
  expect(scoutHint(paid, 'fake_shop', ['ads'])).toBe(scoutHint(paid, 'fake_shop', ['ads']));
  expect(paid).toEqual(before);
  expect(() => step({ ...s, dirtyCash: 0, cleanCash: 0 }, { t: 'scoutNews' }, content)).toThrow();
});
