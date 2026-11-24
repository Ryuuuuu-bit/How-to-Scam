import { describe, expect, it } from 'vitest';
import { breakChunks, clipWords, glueThai } from './thaiBreak';

const WJ = '⁠';

describe('ตัดบรรทัดภาษาไทย', () => {
  it('ไม่ให้ตัดกลางคำทับศัพท์ และไม้ยมกไม่ขึ้นบรรทัดใหม่', () => {
    const t = glueThai('ขายซิมเถื่อน ดูดวงแปลก ๆ คอมเมนต์');
    expect(t.replaceAll(WJ, '')).toBe('ขายซิมเถื่อน ดูดวงแปลก ๆ คอมเมนต์');
    expect(t).toContain(`ซิ${WJ}ม`);
    expect(t).toContain(`ด${WJ}ว`);
    expect(t).toContain(`น${WJ}ต์`);
    expect(glueThai(t)).toBe(t);
    expect(glueThai('hello')).toBe('hello');
  });

  it('ไม่แทรกตัวเชื่อมหน้าสระหรือวรรณยุกต์', () => {
    for (const w of ['กระซิบ', 'สติกเกอร์', 'คอนโด', 'ไอเดีย', 'กิมหงษ์', 'ติ๋ม']) {
      expect(glueThai(w)).not.toMatch(new RegExp(`${WJ}[\\u0e30-\\u0e3a\\u0e45-\\u0e4e]`));
    }
  });

  it('แบ่งชิ้นและตัดข้อความที่รอยต่อคำ', () => {
    expect(breakChunks('ร้านขายซิม').join('|')).not.toContain('ซิ|');
    const text = 'ช่วยตรวจหน่อยครับ ระบบเตือนว่าบัญชีคุณมีปัญหา';
    const clip = clipWords(text, 20).replaceAll(WJ, '');
    expect(clip.endsWith('…')).toBe(true);
    expect(clip.length).toBeLessThanOrEqual(20);
    expect(text.startsWith(clip.slice(0, -1))).toBe(true);
  });
});
