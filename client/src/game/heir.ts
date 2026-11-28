// ข้อความของระบบลูกศิษย์สืบทอดแก๊ง
import type { HeirOffer } from '@hts/shared';
import { content } from '@hts/shared/data';
import { npcs } from '@hts/shared';

export function heirGiftText(h: HeirOffer): string {
  const a = content.config.apprentice;
  if (h.gift === 'cash') return `เงินก้นถุงจากอาจารย์ ฿${a.giftCash.toLocaleString('th-TH')}`;
  if (h.gift === 'fame') return `ชื่อเสียงของอาจารย์ +${a.giftFame}`;
  return `${npcs[h.gift].name} ยังจำอาจารย์ได้ เริ่มรอบเป็นพวกเดียวกัน`;
}

export function heirDebtText(h: HeirOffer): string {
  const a = content.config.apprentice;
  if (h.debt === 'debt') return `หนี้ค้างของอาจารย์ ฿${a.debtCash.toLocaleString('th-TH')}`;
  if (h.debt === 'case') return `คดีค้างของอาจารย์ หลักฐานเริ่มที่ ${a.oldCaseWeight}`;
  return 'ไม่มีภาระค้าง';
}
