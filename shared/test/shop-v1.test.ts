import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  burnCost,
  campaignSeed,
  henchmanCap,
  incomeBonusPct,
  newGame,
  questSeedPrefix,
  raidThreshold,
  replay,
  step,
  type Action,
  type GameState,
} from '../src';
import { botAction } from './helpers';

const v1 = (nonce = 'shop') => campaignSeed(30, nonce);
const legacy = questSeedPrefix + 'campaign1:30:old-run';

/** เล่นจนถึงร้านท้ายวัน */
function toShop(s: GameState): GameState {
  let next = s;
  for (let i = 0; i < 200 && next.phase !== 'shop'; i++) next = step(next, botAction(next), content);
  if (next.phase !== 'shop') throw new Error(`stuck in ${next.phase}`);
  return next;
}
function rich(s: GameState): GameState {
  return { ...s, cleanCash: 200_000 };
}
function nextShop(s: GameState): GameState {
  return toShop(step(s, { t: 'endDay' }, content));
}

describe('1.0 upgrade shop', () => {
  it('opens a nightly black market only in living-soi runs, the same for the same seed and day', () => {
    const a = toShop(newGame(v1(), 'ex_insurance', content));
    const b = toShop(newGame(v1(), 'ex_insurance', content));
    expect(a.market?.day).toBe(a.day);
    expect(a.market?.offers).toHaveLength(3);
    expect(new Set(a.market?.offers).size).toBe(3);
    expect(a.market?.offers).toEqual(b.market?.offers);
    expect(toShop(newGame(legacy, 'ex_insurance', content)).market).toBeUndefined();
  });

  it('only sells tonight’s offers, and each one once', () => {
    const s = rich(toShop(newGame(v1(), 'ex_insurance', content)));
    const offer = s.market?.offers[0] ?? '';
    const notOffered = content.shopItems.find((it) => it.line === 'market' && !s.market?.offers.includes(it.id))?.id ?? '';
    expect(() => step(s, { t: 'buy', itemId: notOffered }, content)).toThrow();
    const after = step(s, { t: 'buy', itemId: offer }, content);
    expect(after.upgrades[offer]).toBe(1);
    expect(after.market?.bought).toContain(offer);
    expect(() => step(after, { t: 'buy', itemId: offer }, content)).toThrow();
  });

  it('applies instant effects like clearing evidence and fame', () => {
    let s = rich(toShop(newGame(v1('cctv'), 'ex_insurance', content)));
    s = { ...s, market: { day: s.day, offers: ['mk_cctv_map', 'mk_fake_review', 'mk_laptop'], deal: null, bought: [] } };
    s = { ...s, case: { evidence: [{ id: 1, kind: 'shift', day: 1, weight: 2 }, { id: 2, kind: 'paper', day: 2, weight: 1 }], nextId: 3, peak: 3, raids: 0 } };
    const cleared = step(s, { t: 'buy', itemId: 'mk_cctv_map' }, content);
    expect(cleared.case?.evidence.map((e) => e.id)).toEqual([2]);
    const famous = step(s, { t: 'buy', itemId: 'mk_fake_review' }, content);
    expect(famous.fame).toBe(s.fame + 3);
  });

  it('holds an offer for tomorrow night', () => {
    const s = rich(toShop(newGame(v1('hold'), 'ex_insurance', content)));
    const target = s.market?.offers[2] ?? '';
    const held = step(s, { t: 'shopHold', itemId: target }, content);
    expect(held.cleanCash + held.dirtyCash).toBe(s.cleanCash + s.dirtyCash - 300);
    expect(() => step(held, { t: 'shopHold', itemId: s.market?.offers[0] ?? '' }, content)).toThrow();
    const tomorrow = nextShop(held);
    expect(tomorrow.market?.offers[0]).toBe(target);
  });

  it('sells one shady deal at half price and leaves a receipt on the board', () => {
    const s = rich(toShop(newGame(v1('deal'), 'ex_insurance', content)));
    const deal = content.shopItems.find((it) => it.id === s.market?.deal);
    expect(deal).toBeDefined();
    const after = step(s, { t: 'shopDeal' }, content);
    expect(s.cleanCash + s.dirtyCash - (after.cleanCash + after.dirtyCash)).toBe(Math.round((deal?.price ?? 0) / 2));
    expect(after.case?.evidence.some((e) => e.kind === 'contraband' && e.weight === 2)).toBe(true);
    expect(() => step(after, { t: 'shopDeal' }, content)).toThrow();
    const friend = { ...s, soi: s.soi && { ...s.soi, rep: { ...s.soi.rep, hia: 3 } } };
    expect(step(friend, { t: 'shopDeal' }, content).case?.evidence.some((e) => e.kind === 'contraband')).toBe(false);
  });

  it('unlocks place goods only after the place changes, and they only boost that place’s jobs', () => {
    const s = rich(toShop(newGame(v1('place'), 'ex_insurance', content)));
    expect(() => step(s, { t: 'buy', itemId: 'pl_market_patron' }, content)).toThrow();
    const shaped = { ...s, soi: s.soi && { ...s.soi, places: { ...s.soi.places, market: { visits: 4, form: 'patron' as const } } } };
    expect(() => step(shaped, { t: 'buy', itemId: 'pl_market_local' }, content)).toThrow();
    const after = step(shaped, { t: 'buy', itemId: 'pl_market_patron' }, content);
    expect(incomeBonusPct(after, content, 'fake_shop') - incomeBonusPct(shaped, content, 'fake_shop')).toBe(25);
    expect(incomeBonusPct(after, content, 'merit')).toBe(incomeBonusPct(shaped, content, 'merit'));
  });

  it('grows the hideout in three steps', () => {
    let s = rich(toShop(newGame(v1('home'), 'ex_insurance', content)));
    const cap = henchmanCap(s, content);
    const threshold = raidThreshold(s);
    const prices: number[] = [];
    for (let i = 0; i < 3; i++) {
      const before = s.cleanCash + s.dirtyCash;
      s = step(s, { t: 'buy', itemId: 'hideout' }, content);
      prices.push(before - (s.cleanCash + s.dirtyCash));
    }
    expect(prices).toEqual([5_000, 15_000, 40_000]);
    expect(henchmanCap(s, content)).toBe(cap + 2);
    expect(raidThreshold(s)).toBe(threshold + 2);
    expect(() => step(s, { t: 'buy', itemId: 'hideout' }, content)).toThrow();
  });

  it('phone apps change the case board and the escape', () => {
    const s = rich(toShop(newGame(v1('apps'), 'ex_insurance', content)));
    const shredded = step(s, { t: 'buy', itemId: 'app_shredder' }, content);
    expect(burnCost(shredded, 2)).toBe(burnCost(s, 2) / 2);
    const cased = step(s, { t: 'buy', itemId: 'app_case' }, content);
    const hot = (x: GameState): GameState => ({ ...x, phase: 'plan', heat: 100 });
    const escape = (x: GameState) => step(hot(x), { t: 'choosePlan', methodId: 'fake_shop' }, content);
    const plain = escape(s);
    const withCase = escape(cased);
    if (plain.escape && withCase.escape) expect(withCase.escape.bonus - plain.escape.bonus).toBe(10);
  });

  it('keeps the new goods out of pre-1.0 runs', () => {
    const s = rich(toShop(newGame(legacy, 'ex_insurance', content)));
    expect(() => step(s, { t: 'buy', itemId: 'app_shredder' }, content)).toThrow();
    expect(() => step(s, { t: 'buy', itemId: 'hideout' }, content)).toThrow();
    expect(() => step(s, { t: 'shopDeal' }, content)).toThrow();
  });

  it('replays a full run that shops every night', () => {
    const seed = v1('replay');
    let s = newGame(seed, 'ex_insurance', content);
    const actions: Action[] = [];
    let shopped = 0;
    while (s.phase !== 'ended' && actions.length < 4000) {
      let action = botAction(s);
      const m = s.market;
      if (s.phase === 'shop' && m?.day === s.day) {
        const cash = s.cleanCash + s.dirtyCash;
        const cheap = m.offers.find((id) => !m.bought.includes(id) && (content.shopItems.find((it) => it.id === id)?.price ?? 1e9) < cash / 2);
        if (cheap) action = { t: 'buy', itemId: cheap };
        else if (m.deal && !m.dealBought && (content.shopItems.find((it) => it.id === m.deal)?.price ?? 1e9) < cash) action = { t: 'shopDeal' };
      }
      if (action.t === 'buy' || action.t === 'shopDeal') shopped++;
      actions.push(action);
      s = step(s, action, content);
    }
    expect(s.phase).toBe('ended');
    expect(replay(seed, 'ex_insurance', actions, content)).toEqual(s);
    expect(shopped).toBeGreaterThan(0);
  });
});
