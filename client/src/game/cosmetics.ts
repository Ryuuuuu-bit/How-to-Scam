import type { UnlockProgress } from '@hts/shared';

export const menuScenes = [
  { id: 'menu', name: 'ฐานบัญชาการ', scene: 'menu', xp: 0, hint: 'มีให้ตั้งแต่เริ่มเกม' },
  { id: 'condo', name: 'คอนโดวิวหลักล้าน', scene: 'menu_condo', xp: 300, hint: 'ค่าหัวถึง ฿6 ล้าน' },
  { id: 'jail', name: 'ห้องพักมีลูกกรง', scene: 'menu_jail', ending: 'jailed', hint: 'พบฉากจบติดคุก' },
  {
    id: 'farm',
    name: 'กลับบ้านทำนา',
    scene: 'menu_farm',
    ending: 'home_again',
    hint: 'พบฉากจบกลับบ้าน',
  },
  {
    id: 'island',
    name: 'เกาะพักใจ',
    scene: 'menu_island',
    ending: 'out_scammed_abroad',
    hint: 'พบฉากจบต่างแดน',
  },
  {
    id: 'studio',
    name: 'สตูดิโอกลับตัว',
    scene: 'menu_studio',
    endings: ['redeemed', 'whistleblower', 'scam_hunter'],
    hint: 'พบฉากจบกลับตัว พยานปากเอก หรือนักล่ามิจฉาชีพ',
  },
] as const;

export const skins = [
  {
    id: 'ex_insurance_gold',
    characterId: 'ex_insurance',
    name: 'สูททองคำ',
    xp: 150,
    hint: 'ค่าหัวถึง ฿3 ล้าน',
  },
  {
    id: 'gamer_kid_pro',
    characterId: 'gamer_kid',
    name: 'โปรเพลเยอร์',
    xp: 250,
    hint: 'ค่าหัวถึง ฿5 ล้าน',
  },
  {
    id: 'temple_kid_fair',
    characterId: 'temple_kid',
    name: 'ดาวงานวัด',
    xp: 350,
    hint: 'ค่าหัวถึง ฿7 ล้าน',
  },
  {
    id: 'live_seller_idol',
    characterId: 'live_seller',
    name: 'ไอดอลไลฟ์สด',
    xp: 500,
    hint: 'ค่าหัวถึง ฿10 ล้าน',
  },
  {
    id: 'phone_tech_hacker',
    characterId: 'phone_tech',
    name: 'แฮกเกอร์จอเขียว',
    xp: 650,
    hint: 'ค่าหัวถึง ฿13 ล้าน',
  },
  {
    id: 'orange_cat_boss',
    characterId: 'orange_cat',
    name: 'บอสเหมียว',
    ending: 'confused_retiree',
    hint: 'พบฉากจบเกษียณแบบงง ๆ',
  },
] as const;

interface Requirement {
  id: string;
  xp?: number;
  ending?: string;
  endings?: readonly string[];
  characterId?: string;
}

/** key ในตลาดใต้ดิน เช่น "skin:ex_insurance_gold" */
export const cosmeticKey = (item: { id: string; characterId?: string }) =>
  item.characterId ? `skin:${item.id}` : `scene:${item.id}`;

export function cosmeticUnlocked(item: Requirement, progress: UnlockProgress): boolean {
  if ((progress.owned ?? []).includes(cosmeticKey(item))) return true;
  return (
    (item.xp === undefined || progress.xp >= item.xp) &&
    (item.ending === undefined || progress.endings.includes(item.ending)) &&
    (item.endings === undefined || item.endings.some((id) => progress.endings.includes(id)))
  );
}

export interface Cosmetics {
  scene: string;
  skins: Record<string, string>;
}
const keyFor = (uid?: string) => `hts.cosmetics.v1.${uid ?? 'offline'}`;

export function loadCosmetics(progress: UnlockProgress, uid?: string): Cosmetics {
  const result: Cosmetics = { scene: 'menu', skins: {} };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(keyFor(uid)) ?? 'null');
    if (!saved || typeof saved !== 'object') return result;
    const data = saved as { scene?: unknown; skins?: unknown };
    const scene = menuScenes.find((s) => s.id === data.scene);
    if (scene && cosmeticUnlocked(scene, progress)) result.scene = scene.id;
    if (data.skins && typeof data.skins === 'object') {
      for (const skin of skins) {
        if (
          (data.skins as Record<string, unknown>)[skin.characterId] === skin.id &&
          cosmeticUnlocked(skin, progress)
        ) {
          result.skins[skin.characterId] = skin.id;
        }
      }
    }
  } catch {
    /* Storage can be unavailable. Default cosmetics remain playable. */
  }
  return result;
}

export function saveCosmetics(value: Cosmetics, uid?: string): void {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(value));
  } catch {
    /* Session selection still works. */
  }
}

export function characterArt(characterId: string, cosmetics: Cosmetics): string {
  const skin = cosmetics.skins[characterId];
  return skin ? `skin:${skin}` : `char:${characterId}`;
}
