import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  campaignDays,
  campaignSeed,
  computeScore,
  edgeIncomePct,
  incomeBonusPct,
  InvalidActionError,
  isLivingSoi,
  methodBlock,
  nextRestDecay,
  newGame,
  replay,
  riskRules,
  riskSeed,
  step,
  type Action,
  type GameState,
} from '../src';
import { botAction, soiAction } from './helpers';

const fresh = (seed = riskSeed(30, 'risk-test')) => newGame(seed, 'ex_insurance', content);

/** ตอบเรื่องในซอยที่ค้างอยู่ก่อนเลือกแผน (รุ่น 1.0 ขึ้นไป) */
function clearSoi(s: GameState): GameState {
  for (let a = soiAction(s); a; a = soiAction(s)) s = step(s, a, content);
  return s;
}
const method = (id: string) => {
  const m = content.methods.find((x) => x.id === id);
  if (!m) throw Error('missing method ' + id);
  return m;
};

/** เล่นวันนี้ให้จบด้วยวิธีที่เลือก (บอทตอบเหตุการณ์/ฟอก/ร้านค้า) แล้วคืน state ตอนขึ้นวันใหม่ */
function playDay(s: GameState, plan: Action): GameState {
  const day = s.day;
  s = step(clearSoi(s), plan, content);
  while (s.phase !== 'ended' && !(s.phase === 'plan' && s.day > day))
    s = step(s, botAction(s), content);
  return s;
}

describe('risk1 seeds', () => {
  it('keeps the campaign length and only turns on for risk seeds', () => {
    expect(campaignDays(riskSeed(60, 'x'))).toBe(60);
    expect(riskRules(riskSeed(90, 'x'))).toBe(true);
    expect(riskRules(campaignSeed(30, 'x'))).toBe(false);
    expect(riskRules('v3:soi:live:abc')).toBe(false);
  });

  it('keeps the living soi of version 1.0 switched on', () => {
    expect(isLivingSoi(riskSeed(30, 'x'))).toBe(true);
    expect(isLivingSoi(campaignSeed(30, 'x'))).toBe(true);
    expect(fresh().soi).toBeTruthy();
  });

  it('refuses rush jobs under the older rules and on rest days', () => {
    const old = newGame(campaignSeed(30, 'old'), 'ex_insurance', content);
    expect(() =>
      step(old, { t: 'choosePlan', methodId: 'fake_shop', rush: true }, content),
    ).toThrow(InvalidActionError);
    expect(() => step(fresh(), { t: 'choosePlan', methodId: null, rush: true }, content)).toThrow(
      InvalidActionError,
    );
  });
});

describe('rush jobs', () => {
  it('pays more and heats up more than the same job without rush', () => {
    const base = fresh();
    const calm = step(
      step(base, { t: 'choosePlan', methodId: 'fake_shop' }, content),
      { t: 'confirmInvest' },
      content,
    );
    const rush = step(
      step(base, { t: 'choosePlan', methodId: 'fake_shop', rush: true }, content),
      { t: 'confirmInvest' },
      content,
    );
    const calmLog = calm.history.at(-1);
    const rushLog = rush.history.at(-1);
    expect(rushLog?.rush).toBe(true);
    // RNG เดียวกัน: ผลต่างมาจากตัวคูณงานด่วนเท่านั้น
    const expected = (calmLog?.income ?? 0) * content.config.risk.rushIncomeMul;
    expect(Math.abs((rushLog?.income ?? 0) - expected)).toBeLessThanOrEqual(1);
    expect(rushLog?.heatGained ?? 0).toBeGreaterThan(calmLog?.heatGained ?? 0);
  });
});

describe('working on the edge', () => {
  it('adds income at high Heat only under risk rules', () => {
    const s = fresh();
    s.heat = 40;
    expect(edgeIncomePct(s, content)).toBe(0);
    s.heat = 60;
    expect(edgeIncomePct(s, content)).toBe(15);
    s.heat = 80;
    expect(edgeIncomePct(s, content)).toBe(35);
    const before = incomeBonusPct({ ...s, heat: 0 }, content, 'fake_shop');
    expect(incomeBonusPct(s, content, 'fake_shop')).toBe(before + 35);
    const old = newGame(campaignSeed(30, 'old'), 'ex_insurance', content);
    old.heat = 80;
    expect(edgeIncomePct(old, content)).toBe(0);
  });

  it('counts edge days and turns them into a capped style bonus', () => {
    const s = fresh();
    s.cleanCash = 100_000;
    const plain = computeScore(s, content, 'survived');
    s.stats.edgeDays = 3;
    expect(computeScore(s, content, 'survived')).toBeGreaterThan(plain);
    s.stats.edgeDays = 999;
    const capped = computeScore(s, content, 'survived');
    s.stats.edgeDays = 1000;
    expect(computeScore(s, content, 'survived')).toBe(capped);
  });

  it('records an edge day when the day ends at high Heat', () => {
    const endAt = (s: GameState, heat: number) => {
      s.phase = 'shop';
      s.heat = heat;
      return step(s, { t: 'endDay' }, content);
    };
    const edge = content.config.risk.edgeHeat;
    expect(endAt(fresh(), edge).stats.edgeDays).toBe(1);
    expect(endAt(fresh(), edge - 1).stats.edgeDays).toBeUndefined();
    expect(
      endAt(newGame(campaignSeed(30, 'old'), 'ex_insurance', content), 95).stats.edgeDays,
    ).toBeUndefined();
  });

  it('can still play a full day at high Heat', () => {
    const s = fresh();
    s.heat = 60;
    const next = playDay(s, { t: 'choosePlan', methodId: 'cat_dub' });
    expect(next.phase === 'plan' || next.phase === 'ended').toBe(true);
  });
});

describe('lying low', () => {
  it('cools Heat faster on each rest day in a row', () => {
    let s = fresh();
    s.heat = 80;
    const { base, perDay, max } = content.config.risk.restDecay;
    expect(nextRestDecay(s, content)).toBe(base);
    const drops: number[] = [];
    for (let i = 0; i < 4; i++) {
      // ปิดเหตุการณ์สุ่มที่อาจเพิ่ม Heat ด้วยการดูแค่ผลของขั้นพัก
      s = clearSoi(s);
      const before = s.heat;
      s = step(s, { t: 'choosePlan', methodId: null }, content);
      s = step(s, { t: 'confirmInvest' }, content);
      drops.push(before - s.heat);
      while (s.phase !== 'plan' && s.phase !== 'ended') s = step(s, botAction(s), content);
      s.heat = 80;
    }
    // บ้าน/ของบางชิ้นบวก Heat ที่ลดเพิ่มคงที่ จึงเทียบส่วนที่เพิ่มจากวันพักติดกัน
    const extra = (drops[0] ?? 0) - base;
    expect(drops.map((d) => d - extra)).toEqual([
      base,
      base + perDay,
      Math.min(max, base + 2 * perDay),
      max,
    ]);
  });

  it('keeps the old fixed cooldown under the older rules', () => {
    const old = newGame(campaignSeed(30, 'old'), 'ex_insurance', content);
    expect(nextRestDecay(old, content)).toBe(content.config.heatDecayQuietDay);
  });
});

describe('bigger jobs unlock earlier', () => {
  it('opens the pyramid scheme at gang level 3 under risk rules', () => {
    const s = fresh();
    s.gangLevel = 3;
    expect(methodBlock(s, content, method('ponzi'))).toBeNull();
    const old = newGame(campaignSeed(30, 'old'), 'ex_insurance', content);
    old.gangLevel = 3;
    expect(methodBlock(old, content, method('ponzi'))).toBe('level');
  });
});

it('replays a risky run exactly', () => {
  const seed = riskSeed(30, 'risky-replay');
  let s = newGame(seed, 'gamer_kid', content);
  const actions: Action[] = [];
  while (s.phase !== 'ended' && actions.length < 3000) {
    const action: Action =
      soiAction(s) ??
      (s.phase === 'plan'
        ? s.heat > 70
          ? { t: 'choosePlan', methodId: null }
          : { t: 'choosePlan', methodId: 'fake_shop', ...(s.heat < 40 && { rush: true as const }) }
        : botAction(s));
    actions.push(action);
    s = step(s, action, content);
  }
  expect(s.phase).toBe('ended');
  expect(actions.some((a) => a.t === 'choosePlan' && a.rush)).toBe(true);
  expect(replay(seed, 'gamer_kid', actions, content)).toEqual(s);
});
