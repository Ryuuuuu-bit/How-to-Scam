// ความคืบหน้าข้ามรอบ: ค่าหัว (ยศถาวร มาจาก xp) กับเงินใต้ดิน (เงินไว้ซื้อของในตลาดใต้ดิน)
// ของที่ซื้อแล้วเก็บเป็น key เช่น "char:live_seller", "skin:ex_insurance_gold", "scene:condo"
import type { Character, GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { loadoutPrices } from './loadout';
import { xpForRun } from './score';

/** เงินใต้ดินที่ได้ต่อแต้มประสบการณ์ */
export const moneyPerXp = 10;
/** ค่าหัวต่อแต้มประสบการณ์ (บาท) */
export const bountyPerXp = 20_000;

export const charKey = (id: string) => `char:${id}`;

/** เงินใต้ดินจากรอบที่จบแล้ว */
export function moneyForRun(s: GameState): number {
  return xpForRun(s) * moneyPerXp;
}

/** ค่าหัวที่โชว์ในเกม */
export const bountyOf = (xp: number): number => xp * bountyPerXp;

/** ชื่อยศตามค่าหัว (เรียงจากน้อยไปมาก) */
export const bountyRanks = [
  { xp: 0, name: 'มือใหม่หน้าซอย' },
  { xp: 50, name: 'คนที่ตำรวจเริ่มจำชื่อได้' },
  { xp: 150, name: 'หน้าคุ้นในข่าวเย็น' },
  { xp: 300, name: 'เบอร์โทรที่ทั้งซอยบล็อก' },
  { xp: 600, name: 'ตำนานใต้ดิน' },
] as const;

export function bountyRank(xp: number) {
  let i = 0;
  for (let k = 0; k < bountyRanks.length; k++) if (xp >= (bountyRanks[k]?.xp ?? Infinity)) i = k;
  const next = bountyRanks[i + 1];
  return {
    index: i,
    name: bountyRanks[i]?.name ?? '',
    next: next ? { xp: next.xp, name: next.name } : null,
  };
}

/** ของแต่งที่ซื้อได้ด้วยเงินใต้ดิน (ทางลัดแทนการรอสะสม xp) */
export const cosmeticPrices: Record<string, number> = {
  'scene:condo': 3_000,
  'skin:ex_insurance_gold': 2_000,
  'skin:gamer_kid_pro': 2_500,
  'skin:temple_kid_fair': 3_000,
  'skin:live_seller_idol': 4_000,
  'skin:phone_tech_hacker': 5_000,
};

/** ราคาของในตลาดใต้ดิน หรือ null ถ้าซื้อไม่ได้ */
export function marketPrice(c: GameContent, key: string): number | null {
  if (key.startsWith('char:')) {
    const ch = c.characters.find((x) => charKey(x.id) === key);
    return ch?.price ?? null;
  }
  if (Object.hasOwn(loadoutPrices, key)) return loadoutPrices[key] ?? null;
  return Object.hasOwn(cosmeticPrices, key) ? (cosmeticPrices[key] ?? null) : null;
}

/** key ของตัวละครที่ซื้อได้ทุกตัว (ใช้ให้ผู้เล่นเก่าที่มีตัวละครเหล่านี้อยู่แล้ว) */
export const legacyCharacterKeys = (c: GameContent): string[] =>
  c.characters.filter((ch) => ch.price !== undefined).map((ch) => charKey(ch.id));

export const isStarter = (ch: Character): boolean =>
  ch.price === undefined && ch.unlockXp === undefined && ch.unlockEnding === undefined;

/** ความคืบหน้าออดิชั่นของตัวละครในรอบนี้ */
export function auditionProgress(
  s: GameState,
  ch: Character,
): { done: number; need: number; passed: boolean } | null {
  const a = ch.audition;
  if (!a) return null;
  const done =
    a.kind === 'shifts'
      ? s.history.filter((h) => h.methodId === a.methodId).length
      : s.stats.launderOk;
  return { done: Math.min(done, a.count), need: a.count, passed: done >= a.count };
}

/** ตัวละครที่ผ่านออดิชั่นในรอบนี้และยังไม่มี */
export function auditionsPassed(s: GameState, c: GameContent, owned: readonly string[]): string[] {
  if (!s.end) return [];
  return c.characters
    .filter(
      (ch) =>
        ch.price !== undefined &&
        !owned.includes(charKey(ch.id)) &&
        auditionProgress(s, ch)?.passed,
    )
    .map((ch) => ch.id);
}
