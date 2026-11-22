import { expect, it } from 'vitest';
import { newGame, newsScout, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import { planEstimate, scoutHint } from '../src/game/plannerPreview';

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
