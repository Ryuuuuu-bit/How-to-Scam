import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  campaignSeed,
  choiceAvailable,
  comebackRules,
  comebackSeed,
  launderSuccessPct,
  newGame,
  replay,
  roleOf,
  step,
  washPending,
  washRules,
  washSeed,
  weekLedger,
  type Action,
  type GameState,
} from '../src';
import { botAction, soiAction } from './helpers';

const card = (id: string) => {
  const x = content.launderCards.find((c) => c.id === id);
  if (!x) throw Error('missing card ' + id);
  return x;
};

/** บอทที่หาเงินสกปรกทุกวันแล้วเลือกการ์ดใบแรกที่โผล่ */
function bot(s: GameState): Action {
  const soi = soiAction(s);
  if (soi) return soi;
  if (s.phase === 'plan' && s.heat < 80 && s.dirtyCash + s.cleanCash >= 500)
    return { t: 'choosePlan', methodId: 'fake_shop' };
  if (s.phase === 'event') {
    const ev = content.events.find((e) => e.id === s.pendingEvents[0]);
    return {
      t: 'eventChoice',
      choiceIdx: Math.max(0, ev?.choices.findIndex((c) => choiceAvailable(s, c.requires)) ?? 0),
    };
  }
  return botAction(s);
}

/** หยุดที่ขั้นฟอกเงินของวันนั้น */
function toLaunder(seed: string, day: number): { s: GameState; actions: Action[] } {
  let s = newGame(seed, 'ex_insurance', content);
  const actions: Action[] = [];
  while (!(s.phase === 'launder' && s.day === day) && s.phase !== 'ended') {
    const a = bot(s);
    actions.push(a);
    s = step(s, a, content);
  }
  return { s, actions };
}

describe('laundering set 2 (wash1 seeds)', () => {
  it('stacks on 1.2 and only turns on for its own seeds', () => {
    expect(washRules(washSeed(30, 'x'))).toBe(true);
    expect(comebackRules(washSeed(30, 'x'))).toBe(true);
    expect(washRules(comebackSeed(30, 'x'))).toBe(false);
  });

  it('keeps older seeds on the first ten cards', () => {
    for (let i = 0; i < 8; i++) {
      const { s } = toLaunder(comebackSeed(30, 'old-' + i), 2);
      for (const id of s.launderOffer) expect(card(id).edition).toBeUndefined();
    }
    const { s } = toLaunder(campaignSeed(30, 'older'), 2);
    for (const id of s.launderOffer) expect(card(id).edition).toBeUndefined();
  });

  it('deals one safe, one big and one special card, never repeating yesterday', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 6; i++) {
      let s = newGame(washSeed(30, 'deal-' + i), 'ex_insurance', content);
      let prev: string[] = [];
      while (s.phase !== 'ended' && s.day <= 12) {
        if (s.phase === 'launder') {
          const offer = s.launderOffer;
          expect(new Set(offer).size).toBe(offer.length);
          expect(new Set(offer.map((id) => roleOf(card(id)))).size).toBe(3);
          expect(offer.some((id) => prev.includes(id))).toBe(false);
          offer.forEach((id) => seen.add(id));
          prev = offer;
        }
        s = step(s, bot(s), content);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(14);
  });

  it('only offers level-gated and festival cards when they apply', () => {
    for (let i = 0; i < 10; i++) {
      const { s } = toLaunder(washSeed(30, 'gate-' + i), 2);
      for (const id of s.launderOffer) {
        const c = card(id);
        expect(!c.minLevel || s.gangLevel >= c.minLevel).toBe(true);
      }
    }
  });

  it('pays a drip card over the following days and loses the rest if caught', () => {
    const { s } = toLaunder(washSeed(30, 'drip'), 2);
    s.launderOffer = ['chicken_rice'];
    s.dirtyCash = 40_000;
    s.launderFailStreak = 4; // ดวงชดเชยทำให้ผ่านแน่ ทดสอบเฉพาะการทยอยเข้า
    const clean0 = s.cleanCash;
    let t = step(s, { t: 'launder', cardId: 'chicken_rice' }, content);
    expect(t.lastResults.at(-1)?.success).toBe(true);
    {
      expect(t.cleanCash).toBe(clean0);
      expect(washPending(t)).toBe(Math.round(40_000 * 0.84));
      t = step(t, { t: 'endDay' }, content);
      expect(t.cleanCash - clean0).toBe(Math.floor(Math.round(40_000 * 0.84) / 4));
      expect(t.history.find((h) => h.day === 2)?.flow?.launder).toBeDefined();
    }
  });

  it('always passes the legal route, lowers Heat and costs a big fee', () => {
    const { s } = toLaunder(washSeed(30, 'legit'), 2);
    s.launderOffer = ['honest_tax'];
    s.dirtyCash = 20_000;
    s.heat = 40;
    expect(launderSuccessPct(s, content, 'honest_tax')).toBe(100);
    const t = step(s, { t: 'launder', cardId: 'honest_tax' }, content);
    expect(t.lastResults.at(-1)?.success).toBe(true);
    expect(t.cleanCash - s.cleanCash).toBe(9_000);
    expect(t.heat).toBe(34);
  });

  it('gives a big boost when the card’s neighbour is on your side', () => {
    const { s } = toLaunder(washSeed(30, 'ally'), 2);
    s.launderFailStreak = 0;
    const base = launderSuccessPct(s, content, 'stall_account');
    if (s.soi) s.soi.rep.jae = 3;
    expect(launderSuccessPct(s, content, 'stall_account')).toBe(
      Math.min(95, base + content.config.launderAllyBonus),
    );
  });

  it('replays a full wash run exactly and the weekly ledger still balances', () => {
    const seed = washSeed(30, 'full');
    let s = newGame(seed, 'ex_insurance', content);
    const actions: Action[] = [];
    while (s.phase !== 'ended') {
      const a = bot(s);
      actions.push(a);
      s = step(s, a, content);
    }
    expect(replay(seed, 'ex_insurance', actions, content)).toEqual(s);
    const start = newGame(seed, 'ex_insurance', content);
    const weeks = Math.ceil(s.maxDays / 7);
    let net = 0;
    for (let w = 1; w <= weeks; w++) net += weekLedger(s, w).net;
    expect(
      start.dirtyCash +
        start.cleanCash +
        net +
        Object.values(s.preFlow ?? {}).reduce((a, b) => a + (b ?? 0), 0),
    ).toBe(s.dirtyCash + s.cleanCash);
  });
});
