import type { Character, GameContent } from '../types/content';
import { hashSeed } from './rng';

/** วันที่ตามเวลาไทย (UTC+7) รูปแบบ "2026-11-22" — ใช้เป็น id ของ Daily Challenge */
export function bangkokDate(now: Date): string {
  const bkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return bkk.toISOString().slice(0, 10);
}

/** อาชีพประจำวัน: ทุกคนเล่นอาชีพเดียวกัน เลือกจากอาชีพที่เปิดตั้งแต่แรก */
export function dailyCharacter(date: string, c: GameContent): Character {
  // Preserve the original roster for challenges already issued before the expanded roster.
  const original = ['ex_insurance', 'gamer_kid', 'temple_kid', 'live_seller', 'phone_tech'];
  const pool = c.characters.filter(ch => date < '2026-11-24'
    ? original.includes(ch.id) : !ch.unlockXp && !ch.unlockEnding);
  const ch = pool[hashSeed(`daily-char:${date}`) % pool.length];
  if (!ch) throw new Error('no starter characters');
  return ch;
}

export const isDailyDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
