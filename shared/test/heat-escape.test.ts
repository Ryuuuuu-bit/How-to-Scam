import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { newGame, step } from '../src';
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

  it('หนีไม่รอด: เงินสกปรกถูกยึดหมด เงินสะอาดเหลือ 50%', () => {
    let caught: GameState | null = null;
    let escaped: GameState | null = null;
    for (let i = 0; i < 50 && (!caught || !escaped); i++) {
      let s = setup(`escape-${i}`, { heat: 99, cleanCash: 10_000 });
      s = step(s, { t: 'choosePlan', methodId: 'fake_shop' }, content);
      s = step(s, { t: 'confirmInvest' }, content);
      s = step(s, { t: 'escapeAttempt' }, content);
      if (s.phase === 'ended') caught ??= s;
      else escaped ??= s;
    }
    expect(caught).not.toBeNull();
    expect(caught?.end?.reason).toBe('caught');
    expect(caught?.dirtyCash).toBe(0);
    expect(caught?.cleanCash).toBe(5_000);
    expect(caught?.end?.dangerSignIds.length).toBeGreaterThanOrEqual(1);

    expect(escaped).not.toBeNull();
    expect(escaped?.heat).toBe(content.config.escapePlaceholder.heatAfter);
    expect(escaped?.escapes).toBe(1);
    expect(['launder', 'shop']).toContain(escaped?.phase);
  });

  it('วันพัก Heat ลดลงเอง', () => {
    let s = setup('rest', { heat: 50 });
    s = step(s, { t: 'choosePlan', methodId: null }, content);
    s = step(s, { t: 'confirmInvest' }, content);
    expect(s.heat).toBeLessThanOrEqual(50 - content.config.heatDecayQuietDay);
  });
});
