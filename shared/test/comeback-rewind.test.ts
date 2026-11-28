import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  apprenticeOf,
  campaignSeed,
  canRewind,
  choiceAvailable,
  comebackRules,
  comebackSeed,
  computeScore,
  generationOf,
  heirFrom,
  isLivingSoi,
  newGame,
  playLog,
  replay,
  replayWithCards,
  riskRules,
  riskSeed,
  runStats,
  seedWithApprentice,
  seedWithLoadout,
  step,
  weekLedger,
  type Action,
  type GameState,
} from '../src';
import { activeReturn } from '../src/engine/comeback';
import { addRun, cleanCareer, emptyCareer, mergeCareer, spendHeir } from '../src/engine/collection';
import { InvalidActionError } from '../src/engine/errors';
import { botAction, soiAction } from './helpers';

/** บอทที่หลอกงานเงินสกปรกทุกวันเท่าที่ทำได้ เพื่อให้เหยื่อกลับมาบ่อย */
function scammer(s: GameState): Action {
  const soi = soiAction(s);
  if (soi) return soi;
  if (s.phase === 'plan' && s.heat < 80 && s.dirtyCash + s.cleanCash >= 500)
    return { t: 'choosePlan', methodId: 'fake_shop' };
  if (s.phase === 'event') {
    const ev = content.events.find((e) => e.id === s.pendingEvents[0]);
    const idx = ev?.choices.findIndex((ch) => choiceAvailable(s, ch.requires)) ?? 0;
    return { t: 'eventChoice', choiceIdx: Math.max(0, idx) };
  }
  return botAction(s);
}

function play(seed: string, bot = scammer, character = 'ex_insurance') {
  let s = newGame(seed, character, content);
  const actions: Action[] = [];
  while (s.phase !== 'ended' && actions.length < 4000) {
    const a = bot(s);
    actions.push(a);
    s = step(s, a, content);
  }
  return { s, actions };
}

describe('version 1.2 seeds', () => {
  it('stack on top of 1.1 and the living soi', () => {
    const seed = comebackSeed(30, 'x');
    expect(comebackRules(seed)).toBe(true);
    expect(riskRules(seed)).toBe(true);
    expect(isLivingSoi(seed)).toBe(true);
    expect(comebackRules(riskSeed(30, 'x'))).toBe(false);
    expect(comebackRules(campaignSeed(30, 'x'))).toBe(false);
  });
});

describe('victims come back', () => {
  it('never schedules returns under the older rules', () => {
    const { s } = play(riskSeed(30, 'old-rules'));
    expect(s.returns ?? []).toHaveLength(0);
    expect(s.seenEvents.some((e) => e.startsWith('victim_'))).toBe(false);
  });

  it('brings victims back 2-5 days later, at most two pending, and settles each one', () => {
    let returned = 0;
    for (let i = 0; i < 12; i++) {
      let s = newGame(comebackSeed(30, 'back-' + i), 'ex_insurance', content);
      while (s.phase !== 'ended') {
        const r = activeReturn(s);
        if (r) {
          expect(r.day - r.from).toBeGreaterThanOrEqual(2);
          expect(r.day - r.from).toBeLessThanOrEqual(5);
          returned++;
        }
        expect((s.returns ?? []).length).toBeLessThanOrEqual(2);
        s = step(s, scammer(s), content);
      }
    }
    expect(returned).toBeGreaterThan(3);
  });

  it('turns ignoring a police report into case evidence, and refunds take money', () => {
    const s = newGame(comebackSeed(30, 'report'), 'ex_insurance', content);
    s.phase = 'event';
    s.dirtyCash = 10_000;
    s.returns = [{ eventId: 'victim_report', methodId: 'fake_shop', from: 1, day: 1, take: 4_000 }];
    s.pendingEvents = ['victim_report'];
    s.history.push({
      day: 1,
      methodId: 'fake_shop',
      income: 0,
      heatGained: 0,
      events: [],
      launderCardId: null,
      launderSuccess: null,
      laundered: 0,
    });
    const refunded = step(s, { t: 'eventChoice', choiceIdx: 0 }, content);
    expect(refunded.dirtyCash).toBe(8_000);
    expect(refunded.returns).toHaveLength(0);
    const ignored = step(s, { t: 'eventChoice', choiceIdx: 1 }, content);
    expect(ignored.returns).toHaveLength(0);
    const evidence = ignored.case?.evidence.filter((e) => e.kind === 'victim') ?? [];
    expect(evidence.length).toBeLessThanOrEqual(1);
  });

  it('lets a warning group cut income for the job that hurt them', () => {
    const s = newGame(comebackSeed(30, 'warn'), 'ex_insurance', content);
    s.phase = 'event';
    s.returns = [
      { eventId: 'victim_warning', methodId: 'mystery_stall', from: 1, day: 1, take: 2_000 },
    ];
    s.pendingEvents = ['victim_warning'];
    const after = step(s, { t: 'eventChoice', choiceIdx: 1 }, content);
    expect(after.modifiers).toContainEqual({
      target: 'income',
      methodId: 'mystery_stall',
      pct: -40,
      daysLeft: 5,
    });
  });
});

describe('rewind one day', () => {
  const seed = comebackSeed(30, 'rewind');

  it('puts the run back at the start of the day, once per run', () => {
    const { actions } = play(seed);
    const half = actions.slice(0, 60);
    const mid = replay(seed, 'ex_insurance', half, content);
    expect(canRewind(mid, half)).toBe(true);
    const back = replay(seed, 'ex_insurance', [...half, { t: 'rewindDay' }], content);
    expect(back.rewinds).toBe(1);
    expect(back.phase).toBe('plan');
    expect(back.day === mid.day || back.day === mid.day - 1).toBe(true);
    expect(canRewind(back, [...half, { t: 'rewindDay' }])).toBe(false);
    expect(() =>
      replay(seed, 'ex_insurance', [...half, { t: 'rewindDay' }, { t: 'rewindDay' }], content),
    ).toThrow(InvalidActionError);
  });

  it('replays the same way on the server, and costs 10% of the style multiplier', () => {
    const { actions } = play(seed);
    const cut = actions.findIndex(
      (_, i) => replay(seed, 'ex_insurance', actions.slice(0, i), content).day === 4,
    );
    const log: Action[] = [...actions.slice(0, cut + 5), { t: 'rewindDay' }];
    let s = replay(seed, 'ex_insurance', log, content);
    while (s.phase !== 'ended') {
      const a = scammer(s);
      log.push(a);
      s = step(s, a, content);
    }
    expect(s.rewinds).toBe(1);
    expect(replayWithCards(seed, 'ex_insurance', log, content).state).toEqual(s);
    const plain = { ...s, rewinds: 0 };
    if (s.end)
      expect(computeScore(s, content, s.end.reason)).toBeLessThan(
        computeScore(plain, content, s.end.reason) + 1,
      );
  });

  it('cannot rewind a finished run or an empty log', () => {
    const { s, actions } = play(seed);
    expect(canRewind(s, actions)).toBe(false);
    expect(() => playLog(seed, 'ex_insurance', [{ t: 'rewindDay' }], content)).toThrow(
      InvalidActionError,
    );
  });
});

describe('weekly ledger', () => {
  it('adds up every baht that moved during the week', () => {
    const { actions } = play(comebackSeed(30, 'ledger'));
    let s = newGame(comebackSeed(30, 'ledger'), 'ex_insurance', content);
    let i = 0;
    while (s.day < 8 && s.phase !== 'ended') s = step(s, actions[i++] as Action, content);
    const start = newGame(comebackSeed(30, 'ledger'), 'ex_insurance', content);
    const w = weekLedger(s, 1);
    expect(w.fromDay).toBe(1);
    expect(w.toDay).toBe(7);
    expect(w.flow.job).toBeGreaterThan(0);
    const today = s.history
      .filter((h) => h.day === 8)
      .reduce((n, h) => n + Object.values(h.flow ?? {}).reduce((a, b) => a + (b ?? 0), 0), 0);
    expect(start.dirtyCash + start.cleanCash + w.net + today).toBe(s.dirtyCash + s.cleanCash);
  });
});

describe('apprentice', () => {
  it('reads the apprentice tag next to a loadout and applies gift and debt', () => {
    const base = comebackSeed(30, 'heir');
    const seed = seedWithLoadout(seedWithApprentice(base, { gen: 3, gift: 'jae', debt: 'case' }), {
      home: 'condo',
      outfit: 'casual',
      pet: 'none',
      car: 'none',
      reform: false,
    } as never);
    expect(apprenticeOf(seed)).toEqual({ gen: 3, gift: 'jae', debt: 'case' });
    expect(generationOf(base)).toBe(1);
    const s = newGame(seed, 'ex_insurance', content);
    expect(s.soi?.rep.jae).toBe(content.config.apprentice.giftRep);
    expect(s.case?.evidence.some((e) => e.kind === 'oldcase')).toBe(true);
    const cash = newGame(
      seedWithApprentice(base, { gen: 2, gift: 'cash', debt: 'debt' }),
      'ex_insurance',
      content,
    );
    const plain = newGame(base, 'ex_insurance', content);
    const { giftCash, debtCash } = content.config.apprentice;
    expect(cash.dirtyCash).toBe(plain.dirtyCash + giftCash - debtCash);
  });

  it('hands down an offer when a run ends and keeps it in the career', () => {
    const { s } = play(
      seedWithApprentice(comebackSeed(30, 'line'), { gen: 2, gift: 'fame', debt: 'none' }),
    );
    const heir = heirFrom(s);
    expect(heir?.gen).toBe(3);
    expect(heir?.debt).toBe(
      s.end?.reason === 'caught' ? 'case' : s.cleanCash < 5_000 ? 'debt' : 'none',
    );
    const career = addRun(emptyCareer(), s);
    expect(career.heir).toEqual(heir);
    expect(career.bestGen).toBe(2);
    expect(cleanCareer(JSON.parse(JSON.stringify(career)))).toEqual(career);
    expect(spendHeir(career).heir).toBeUndefined();
    expect(mergeCareer(spendHeir(career), career).heir).toEqual(heir);
    expect(runStats(s).generation).toBe(2);
  });

  it('ignores a forged tag', () => {
    expect(apprenticeOf(comebackSeed(30, 'x') + '|A=1.cash.none')).toBeNull();
    expect(apprenticeOf(comebackSeed(30, 'x') + '|A=2.gold.none')).toBeNull();
  });
});
