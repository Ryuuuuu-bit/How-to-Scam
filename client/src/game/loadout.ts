import { cars, loadoutFor, outfits, pets, type Loadout, type LoadoutPick } from '@hts/shared';

// ของที่เลือกติดตัวไว้ (ชุด สัตว์เลี้ยง รถ ทางกลับใจ) เก็บในเครื่อง แยกตามบัญชี
// บ้านใช้หลังที่ดีที่สุดที่มีเสมอ
const keyFor = (uid?: string) => `hts.loadout.v2.${uid ?? 'offline'}`;
const oldOutfitKey = (uid?: string) => `hts.outfit.v1.${uid ?? 'offline'}`;

export function loadPick(uid?: string): Required<LoadoutPick> {
  let raw: Partial<Record<keyof LoadoutPick, unknown>> = {};
  let oldOutfit: string | null = null;
  try {
    raw = JSON.parse(localStorage.getItem(keyFor(uid)) ?? '{}') as typeof raw;
    oldOutfit = localStorage.getItem(oldOutfitKey(uid));
  } catch {
    /* ใช้ค่าเริ่มต้น */
  }
  const outfitId = typeof raw.outfit === 'string' ? raw.outfit : oldOutfit;
  return {
    outfit: outfits.find((o) => o.id === outfitId)?.id ?? 'casual',
    pet: pets.find((p) => p.id === raw.pet)?.id ?? 'none',
    car: cars.find((c) => c.id === raw.car)?.id ?? 'none',
    reform: raw.reform === true,
  };
}

export function savePick(pick: LoadoutPick, uid?: string): Required<LoadoutPick> {
  const next = { ...loadPick(uid), ...pick };
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(next));
  } catch {
    /* ใช้ได้เฉพาะรอบนี้ */
  }
  return next;
}

/** ของที่จะติดเข้ารอบถัดไป */
export function currentLoadout(owned: readonly string[], uid?: string): Loadout {
  return loadoutFor(owned, loadPick(uid));
}
