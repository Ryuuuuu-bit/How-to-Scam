import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  burnCost,
  campaignSeed,
  caseStrength,
  durations,
  heatBonusPct,
  incomeBonusPct,
  isLivingSoi,
  newGame,
  questSeedPrefix,
  raidThreshold,
  replay,
  shapeAfterShifts,
  step,
  type Action,
  type GameState,
} from '../src';
import { botAction, soiAction } from './helpers';

function need<T>(x: T | undefined): T {
  if (x === undefined) throw new Error('missing');
  return x;
}
const v1 = (days: (typeof durations)[number] = 30, nonce = 'soi') => campaignSeed(days, nonce);
const legacy = questSeedPrefix + 'campaign1:30:old-run';

function work(s: GameState, methodId: string | null): GameState {
  let next = step(s, { t: 'choosePlan', methodId }, content);
  next = step(next, { t: 'confirmInvest' }, content);
  while (next.phase !== 'plan' && next.phase !== 'ended' && next.phase !== 'escape') next = step(next, botAction(next), content);
  return next;
}

describe('1.0 living soi', () => {
  it('only new campaign seeds open the soi and the case board', () => {
    expect(isLivingSoi(v1())).toBe(true);
    expect(isLivingSoi(legacy)).toBe(false);
    expect(newGame(legacy, 'ex_insurance', content).soi).toBeUndefined();
    const s = newGame(v1(), 'ex_insurance', content);
    expect(s.soi?.places.market.visits).toBe(0);
    expect(s.case?.evidence).toEqual([]);
  });

  it('keeps saved pre-1.0 campaigns on their original rules', () => {
    let s = newGame(legacy, 'ex_insurance', content);
    const actions: Action[] = [];
    expect(() => step(s, { t: 'caseMove', kind: 'decoy' }, content)).toThrow();
    expect(() => step(s, { t: 'appointment', npc: 'jae' }, content)).toThrow();
    while (s.phase !== 'ended' && actions.length < 3000) {
      const action = botAction(s);
      actions.push(action);
      s = step(s, action, content);
    }
    expect(s.soi).toBeUndefined();
    expect(s.history.some(h => h.evidence || h.raid)).toBe(false);
    expect(replay(legacy, 'ex_insurance', actions, content)).toEqual(s);
  });

  it('asks the player to shape a place after repeated shifts and applies its bonus', () => {
    let s = newGame(v1(30, 'shape'), 'live_seller', content);
    for (let i = 0; i < shapeAfterShifts && !s.soi?.pendingShape; i++) {
      s.heat = 0;
      s.dirtyCash = Math.max(s.dirtyCash, 5_000);
      if (s.soi?.appointment?.day === s.day) s = step(s, { t: 'appointment', npc: s.soi.appointment.npcs[0] }, content);
      s = work(s, 'mystery_stall');
    }
    expect(s.soi?.pendingShape).toBe('market');
    expect(() => step(s, { t: 'choosePlan', methodId: null }, content)).toThrow(/neighbourhood/);
    const baseIncome = incomeBonusPct(s, content, 'mystery_stall');
    const baseHeat = heatBonusPct(s, content, 'fake_shop');
    const shaped = step(s, { t: 'shapePlace', place: 'market', form: 'patron' }, content);
    expect(shaped.soi?.places.market.form).toBe('patron');
    expect(shaped.dirtyCash).toBe(s.dirtyCash + 600);
    expect(incomeBonusPct(shaped, content, 'mystery_stall')).toBe(baseIncome + 20);
    expect(heatBonusPct(shaped, content, 'fake_shop')).toBe(baseHeat + 10);
    expect(() => step(shaped, { t: 'shapePlace', place: 'market', form: 'local' }, content)).toThrow();
  });

  it('turns a neighbour into a witness when the player keeps upsetting them', () => {
    const s = newGame(v1(30, 'witness'), 'ex_insurance', content);
    need(s.soi).appointment = { day: 1, npcs: ['jae', 'hia'] };
    need(s.soi).rep.hia = -1;
    const next = step(s, { t: 'appointment', npc: 'jae' }, content);
    expect(next.soi?.rep.jae).toBe(1);
    expect(next.soi?.rep.hia).toBe(-2);
    expect(next.case?.evidence.some(e => e.kind === 'witness')).toBe(true);
    expect(next.dirtyCash).toBe(s.dirtyCash + 300);
    expect(() => step(next, { t: 'appointment', npc: 'jae' }, content)).toThrow();
  });

  it('raids when evidence reaches the threshold, and a decoy wastes the raid', () => {
    // กติกาบุกค้นของรุ่น 1.0 เดิม (น้ำหนัก 7) — โหมดเล่นสบายทดสอบใน casual.test.ts
    const s = newGame(campaignSeed(30, 'raid', false), 'ex_insurance', content);
    need(s.case).evidence = [
      { id: 1, kind: 'sting', weight: 3, day: 1 },
      { id: 2, kind: 'crash', weight: 2, day: 1 },
      { id: 3, kind: 'shift', weight: 2, day: 1 },
    ];
    need(s.case).nextId = 4;
    s.dirtyCash = 10_000;
    expect(caseStrength(s)).toBe(raidThreshold(s));
    const raided = work(s, null);
    expect(raided.case?.raids).toBe(1);
    expect(raided.dirtyCash).toBeLessThan(10_000);
    expect(caseStrength(raided)).toBeLessThan(8);
    expect(raided.history.at(-1)?.raid).toBe('raid');

    const decoyed = step(s, { t: 'caseMove', kind: 'decoy' }, content);
    expect(() => step(decoyed, { t: 'caseMove', kind: 'decoy' }, content)).toThrow(/per day/);
    const fooled = work(decoyed, null);
    expect(fooled.case?.raids).toBe(0);
    expect(fooled.history.at(-1)?.raid).toBe('decoy');
    expect(fooled.fame).toBe(decoyed.fame + 2);
  });

  it('burns evidence for money and feeds the inspector a rival gang', () => {
    const s = newGame(v1(30, 'burn'), 'ex_insurance', content);
    need(s.case).evidence = [{ id: 1, kind: 'sting', weight: 3, day: 1 }, { id: 2, kind: 'shift', weight: 2, day: 1 }];
    s.dirtyCash = 2_000;
    const burned = step(s, { t: 'caseMove', kind: 'burn', evidenceId: 1 }, content);
    expect(burned.dirtyCash).toBe(2_000 - burnCost(s, 3));
    expect(caseStrength(burned)).toBe(2);
    expect(() => step(s, { t: 'caseMove', kind: 'tipoff' }, content)).toThrow(/famous/);
    s.fame = 12;
    s.heat = 30;
    const tipped = step(s, { t: 'caseMove', kind: 'tipoff' }, content);
    expect(caseStrength(tipped)).toBe(2);
    expect(tipped.heat).toBe(20);
    expect(tipped.flags).toContain('fed_the_inspector');
  });

  it('reaches the new endings', () => {
    const s = newGame(v1(30, 'endings'), 'ex_insurance', content);
    need(s.case).peak = 9;
    s.day = s.maxDays;
    const cold = step(s, { t: 'retire' }, content);
    expect(cold.end?.endingId).toBe('case_cold');
    for (const p of Object.values(need(s.soi).places)) p.form = 'local';
    s.flags.push('soi_for_all');
    expect(step(s, { t: 'retire' }, content).end?.endingId).toBe('soi_for_all');
  });

  it.each(durations)('plays and replays a full %i-day living soi run', days => {
    const seed = v1(days, 'full');
    let s = newGame(seed, 'phone_tech', content);
    const actions: Action[] = [];
    while (s.phase !== 'ended' && actions.length < 4000) {
      let action = soiAction(s) ?? botAction(s);
      if (s.phase === 'plan' && action.t === 'choosePlan' && s.case && s.case.actedDay !== s.day) {
        const top = s.case.evidence.find(e => e.kind !== 'decoy');
        if (top && s.dirtyCash > burnCost(s, top.weight) + 3_000) action = { t: 'caseMove', kind: 'burn', evidenceId: top.id };
      }
      actions.push(action);
      s = step(s, action, content);
    }
    expect(s.phase).toBe('ended');
    expect(Object.values(s.soi?.places ?? {}).some(p => p.visits > 0)).toBe(true);
    expect(replay(seed, 'phone_tech', actions, content)).toEqual(s);
  });
});
