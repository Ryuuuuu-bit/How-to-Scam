import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  auditionProgress,
  auditionsPassed,
  bountyOf,
  bountyRank,
  campaignSeed,
  charKey,
  dailyCharacter,
  isCharacterUnlocked,
  isStarter,
  legacyCharacterKeys,
  marketPrice,
  moneyForRun,
  xpForRun,
} from '../src';
import { autoPlay } from './helpers';

const ch = (id: string) => {
  const c = content.characters.find((x) => x.id === id);
  if (!c) throw new Error(id);
  return c;
};

describe('ค่าหัวและเงินใต้ดิน', () => {
  it('เปิดตัวเริ่มต้นแค่สามตัว', () => {
    const fresh = content.characters.filter((c) => isCharacterUnlocked(c, { xp: 0, endings: [] }));
    expect(fresh.map((c) => c.id)).toEqual(['ex_insurance', 'gamer_kid', 'temple_kid']);
    expect(content.characters.filter(isStarter)).toHaveLength(3);
  });

  it('ตัวที่ซื้อแล้วเล่นได้ ผู้เล่นเก่าได้ครบทุกตัวที่เคยเปิด', () => {
    expect(
      isCharacterUnlocked(ch('live_seller'), {
        xp: 0,
        endings: [],
        owned: [charKey('live_seller')],
      }),
    ).toBe(true);
    const legacy = { xp: 0, endings: [], owned: legacyCharacterKeys(content) };
    const open = content.characters.filter((c) => isCharacterUnlocked(c, legacy)).map((c) => c.id);
    expect(open).toHaveLength(11);
    expect(open).not.toContain('foundation_chief');
  });

  it('ราคาตลาดมาจากข้อมูลเท่านั้น', () => {
    expect(marketPrice(content, 'char:live_seller')).toBe(1500);
    expect(marketPrice(content, 'char:ex_insurance')).toBeNull();
    expect(marketPrice(content, 'skin:ex_insurance_gold')).toBeNull();
    expect(marketPrice(content, 'scene:condo')).toBeNull();
    expect(marketPrice(content, 'toString')).toBeNull();
  });

  it('เงินใต้ดินและค่าหัวคิดจาก xp ของรอบ', () => {
    const { state } = autoPlay(campaignSeed(30, 'meta-money'));
    expect(moneyForRun(state)).toBe(xpForRun(state) * 10);
    expect(bountyOf(60)).toBe(1_200_000);
    expect(bountyRank(0).name).toBe('มือใหม่หน้าซอย');
    expect(bountyRank(160).index).toBe(2);
    expect(bountyRank(10_000).next).toBeNull();
  });

  it('ออดิชั่นนับกะของงานนั้นในรอบเดียว', () => {
    const { state } = autoPlay(campaignSeed(30, 'meta-audition'));
    const shifts = state.history.filter((h) => h.methodId === 'fake_shop').length;
    const p = auditionProgress(state, ch('live_seller'));
    expect(p?.done).toBe(Math.min(shifts, 6));
    const passed = auditionsPassed(state, content, []);
    expect(passed.includes('live_seller')).toBe(shifts >= 6);
    expect(auditionsPassed(state, content, legacyCharacterKeys(content))).toEqual([]);
    const first = state.history[0];
    if (!first) throw new Error('no history');
    const forced = {
      ...state,
      history: [
        ...state.history,
        ...Array.from({ length: 6 }, () => ({ ...first, methodId: 'fake_shop' })),
      ],
    };
    expect(auditionsPassed(forced, content, [])).toContain('live_seller');
  });

  it('Daily ยังสุ่มตัวที่ซื้อได้ ให้ลองเล่นก่อนซื้อ', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++)
      seen.add(dailyCharacter(`2026-12-${String(d).padStart(2, '0')}`, content).id);
    expect([...seen].some((id) => ch(id).price !== undefined)).toBe(true);
  });
});
