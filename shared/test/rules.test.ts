import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { InvalidActionError, newGame, step, validateContent } from '../src';
import type { GameState } from '../src';
import { autoPlay } from './helpers';

describe('ข้อมูลเกม', () => {
  it('ผ่านการตรวจความถูกต้อง', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('มีเนื้อหาครบตาม Phase 1', () => {
    expect(content.methods).toHaveLength(10);
    expect(content.launderCards.length).toBeGreaterThanOrEqual(10);
    expect(content.events.length).toBeGreaterThanOrEqual(60);
    expect(content.characters.length).toBeGreaterThanOrEqual(11);
    const cats = new Set(content.events.map((e) => e.category));
    expect(cats).toEqual(new Set(['lucky', 'unlucky', 'silly', 'karma']));
  });
});

describe('กติกา', () => {
  it('เล่นวิธีที่ยังไม่ปลดล็อกไม่ได้', () => {
    const s = newGame('lock', 'ex_insurance', content);
    expect(() => step(s, { t: 'choosePlan', methodId: 'call_center' }, content)).toThrow(
      InvalidActionError,
    );
  });

  it('action ผิดขั้นตอนถูกปฏิเสธ', () => {
    const s = newGame('order', 'ex_insurance', content);
    expect(() => step(s, { t: 'endDay' }, content)).toThrow(InvalidActionError);
    expect(() => step(s, { t: 'launder', cardId: 'goldfish' }, content)).toThrow(
      InvalidActionError,
    );
  });

  it('ใช้การ์ดฟอกเงินที่ไม่ได้สุ่มมาให้ไม่ได้', () => {
    let s = newGame('card', 'ex_insurance', content);
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    while (s.phase === 'event') s = step(s, { t: 'eventChoice', choiceIdx: 0 }, content);
    expect(s.phase).toBe('launder');
    expect(s.launderOffer).toHaveLength(3);
    const notOffered = content.launderCards.find((c) => !s.launderOffer.includes(c.id));
    expect(() => step(s, { t: 'launder', cardId: notOffered?.id ?? '' }, content)).toThrow(
      InvalidActionError,
    );
    // ข้ามการฟอกได้
    const skipped = step(s, { t: 'launder', cardId: null }, content);
    expect(skipped.phase).toBe('shop');
  });

  it('ขึ้นระดับเมื่อยอดฟอกถึงเกณฑ์ แล้วปลดล็อกคอลเซ็นเตอร์', () => {
    let s: GameState = {
      ...newGame('level', 'ex_insurance', content),
      phase: 'shop',
      totalLaundered: 50_000,
      dirtyCash: 10_000,
    };
    s = step(s, { t: 'endDay' }, content);
    expect(s.gangLevel).toBe(2);
    s = step(s, { t: 'choosePlan', methodId: 'call_center' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.phase).toBe('call');
    expect(s.call?.pitchIds).toHaveLength(3);
    // ต้องมีมุกที่ตรงจุดอ่อนอย่างน้อย 1 ตัว
    const victim = s.call?.victim;
    const weaknesses = s.call?.pitchIds.map(
      (id) => content.pitches.find((p) => p.id === id)?.weakness,
    );
    expect(weaknesses).toContain(victim?.weakness);
  });

  it('หลอกรัก: ทิ้งเหยื่อไว้ 2 วัน เหยื่อหนี', () => {
    let s: GameState = {
      ...newGame('romance', 'ex_insurance', content),
      romance: { bond: 4, idleDays: 0 },
    };
    const restDay = () => {
      s = step(s, { t: 'choosePlan', methodId: null }, content);
      s = step(s, { t: 'confirmInvest' }, content);
      while (s.phase === 'event') s = step(s, { t: 'eventChoice', choiceIdx: 0 }, content);
      if (s.phase === 'launder') s = step(s, { t: 'launder', cardId: null }, content);
      s = step(s, { t: 'endDay' }, content);
    };
    restDay();
    expect(s.romance.bond).toBe(4);
    restDay();
    expect(s.romance.bond).toBe(0);
  });

  it('เกษียณเองได้ จบรอบพร้อมฉากจบและการ์ดสัญญาณอันตราย 1–2 ใบ', () => {
    const s = step(newGame('retire', 'temple_kid', content), { t: 'retire' }, content);
    expect(s.phase).toBe('ended');
    expect(s.end?.reason).toBe('retired');
    expect(s.end?.endingId).toBeTruthy();
    expect(s.end?.dangerSignIds.length).toBeGreaterThanOrEqual(1);
    expect(s.end?.dangerSignIds.length).toBeLessThanOrEqual(2);
  });

  it('ทุกรอบจบภายใน 30 วัน และคะแนนไม่ติดลบ', () => {
    for (let i = 0; i < 30; i++) {
      const { state } = autoPlay(`run-${i}`);
      expect(state.phase).toBe('ended');
      expect(state.day).toBeLessThanOrEqual(30);
      expect(state.end?.score).toBeGreaterThanOrEqual(0);
      expect(state.dirtyCash).toBeGreaterThanOrEqual(0);
      expect(state.cleanCash).toBeGreaterThanOrEqual(0);
    }
  });
});
