import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  choiceAvailable,
  dateOf,
  InvalidActionError,
  newGame,
  ponziCrashPct,
  priceOf,
  step,
  unlockedMethods,
} from '../src';
import type { GameState } from '../src';
import { autoPlay } from './helpers';

const base = (seed: string, characterId = 'ex_insurance', patch: Partial<GameState> = {}) => ({
  ...newGame(seed, characterId, content),
  ...patch,
});

describe('ปฏิทิน', () => {
  it('นับวันข้ามเดือนและข้ามปีถูกต้อง', () => {
    expect(dateOf({ startMonth: 1, startDate: 30 }, 3)).toEqual({ month: 2, date: 1 });
    expect(dateOf({ startMonth: 12, startDate: 31 }, 2)).toEqual({ month: 1, date: 1 });
  });

  it('แต่ละ seed เริ่มคนละเดือนได้', () => {
    const months = new Set(
      Array.from({ length: 40 }, (_, i) => newGame(`m${i}`, 'ex_insurance', content).startMonth),
    );
    expect(months.size).toBeGreaterThan(5);
  });

  it('เริ่มรอบมีข่าวประจำสัปดาห์แล้ว', () => {
    const s = newGame('news', 'ex_insurance', content);
    expect(s.news?.id).toBeTruthy();
    expect(s.lastResults.some((r) => r.kind === 'news')).toBe(true);
  });
});

describe('เหตุการณ์ต่อเนื่องและทางเลือกพิเศษ', () => {
  it('เลือกทางที่นัดตอนต่อ แล้วตอนต่อมาตามวันที่นัด', () => {
    let s = base('chain', 'ex_insurance', {
      phase: 'event',
      pendingEvents: ['inspector_1'],
      seenEvents: ['inspector_1'],
      history: [
        {
          day: 1,
          methodId: null,
          income: 0,
          heatGained: 0,
          events: [],
          launderCardId: null,
          launderSuccess: null,
          laundered: 0,
        },
      ],
    });
    s = step(s, { t: 'eventChoice', choiceIdx: 1 }, content);
    expect(s.scheduled).toEqual([{ eventId: 'inspector_2', day: 4 }]);
    // ข้ามไปวันที่ 4 แล้วทำงาน ต้องเจอตอนต่อแน่นอน
    s = { ...s, phase: 'plan', day: 4, pendingEvents: [], launderOffer: [] };
    s = step(s, { t: 'choosePlan', methodId: null }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.pendingEvents[0]).toBe('inspector_2');
  });

  it('ทางเลือกพิเศษของอาชีพอื่นเลือกไม่ได้', () => {
    const ev = content.events.find((e) => e.id === 'inspector_2');
    const special =
      ev?.choices.findIndex((c) => c.requires?.characters?.includes('phone_tech')) ?? -1;
    expect(special).toBeGreaterThan(-1);
    const s = base('special', 'ex_insurance', {
      phase: 'event',
      pendingEvents: ['inspector_2'],
      history: [
        {
          day: 1,
          methodId: null,
          income: 0,
          heatGained: 0,
          events: [],
          launderCardId: null,
          launderSuccess: null,
          laundered: 0,
        },
      ],
    });
    expect(choiceAvailable(s, ev?.choices[special]?.requires)).toBe(false);
    expect(() => step(s, { t: 'eventChoice', choiceIdx: special }, content)).toThrow(
      InvalidActionError,
    );
    const tech = { ...s, characterId: 'phone_tech' };
    expect(() => step(tech, { t: 'eventChoice', choiceIdx: special }, content)).not.toThrow();
  });
});

describe('อาชีพ', () => {
  it('แมวส้มใช้คอลเซ็นเตอร์ไม่ได้', () => {
    const s = base('cat', 'orange_cat', { gangLevel: 2 });
    expect(unlockedMethods(s, content).map((m) => m.id)).not.toContain('call_center');
    expect(() => step(s, { t: 'choosePlan', methodId: 'call_center' }, content)).toThrow(
      InvalidActionError,
    );
  });

  it('ช่างมือถือซื้อซิมครึ่งราคา', () => {
    const s = base('tech', 'phone_tech');
    expect(priceOf(s, content, 'sim_pack', 300)).toBe(150);
    expect(priceOf(base('x'), content, 'sim_pack', 300)).toBe(300);
  });

  it('โค้ชรวยเร็วเริ่มเกมดังกว่า และแชร์ลูกโซ่เสี่ยงล่มกว่า', () => {
    const coach = base('coach', 'rich_coach');
    const normal = base('coach');
    expect(coach.fame).toBe(30);
    expect(ponziCrashPct(coach, content)).toBeGreaterThan(ponziCrashPct(normal, content));
  });

  it('ทุกอาชีพเล่นจบรอบได้โดยไม่พัง', () => {
    for (const ch of content.characters) {
      for (let i = 0; i < 5; i++) {
        const { state } = autoPlay(`${ch.id}-${i}`, ch.id);
        expect(state.phase).toBe('ended');
      }
    }
  });
});

describe('วิธีโกงระดับสูง', () => {
  it('แชร์ลูกโซ่: ทำต่อเนื่องแล้วโอกาสล่มเพิ่มขึ้น', () => {
    const s = base('ponzi', 'ex_insurance', {
      methodState: { ponzi: { streak: 4, exposure: 0, cooldownUntil: 0 } },
    });
    expect(ponziCrashPct(s, content)).toBeGreaterThan(ponziCrashPct(base('ponzi'), content));
  });

  it('มูลนิธิ: โดนขุดแล้วปิดใช้ชั่วคราว', () => {
    let s = base('fdn', 'ex_insurance', {
      gangLevel: 2,
      dirtyCash: 50_000,
      methodState: { foundation: { streak: 0, exposure: 95, cooldownUntil: 0 } },
    });
    s = step(s, { t: 'choosePlan', methodId: 'foundation' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.methodState['foundation']?.cooldownUntil).toBeGreaterThan(s.day);
    expect(s.lastResults.some((r) => r.kind === 'exposed')).toBe(true);
  });
});

describe('ความหลากหลาย', () => {
  it('100 รอบเจอเหตุการณ์ไม่ซ้ำกันอย่างน้อยครึ่งหนึ่งของทั้งหมด', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const ch = content.characters[i % content.characters.length]?.id ?? 'ex_insurance';
      for (const e of autoPlay(`variety-${i}`, ch).state.seenEvents) seen.add(e);
    }
    expect(seen.size).toBeGreaterThan(content.events.length / 2);
  });
});
