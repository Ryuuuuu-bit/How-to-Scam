import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { newGame, step } from '../src';
import type { GameState } from '../src';

/** เริ่มเกมด้วยคอลเซ็นเตอร์ (ต้องมีระดับแก๊งพอ) แล้วเข้าสาย */
function callWith(seed: string, kind: 'normal' | 'baiter' | 'undercover'): GameState {
  for (let i = 0; i < 400; i++) {
    let s: GameState = {
      ...newGame(`${seed}-${i}`, 'ex_insurance', content),
      gangLevel: 4,
      dirtyCash: 50_000,
      heat: 40,
    };
    s = step(s, { t: 'choosePlan', methodId: 'call_center' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    if (s.phase === 'call' && (s.call?.victim.kind ?? 'normal') === kind) return s;
  }
  throw new Error(`no ${kind} caller found`);
}

describe('ปลายสายฉลาดขึ้น', () => {
  it('คนหลอกกลับ: พูดมุกไปแล้วเสียเงิน ได้ flag met_baiter และมีประโยคพิรุธ', () => {
    const s = callWith('bait', 'baiter');
    expect(s.call?.victim.tell?.kind).toBe('baiter');
    const after = step(s, { t: 'callPitch', pitchId: s.call?.pitchIds[0] ?? '' }, content);
    expect(after.lastResults.some((r) => r.kind === 'baited')).toBe(true);
    expect(after.dirtyCash).toBeLessThan(s.dirtyCash);
    expect(after.flags).toContain('met_baiter');
  });

  it('ตำรวจปลอมตัว: พูดมุกไปแล้ว Heat พุ่ง', () => {
    const s = callWith('sting', 'undercover');
    const after = step(s, { t: 'callPitch', pitchId: s.call?.pitchIds[0] ?? '' }, content);
    expect(after.lastResults.some((r) => r.kind === 'sting')).toBe(true);
    expect(after.heat).toBeGreaterThanOrEqual(Math.min(100, s.heat + 35));
  });

  it('วางสายใส่ตัวอันตรายได้ flag หูไว ไม่เสียอะไร', () => {
    const s = callWith('hang', 'undercover');
    const after = step(s, { t: 'callHangup' }, content);
    expect(after.flags).toContain('sharp_ears');
    expect(after.dirtyCash).toBe(s.dirtyCash);
    expect(after.heat).toBeLessThanOrEqual(s.heat);
    expect(after.call).toBeNull();
  });

  it('วางสายใส่เหยื่อธรรมดา ได้กรรมดี +1', () => {
    const s = callWith('kind', 'normal');
    const after = step(s, { t: 'callHangup' }, content);
    expect(after.karma).toBeGreaterThanOrEqual(s.karma + 1);
  });
});

describe('มอบตัว', () => {
  it('มอบตัวกลางโหมดหนี: จบแบบโดนจับ เก็บเงินสะอาด 80% ได้ฉากจบมอบตัว', () => {
    let s: GameState = {
      ...newGame('surrender', 'ex_insurance', content),
      heat: 99,
      cleanCash: 10_000,
    };
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.phase).toBe('escape');
    const end = step(s, { t: 'escapeSurrender' }, content);
    expect(end.end?.reason).toBe('caught');
    expect(end.end?.endingId).toBe('surrendered');
    expect(end.cleanCash).toBe(8_000);
    expect(end.dirtyCash).toBe(0);
  });
});
