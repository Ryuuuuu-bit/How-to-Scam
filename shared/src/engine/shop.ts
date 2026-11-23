// 1.0 ร้านอัปเกรดใหม่: แอปมือถือ ตลาดมืดรายคืน ของประจำสถานที่ ดีลเถื่อนเฮียโต้ง และห้องลับ
// เปิดเฉพาะรอบซอยมีชีวิต (มี s.soi) รอบเก่าจึง replay ได้ผลเดิม
// ตลาดมืดสุ่มจาก seed + วัน ด้วย RNG แยก จึงไม่ไปเลื่อนลำดับสุ่มของเกมหลัก
import type { GameContent, ShopItem } from '../types/content';
import type { GameState } from '../types/state';
import { getShopItem } from './lookup';
import { hashSeed, Rng } from './rng';

export const marketSlots = 3;
export const marketRareChance = 15;
export const holdPrice = 300;
export const dealDiscount = 50;
export const contrabandWeight = 2;

export const owns = (s: GameState, id: string): boolean => (s.upgrades[id] ?? 0) > 0;
export const hideoutTier = (s: GameState): number => s.upgrades.hideout ?? 0;

/** จำนวนลูกน้องที่จ้างได้ (ห้องลับขั้น 1 และ 3 เพิ่มขั้นละคน) */
export function henchmanCap(s: GameState, c: GameContent): number {
  const tier = hideoutTier(s);
  return getShopItem(c, 'henchman').maxStack + (tier >= 1 ? 1 : 0) + (tier >= 3 ? 1 : 0);
}

/** ราคาขั้นถัดไปของห้องลับ หรือราคาปกติของของชิ้นอื่น */
export function basePrice(s: GameState, item: ShopItem): number {
  if (item.tierPrices) return item.tierPrices[Math.min(item.tierPrices.length - 1, s.upgrades[item.id] ?? 0)] ?? item.price;
  return item.price;
}

/** ของประจำสถานที่ชิ้นนี้ปลดแล้วหรือยัง */
export function placeUnlocked(s: GameState, item: ShopItem): boolean {
  if (!item.unlock) return true;
  const p = s.soi?.places[item.unlock.place as keyof NonNullable<GameState['soi']>['places']];
  return p?.form === item.unlock.form;
}

/** ของที่ยังซื้อได้ (ยังไม่เต็ม) */
const open = (s: GameState, it: ShopItem) => (s.upgrades[it.id] ?? 0) < it.maxStack;

/** เปิดร้านท้ายวัน: วางของตลาดมืด 3 ช่องกับดีลเถื่อน 1 ชิ้น */
export function openShop(s: GameState, c: GameContent): void {
  if (!s.soi) return;
  if (s.market?.day === s.day) return;
  const rng = new Rng(hashSeed(`${s.seed}:market:${s.day}`));
  const held = s.market?.hold;
  const market = c.shopItems.filter((it) => it.line === 'market' && open(s, it));
  const offers: string[] = [];
  if (held && market.some((it) => it.id === held)) offers.push(held);
  while (offers.length < marketSlots) {
    const left = market.filter((it) => !offers.includes(it.id));
    if (left.length === 0) break;
    const rares = left.filter((it) => it.rare);
    const commons = left.filter((it) => !it.rare);
    const pool = rares.length && (commons.length === 0 || rng.chance(marketRareChance)) ? rares : commons;
    offers.push(rng.pick(pool).id);
  }
  const dealPool = c.shopItems.filter(
    (it) => (it.line === 'app' || (it.line === 'place' && placeUnlocked(s, it))) && open(s, it),
  );
  const deal = dealPool.length ? rng.pick(dealPool).id : null;
  s.market = { day: s.day, offers, deal, bought: [] };
}

/** ผลทันทีของของในตลาดมืดและของประจำสถานที่ */
export function applyNow(s: GameState, item: ShopItem): void {
  const now = item.now;
  if (!now) return;
  if (now.fame) s.fame += now.fame;
  if (now.karma) s.karma += now.karma;
  if (now.clearEvidence && s.case) {
    let left = now.clearEvidence;
    const oldest = s.case.evidence.filter((e) => e.kind !== 'decoy').sort((a, b) => a.day - b.day || a.id - b.id);
    for (const e of oldest) {
      if (left <= 0) break;
      const cut = Math.min(left, e.weight);
      e.weight -= cut;
      left -= cut;
    }
    s.case.evidence = s.case.evidence.filter((e) => e.kind === 'decoy' || e.weight > 0);
  }
  if (now.rep && s.soi) {
    const rep = s.soi.rep;
    const ids = Object.keys(rep) as (keyof typeof rep)[];
    const targets = now.rep === 'all' ? ids : [ids.reduce((low, id) => (rep[id] < rep[low] ? id : low), ids[0] as keyof typeof rep)];
    for (const id of targets) rep[id] = Math.min(3, rep[id] + 1);
  }
}

/** รายได้/Heat จากห้องลับ */
export function hideoutPct(s: GameState, key: 'incomePct' | 'heatPct'): number {
  const tier = hideoutTier(s);
  if (key === 'heatPct') return tier >= 1 ? -5 : 0;
  return tier >= 3 ? 5 : 0;
}

/** Heat ที่ลดเพิ่มในวันพักงาน */
export const quietGearBonus = (s: GameState): number => (owns(s, 'mk_lucky_cat') ? 3 : 0) + (hideoutTier(s) >= 2 ? 3 : 0);

/** หลักฐานที่สารวัตรต้องมีเพิ่มก่อนบุก */
export const raidGearBonus = (s: GameState): number => (owns(s, 'mk_inspector_photo') ? 2 : 0) + (hideoutTier(s) >= 3 ? 2 : 0);

/** ชื่อเสียงต่อกะจากของประจำสถานที่ */
export function famePerShift(s: GameState, c: GameContent, methodId: string): number {
  let n = 0;
  for (const [id, count] of Object.entries(s.upgrades)) {
    const it = getShopItem(c, id);
    if (it.famePerShift && it.methodIds?.includes(methodId)) n += it.famePerShift * count;
  }
  return n;
}
