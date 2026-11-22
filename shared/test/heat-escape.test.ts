import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { escapeChance, newGame, step } from '../src';
import type { GameState } from '../src';

/** เริ่มเกมแล้วปรับค่าตามต้องการ (เฉพาะใน test) */
function setup(seed: string, patch: Partial<GameState> = {}): GameState {
  return { ...newGame(seed, 'ex_insurance', content), ...patch };
}

describe('Heat ถึง 100 → เข้าโหมดหนีตำรวจ', () => {
  it('ทำงานจน Heat เต็ม แล้ว phase เปลี่ยนเป็น escape', () => {
    let s = setup('heat', { heat: 99 });
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.heat).toBe(100);
    expect(s.phase).toBe('escape');
    expect(s.pendingEvents).toEqual([]);
  });

  it('Heat ไม่เกิน 100', () => {
    let s = setup('cap', { heat: 98 });
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.heat).toBeLessThanOrEqual(100);
  });

  it('ในโหมดหนี ทำ action อื่นไม่ได้นอกจากหนี', () => {
    let s = setup('lock', { heat: 99 });
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(() => step(s, { t: 'endDay' }, content)).toThrow();
    expect(() => step(s, { t: 'retire' }, content)).toThrow();
  });

  /** เดินผ่านทุกขั้นของโหมดหนี */
  function runEscape(s: GameState, route = 'market', hits = 3, pay = false): GameState {
    s = step(s, { t: 'escapeDisguise', id: 'none' }, content);
    s = step(s, { t: 'escapeRoute', id: route }, content);
    s = step(s, { t: 'escapeEvent', choiceIdx: 0 }, content);
    s = step(s, { t: 'escapeBribe', pay }, content);
    return step(s, { t: 'escapeQte', hits }, content);
  }

  function atEscape(seed: string, patch: Partial<GameState> = {}): GameState {
    let s = setup(seed, { heat: 99, cleanCash: 10_000, ...patch });
    s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    return step(s, { t: 'confirmInvest' }, content);
  }

  it('หนีไม่รอด: เงินสกปรกถูกยึดหมด เงินสะอาดเหลือ 50%', () => {
    let caught: GameState | null = null;
    let escaped: GameState | null = null;
    for (let i = 0; i < 60 && (!caught || !escaped); i++) {
      const s = runEscape(atEscape(`escape-${i}`));
      if (s.phase === 'ended') caught ??= s;
      else escaped ??= s;
    }
    expect(caught).not.toBeNull();
    expect(caught?.end?.reason).toBe('caught');
    expect(caught?.dirtyCash).toBe(0);
    expect(caught?.cleanCash).toBe(5_000);
    expect(caught?.end?.dangerSignIds.length).toBeGreaterThanOrEqual(1);
    expect(caught?.escape).toBeNull();

    expect(escaped).not.toBeNull();
    expect(escaped?.heat).toBe(content.routes.find((r) => r.id === 'market')?.heatAfter);
    expect(escaped?.escapes).toBe(1);
    expect(escaped?.escape).toBeNull();
    expect(['launder', 'shop']).toContain(escaped?.phase);
  });

  it('โหมดหนีเริ่มที่ขั้นปลอมตัว และต้องทำตามลำดับ', () => {
    const s = atEscape('order');
    expect(s.escape?.step).toBe('disguise');
    expect(() => step(s, { t: 'escapeRoute', id: 'market' }, content)).toThrow();
    expect(() => step(s, { t: 'escapeQte', hits: 6 }, content)).toThrow();
    expect(() => step(s, { t: 'escapeDisguise', id: 'nope' }, content)).toThrow();
  });

  it('ชุดปลอมตัวที่เข้ากับที่หนี ได้โบนัสเพิ่ม', () => {
    let s = atEscape('match', { dirtyCash: 50_000 });
    s = step(s, { t: 'escapeDisguise', id: 'tourist' }, content);
    const before = s.escape?.bonus ?? 0;
    s = step(s, { t: 'escapeRoute', id: 'island' }, content);
    expect(s.escape?.bonus).toBe(before + 20);
  });

  it('จ่ายไม่ไหวก็ซื้อชุด/ที่หนีแพงไม่ได้ แต่ทางฟรียังไปได้', () => {
    const s = { ...atEscape('broke'), dirtyCash: 0, cleanCash: 0 };
    expect(() => step(s, { t: 'escapeDisguise', id: 'tourist' }, content)).toThrow();
    const ok = step(s, { t: 'escapeDisguise', id: 'none' }, content);
    expect(() => step(ok, { t: 'escapeRoute', id: 'island' }, content)).toThrow();
    expect(() => step(ok, { t: 'escapeRoute', id: 'market' }, content)).not.toThrow();
  });

  it('กบดานข้ามวัน และ QTE ช่วยเพิ่มโอกาส (มีเพดาน)', () => {
    let s = atEscape('hide', { dirtyCash: 50_000 });
    const day = s.day;
    s = step(s, { t: 'escapeDisguise', id: 'none' }, content);
    s = step(s, { t: 'escapeRoute', id: 'island' }, content);
    s = step(s, { t: 'escapeEvent', choiceIdx: 0 }, content);
    s = step(s, { t: 'escapeBribe', pay: false }, content);
    expect(escapeChance(s, content, 99)).toBe(escapeChance(s, content, 6));
    expect(escapeChance(s, content, 6)).toBeGreaterThan(escapeChance(s, content, 0));
    const after = step(s, { t: 'escapeQte', hits: 6 }, content);
    if (after.phase !== 'ended') expect(after.day).toBe(day + 3);
  });

  it('วันพัก Heat ลดลงเอง', () => {
    let s = setup('rest', { heat: 50 });
    s = step(s, { t: 'choosePlan', methodId: null }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.heat).toBeLessThanOrEqual(50 - content.config.heatDecayQuietDay);
  });
});
