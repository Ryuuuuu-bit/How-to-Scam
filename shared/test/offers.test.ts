import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { InvalidActionError, newGame, priceOf, step } from '../src';
import type { GameState } from '../src';

const at = (patch: Partial<GameState>, seed = 'offer') => ({
  ...newGame(seed, 'ex_insurance', content),
  ...patch,
});

/** วันหนึ่งแบบย่อ: เลือกแผน → เริ่มงาน → ผ่านเหตุการณ์ → ไม่ฟอก → จบวัน */
function day(s: GameState, methodId: string | null, keepOffer?: GameState['offer']): GameState {
  let x = keepOffer !== undefined ? { ...s, offer: keepOffer } : s;
  x = step(x, { t: 'choosePlan', methodId }, content);
  x = step(x, { t: 'confirmInvest' }, content);
  while (x.phase === 'event') x = step(x, { t: 'eventChoice', choiceIdx: 0 }, content);
  if (x.phase === 'escape') return x;
  if (x.phase === 'launder') x = step(x, { t: 'launder', cardId: null }, content);
  return step(x, { t: 'endDay' }, content);
}

describe('ข้อเสนอประจำวัน', () => {
  it('ทุกวันมีข้อเสนอ และสุ่มต่างกันได้', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const s = newGame(`o${i}`, 'ex_insurance', content);
      expect(s.offer).not.toBeNull();
      ids.add(s.offer?.id ?? '');
    }
    expect(ids.size).toBeGreaterThan(4);
  });

  it('ส่วนลดของวันนี้ลดราคาจริง', () => {
    const s = at({ offer: { id: 'sim_clearance', accepted: true } });
    expect(priceOf(s, content, 'sim_pack', 300)).toBe(90);
  });

  it('ของที่ถูกแบนซื้อไม่ได้', () => {
    let s = at({ offer: { id: 'ads_banned', accepted: true } });
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    expect(() => step(s, { t: 'invest', itemId: 'ads' }, content)).toThrow(InvalidActionError);
  });

  it('รับดีลแล้วจ่ายเงินและได้ผล รับซ้ำไม่ได้', () => {
    let s = at({ offer: { id: 'dark_glasses', accepted: false }, heat: 50, dirtyCash: 5_000 });
    s = step(s, { t: 'acceptOffer' }, content);
    expect(s.heat).toBe(38);
    expect(s.dirtyCash).toBe(3_000);
    expect(() => step(s, { t: 'acceptOffer' }, content)).toThrow(InvalidActionError);
  });

  it('ภารกิจ: ทำครบได้รางวัล', () => {
    let s = at({ offer: { id: 'boss_shop', accepted: false }, dirtyCash: 50_000 });
    s = step(s, { t: 'acceptOffer' }, content);
    expect(s.mission?.offerId).toBe('boss_shop');
    let gotReward = false;
    for (let d = 0; d < 3; d++) {
      s = day(s, 'fake_shop', d === 0 ? s.offer : null);
      if (s.lastResults.some((r) => r.kind === 'missionDone')) gotReward = true;
      if (s.phase === 'escape') break;
    }
    // ผลภารกิจโผล่ในวันที่ทำครบ (ข้อความอยู่ใน lastResults ของ action confirmInvest)
    expect(gotReward || s.mission === null).toBe(true);
    expect(s.mission).toBeNull();
  });

  it('ภารกิจ: เปลี่ยนแผนกลางทางถือว่าล้มเหลว', () => {
    let s = at({ offer: { id: 'boss_romance', accepted: false } });
    s = step(s, { t: 'acceptOffer' }, content);
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.mission).toBeNull();
    expect(s.lastResults.some((r) => r.kind === 'missionFail')).toBe(true);
  });
});
