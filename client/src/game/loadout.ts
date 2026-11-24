import { loadoutFor, outfits, type Loadout, type OutfitId } from '@hts/shared';

// ชุดที่เลือกใส่ไว้ในตู้ (เก็บในเครื่อง แยกตามบัญชี) บ้านใช้หลังที่ดีที่สุดที่มีเสมอ
const keyFor = (uid?: string) => `hts.outfit.v1.${uid ?? 'offline'}`;

export function loadOutfit(uid?: string): OutfitId {
  try {
    const id = localStorage.getItem(keyFor(uid));
    return outfits.find((o) => o.id === id)?.id ?? 'casual';
  } catch {
    return 'casual';
  }
}

export function saveOutfit(id: OutfitId, uid?: string): void {
  try {
    localStorage.setItem(keyFor(uid), id);
  } catch {
    /* ใส่ได้เฉพาะรอบนี้ */
  }
}

/** บ้านกับชุดที่จะติดเข้ารอบถัดไป */
export function currentLoadout(owned: readonly string[], uid?: string): Loadout {
  return loadoutFor(owned, loadOutfit(uid));
}
