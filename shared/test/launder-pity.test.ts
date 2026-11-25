import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { newGame } from '../src';
import { launder, launderPityPct, launderSuccessPct } from '../src/engine/launder';
import { Rng } from '../src/engine/rng';

/** สถานะพร้อมฟอก: การ์ดหมูกระทะ (80%) อยู่ในข้อเสนอ มีเงินสกปรกพอ */
function ready(seed: string) {
  const s = newGame(seed, 'ex_insurance', content);
  s.phase = 'launder';
  s.dirtyCash = 10_000;
  s.launderOffer = ['empty_mookata'];
  return s;
}

describe('ดวงชดเชยการฟอกเงิน', () => {
  it('ฟอกพังแล้วครั้งถัดไปโอกาสเพิ่ม และรีเซ็ตเมื่อสำเร็จ', () => {
    const s = ready('pity');
    const base = launderSuccessPct(s, content, 'empty_mookata');
    expect(launderPityPct(s)).toBe(0);
    // rng ที่ทอยได้ 0.99 เสมอ = พังแน่นอน
    const bad = { chance: (p: number) => 99 < p } as unknown as Rng;
    launder(s, content, bad, 'empty_mookata');
    expect(s.launderFailStreak).toBe(1);
    expect(launderSuccessPct(s, content, 'empty_mookata')).toBe(Math.min(95, base + 15));
    s.launderOffer = ['empty_mookata'];
    const good = { chance: (p: number) => 0 < p } as unknown as Rng;
    launder(s, content, good, 'empty_mookata');
    expect(s.launderFailStreak).toBe(0);
    expect(launderSuccessPct(s, content, 'empty_mookata')).toBe(base);
  });

  it('การ์ด 80% แทบไม่พังติดกันสองครั้ง และอัตราสำเร็จจริงไม่ต่ำกว่าที่โชว์', () => {
    const s = ready('rate');
    const rng = new Rng(12345);
    let ok = 0;
    let shownSum = 0;
    let doubleFails = 0;
    let prevFail = false;
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      s.dirtyCash = 10_000;
      s.heat = 0;
      s.launderOffer = ['empty_mookata'];
      shownSum += launderSuccessPct(s, content, 'empty_mookata');
      launder(s, content, rng, 'empty_mookata');
      const success = s.lastResults.at(-1)?.success ?? false;
      s.lastResults = [];
      if (success) ok++;
      if (!success && prevFail) doubleFails++;
      prevFail = !success;
    }
    // อัตราจริงตรงกับค่าเฉลี่ยของตัวเลขที่โชว์ก่อนทอย (ต่างกันไม่เกิน 1%)
    expect(Math.abs(ok / n - shownSum / n / 100)).toBeLessThan(0.01);
    // พังติดกันสองครั้งน้อยกว่า 2% (เดิม 4%)
    expect(doubleFails / n).toBeLessThan(0.02);
  });
});
