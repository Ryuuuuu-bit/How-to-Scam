import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  campaignSeed,
  casualContent,
  contentForSeed,
  isCasualSeed,
  isLivingSoi,
  launderSuccessPct,
  newGame,
  raidThreshold,
  replay,
  seedWithLoadout,
  step,
} from '../src';
import type { GameState } from '../src';
import { autoPlay, soiAction } from './helpers';

const easy = (nonce = 'easy') => campaignSeed(30, nonce);
const classic = (nonce = 'easy') => campaignSeed(30, nonce, false);
const tuned = casualContent(content);

function rest(s: GameState): GameState {
  let x = s;
  const soi = soiAction(x);
  if (soi) x = step(x, soi, content);
  x = step(x, { t: 'choosePlan', methodId: null }, content);
  return step(x, { t: 'confirmInvest' }, content);
}

describe('โหมดเล่นสบาย', () => {
  it('รอบใหม่ทุกรอบเป็นโหมดเล่นสบาย และยังเป็นซอยมีชีวิต', () => {
    expect(isCasualSeed(easy())).toBe(true);
    expect(isCasualSeed(classic())).toBe(false);
    expect(isLivingSoi(easy())).toBe(true);
    expect(isCasualSeed(seedWithLoadout(easy(), { home: 'house', outfit: 'banker', pet: 'none', car: 'none', reform: false }))).toBe(true);
  });

  it('เลือก content ตาม seed และเรียกซ้ำได้ผลเดิม', () => {
    expect(contentForSeed(content, easy())).toBe(tuned);
    expect(contentForSeed(tuned, easy())).toBe(tuned);
    expect(contentForSeed(tuned, classic())).toBe(content);
    expect(contentForSeed(content, classic())).toBe(content);
  });

  it('เริ่มด้วยทุนมากขึ้น และพักงานลด Heat ได้มากขึ้น', () => {
    const a = newGame(easy(), 'ex_insurance', content);
    const b = newGame(classic(), 'ex_insurance', content);
    expect(a.dirtyCash - b.dirtyCash).toBe(tuned.config.startDirtyCash - content.config.startDirtyCash);
    a.heat = 50;
    b.heat = 50;
    expect(50 - rest(a).heat).toBeGreaterThanOrEqual(tuned.config.heatDecayQuietDay);
    expect(50 - rest(b).heat).toBeLessThan(tuned.config.heatDecayQuietDay);
  });

  it('การ์ดฟอกเงินสำเร็จง่ายขึ้นและพังแล้วเสียน้อยลง', () => {
    const s = newGame(easy(), 'ex_insurance', content);
    const old = newGame(classic(), 'ex_insurance', content);
    for (const card of content.launderCards) {
      const t = tuned.launderCards.find((x) => x.id === card.id);
      expect(t?.failLossPct).toBe(Math.round(card.failLossPct / 2));
      expect(launderSuccessPct(s, tuned, card.id)).toBeGreaterThanOrEqual(launderSuccessPct(old, content, card.id));
    }
  });

  it('เหตุการณ์ร้ายเบาลง แต่ผลดียังเท่าเดิม', () => {
    const pairs = content.events.flatMap((ev, i) => ev.choices.flatMap((ch, j) => ch.outcomes.flatMap((o, k) =>
      o.effects.map((e, n) => [e, tuned.events[i]?.choices[j]?.outcomes[k]?.effects[n]] as const))));
    let softened = 0;
    for (const [before, after] of pairs) {
      if (before.kind !== 'add' || after?.kind !== 'add' || typeof before.value !== 'number' || typeof after.value !== 'number') continue;
      if (before.stat === 'heat' && before.value > 0) { expect(after.value).toBeLessThanOrEqual(before.value); softened++; }
      if (before.stat === 'heat' && before.value < 0) expect(after.value).toBe(before.value);
      if (before.stat === 'dirtyCash' && before.value > 0) expect(after.value).toBe(before.value);
    }
    expect(softened).toBeGreaterThan(10);
  });

  it('สารวัตรบุกเมื่อน้ำหนักคดีถึง 9 (เดิม 7)', () => {
    expect(raidThreshold(newGame(easy(), 'ex_insurance', content))).toBe(9);
    expect(raidThreshold(newGame(classic(), 'ex_insurance', content))).toBe(7);
  });

  it('เล่นทั้งรอบได้ และ replay ได้ผลเดิม', () => {
    const { state, actions } = autoPlay(easy('full'), 'gamer_kid');
    expect(state.phase).toBe('ended');
    expect(replay(easy('full'), 'gamer_kid', actions, content)).toEqual(state);
  });
});
