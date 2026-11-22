import type { GameContent, Perk } from '../types/content';
import type { GameState } from '../types/state';
import { getCharacter } from './lookup';

export function perksOf(s: GameState, c: GameContent): Perk[] {
  return getCharacter(c, s.characterId).perks;
}

/** ดึง perk ทุกตัวชนิดเดียวกัน */
export function perksOfKind<K extends Perk['kind']>(
  s: GameState,
  c: GameContent,
  kind: K,
): Extract<Perk, { kind: K }>[] {
  return perksOf(s, c).filter((p): p is Extract<Perk, { kind: K }> => p.kind === kind);
}

/** ราคาหลังส่วนลดของอาชีพ */
export function priceOf(s: GameState, c: GameContent, itemId: string, price: number): number {
  const offer = s.offer ? c.offers.find((o) => o.id === s.offer?.id) : undefined;
  const offerPct =
    offer?.kind === 'twist' && offer.discount?.itemIds.includes(itemId) ? offer.discount.pct : 0;
  const off =
    perksOfKind(s, c, 'shopDiscount')
      .filter((p) => p.itemIds.includes(itemId))
      .reduce((sum, p) => sum + p.pct, 0) + offerPct;
  return Math.round((price * (100 - Math.min(90, off))) / 100);
}

/** Karma ที่เปลี่ยน คูณด้วย perk ของอาชีพ (เฉพาะทางลบ) */
export function karmaDelta(s: GameState, c: GameContent, value: number): number {
  if (value >= 0) return value;
  const mul = perksOfKind(s, c, 'karmaMul').reduce((m, p) => m * p.mul, 1);
  return Math.round(value * mul);
}
