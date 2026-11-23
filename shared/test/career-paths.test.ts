import { expect, it } from 'vitest';
import { content } from '../data';
import { campaignSeed, careerAffinities, careerDecisions, careerFee, careerSignatures, careerStatus, careerTracks, durations, heatBonusPct, incomeBonusPct, minimumJobCost, newGame, replay, step, type Action } from '../src';
import { soiAction, botAction } from './helpers';

it('gives all jobs two authored routes and every starting character an aptitude', () => {
  const jobs = content.methods.map(m => m.id).sort();
  expect(Object.keys(careerTracks).sort()).toEqual(jobs);
  expect(Object.keys(careerDecisions).sort()).toEqual(jobs);
  expect(Object.keys(careerAffinities).sort()).toEqual(content.characters.map(ch => ch.id).sort());
  for (const ch of content.characters) {
    const s = newGame('coverage', ch.id, content);
    for (const id of jobs) {
      expect(careerStatus(s, id).needed).toBe(careerAffinities[ch.id]?.method === id ? 2 : 3);
    }
  }
});

it.each(content.characters)('applies the signature of $id once across different tracks', ch => {
  const s = newGame('signature', ch.id, content);
  s.day = 4;
  s.heat = 20;
  s.careers = { cat_dub: {branch: 'face', since: 1}, romance: {branch: 'boss', since: 1} };
  const log = step(s, {t:'choosePlan', methodId:'cat_dub'}, content).history[0];
  const talent = careerSignatures[ch.id];
  if (!log || !talent) throw Error(ch.id);
  s.history.push({ ...log, day: 1 }, { ...log, day: 2, methodId: 'romance' });
  const action = { t: 'careerDecision', methodId: 'cat_dub', choice: 'talent' } as const;
  const after = step(s, action, content);
  expect(after.fame - s.fame).toBe(talent.fame);
  expect(after.heat - s.heat).toBe(talent.heat);
  expect(after.dirtyCash - s.dirtyCash).toBe(talent.cash);
  expect(() => step(after, { ...action, methodId: 'romance' }, content)).toThrow();
});

it.each(content.methods)('resolves both branches of $id and pays its finale once', method => {
  for (const branch of ['face', 'boss'] as const) {
    const start = newGame('route', 'live_seller', content);
    const spec: Action = { t: 'specialize', methodId: method.id, branch };
    expect(() => step(start, spec, content)).toThrow();
    const dayLog = step(start, { t: 'choosePlan', methodId: 'fake_shop' }, content).history[0];
    if (!dayLog) throw Error('Missing workday');
    start.history = [1, 2, 3].map(day => ({ ...dayLog, day, methodId: method.id }));
    start.day = 4;
    const s = step(start, spec, content);
    expect(() => step(s, spec, content)).toThrow();
    expect(heatBonusPct(s, content, method.id) - heatBonusPct(start, content, method.id)).toBe(branch === 'boss' ? -10 : 10);
    if (branch === 'face') expect(incomeBonusPct(s, content, method.id) - incomeBonusPct(start, content, method.id)).toBe(15);
    const decision: Action = { t: 'careerDecision', methodId: method.id, choice: branch === 'face' ? 'patron' : 'local' };
    expect(() => step(s, decision, content)).toThrow();
    s.history.push(...[4, 5, 6].map(day => ({ ...dayLog, day, methodId: method.id })));
    s.day = 7;
    const decided = step(s, decision, content);
    expect(() => step(decided, decision, content)).toThrow();
    const finale: Action = { t: 'careerFinale', methodId: method.id, choice: 'fee' };
    const done = step(decided, finale, content);
    expect(done.dirtyCash - decided.dirtyCash).toBe(careerFee(content, method.id));
    expect(() => step(done, finale, content)).toThrow();
  }
});

it.each(durations)('replays the entire career action log in a %i-day game', days => {
  const seed = campaignSeed(days, 'first-album');
  const id = 'cat_dub';
  let s = newGame(seed, 'orange_cat', content);
  const actions: Action[] = [];
  while (s.phase !== 'ended' && actions.length < 1500) {
    let action: Action;
    const status = careerStatus(s, id);
    const soi = soiAction(s);
    if (s.phase !== 'plan') action = botAction(s);
    else if (soi) action = soi;
    else if (status.finale) action = { t: 'retire' };
    else if (status.branch && status.commissions >= 3) action = { t: 'careerFinale', methodId: id, choice: 'credit' };
    else if (status.branch && status.commissions >= 1 && !s.careers?.[id]?.decision) action = { t: 'careerDecision', methodId: id, choice: 'local' };
    else if (!status.branch && status.shifts >= status.needed) action = { t: 'specialize', methodId: id, branch: 'boss' };
    else action = { t: 'choosePlan', methodId: id };
    actions.push(action);
    s = step(s, action, content);
  }
  expect(s.careers?.[id]?.finale).toBe('credit');
  expect(s.phase).toBe('ended');
  expect(replay(seed, 'orange_cat', actions, content)).toEqual(s);
});

it.each(content.characters)('guarantees working capital after wages for $id', ch => {
  const s = newGame('market', ch.id, content);
  expect(() => step(s, { t: 'relief', job: 'mascot' }, content)).toThrow();
  s.dirtyCash = 0;
  s.cleanCash = 0;
  s.henchmen.push({ id: 'worker', loyalty: 90, skill: 1, wage: 200 });
  const next = step(s, { t: 'relief', job: 'mascot' }, content);
  expect(next.day).toBe(2);
  expect(next.phase).toBe('plan');
  expect(next.dirtyCash).toBe(minimumJobCost(next, content));
  expect(next.henchmen).toHaveLength(1);
});

it('reserves the promised shift, honours the final day and handles stage exposure', () => {
  const s = newGame('advance', 'orange_cat', content);
  s.dirtyCash = 1;
  const advance = step(s, { t: 'relief', job: 'advance' }, content);
  expect(advance.favorDay).toBe(3);
  expect(advance.day).toBe(1);
  expect(() => step(advance, { t: 'relief', job: 'advance' }, content)).toThrow();
  advance.day = 3;
  expect(() => step(advance, { t: 'choosePlan', methodId: null }, content)).toThrow();
  const paid = step(advance, { t: 'relief', job: 'favor' }, content);
  expect(paid.day).toBe(4);
  expect(paid.favorDay).toBeUndefined();
  s.day = s.maxDays;
  expect(() => step(s, { t: 'relief', job: 'advance' }, content)).toThrow();
  expect(step(s, { t: 'relief', job: 'mascot' }, content).end?.reason).toBe('survived');
  s.heat = 98;
  expect(step(s, { t: 'relief', job: 'stage' }, content).phase).toBe('escape');
});
