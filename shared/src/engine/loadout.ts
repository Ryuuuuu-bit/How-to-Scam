// บ้านกับตู้เสื้อผ้า: ซื้อด้วยเงินใต้ดินหลังจบรอบ แล้วติดตัวเข้ารอบถัดไป
// server ต่อท้าย seed ด้วย "|L=<home>.<outfit>" ตอนเริ่มรอบ (ตรวจแล้วว่าผู้เล่นมีของจริง)
// replay จึงได้ของชุดเดียวกันจาก seed โดยไม่ต้องเก็บอะไรเพิ่ม
// Daily Challenge ไม่ติดของ เพื่อให้ทุกคนแข่งกันเท่ากัน

export type HomeId = 'room' | 'condo' | 'house';

export interface HomeDef {
  id: HomeId;
  name: string;
  /** ราคาเงินใต้ดิน (ห้องเช่าได้ฟรี) */
  price: number;
  desc: string;
  /** Heat ลดเพิ่มในวันพัก */
  quietHeat: number;
  /** โอกาสหนีตำรวจรอด +% */
  escapePct: number;
  /** หนีรอดแล้ว Heat ลดลงอีก */
  escapeHeat: number;
}

export const homes: readonly HomeDef[] = [
  {
    id: 'room',
    name: 'ห้องเช่าแฟลตหลังตลาด',
    price: 0,
    desc: 'พัดลมเสียงดัง ฝ้ารั่ว แต่ค่าเช่าถูก ไม่มีใครจำหน้าคุณได้ (เพราะไม่มีใครอยากมา)',
    quietHeat: 0,
    escapePct: 0,
    escapeHeat: 0,
  },
  {
    id: 'condo',
    name: 'คอนโดวิวทางด่วน',
    price: 4_000,
    desc: 'นิติบุคคลไม่ถามอะไร ลิฟต์ต้องแตะบัตร ตำรวจขึ้นมายาก',
    quietHeat: 3,
    escapePct: 5,
    escapeHeat: 5,
  },
  {
    id: 'house',
    name: 'บ้านเดี่ยวรั้วสูงท้ายหมู่บ้าน',
    price: 10_000,
    desc: 'รั้วสูง หมาดุ มีห้องเก็บของใต้บันได ซ่อนตัวได้นานโดยไม่มีใครรู้',
    quietHeat: 6,
    escapePct: 10,
    escapeHeat: 12,
  },
];

export type OutfitId = 'casual' | 'banker' | 'white' | 'influencer' | 'trader' | 'rider';

export interface OutfitDef {
  id: OutfitId;
  name: string;
  price: number;
  desc: string;
  /** สรุปผลแบบสั้นที่โชว์บนการ์ด */
  effect: string;
  /** รายได้ +% เฉพาะวิธีเหล่านี้ */
  incomePct?: { pct: number; methodIds: readonly string[] };
  /** Heat ทุกงาน +/-% */
  heatPct?: number;
  /** คอลเซ็นเตอร์: โอกาสหลอกสำเร็จ +% */
  callPct?: number;
}

export const outfits: readonly OutfitDef[] = [
  {
    id: 'casual',
    name: 'เสื้อยืดตลาดนัด',
    price: 0,
    desc: 'ตัวเดียวกับที่ใส่มาตั้งแต่วันแรก ซักแล้วสามรอบ',
    effect: 'ไม่มีผลพิเศษ',
  },
  {
    id: 'banker',
    name: 'ชุดพนักงานแบงก์',
    price: 2_500,
    desc: 'เชิ้ตรีดเรียบ ป้ายชื่อปลอม เสียงพูดสุภาพขึ้นเองโดยอัตโนมัติ',
    effect: 'คอลเซ็นเตอร์: เหยื่อเชื่อง่ายขึ้น โอกาสสำเร็จ +8%',
    callPct: 8,
  },
  {
    id: 'white',
    name: 'ชุดขาวสายบุญ',
    price: 2_500,
    desc: 'ขาวทั้งตัว ถือย่ามหนึ่งใบ ใครเห็นก็อยากร่วมทำบุญ',
    effect: 'มูลนิธิกับงานบุญ: รายได้ +15%',
    incomePct: { pct: 15, methodIds: ['foundation', 'merit'] },
  },
  {
    id: 'influencer',
    name: 'ชุดอินฟลูแบรนด์ก๊อป',
    price: 3_000,
    desc: 'แว่นดำ กระเป๋าโลโก้ใหญ่เกินจริง ไลฟ์ทีไรคนเข้าเป็นพัน',
    effect: 'ขายของไม่ส่งกับหลอกรัก: รายได้ +12%',
    incomePct: { pct: 12, methodIds: ['fake_shop', 'romance'] },
  },
  {
    id: 'trader',
    name: 'สูทเทรดเดอร์คริปโต',
    price: 3_500,
    desc: 'สูทเงาวับ นาฬิกาเรือนใหญ่ พูดคำว่า "พาสซีฟอินคัม" ได้ไม่ติดขัด',
    effect: 'แชร์ลูกโซ่กับเว็บพนัน: รายได้ +12%',
    incomePct: { pct: 12, methodIds: ['ponzi', 'gambling'] },
  },
  {
    id: 'rider',
    name: 'เสื้อไรเดอร์ส่งอาหาร',
    price: 2_000,
    desc: 'กลืนไปกับถนนทุกเส้น ไม่มีกล้องตัวไหนสนใจคนส่งข้าว',
    effect: 'ทุกงาน: Heat −8%',
    heatPct: -8,
  },
];

export interface Loadout {
  home: HomeId;
  outfit: OutfitId;
}

export const homeKey = (id: HomeId) => `home:${id}`;
export const outfitKey = (id: OutfitId) => `outfit:${id}`;

const [roomHome] = homes as [HomeDef];
export const homeDef = (id: HomeId): HomeDef => homes.find((h) => h.id === id) ?? roomHome;
const [casualFit] = outfits as [OutfitDef];
export const outfitDef = (id: OutfitId): OutfitDef => outfits.find((o) => o.id === id) ?? casualFit;

/** ราคาบ้านกับชุดในตลาดใต้ดิน (ของฟรีไม่ขาย) */
export const loadoutPrices: Record<string, number> = Object.fromEntries([
  ...homes.filter((h) => h.price > 0).map((h) => [homeKey(h.id), h.price]),
  ...outfits.filter((o) => o.price > 0).map((o) => [outfitKey(o.id), o.price]),
]);

/** ของที่ต้องมีก่อนซื้อ: บ้านเดี่ยวต้องผ่านคอนโดก่อน */
export function marketRequires(key: string): string | null {
  return key === homeKey('house') ? homeKey('condo') : null;
}

/** บ้านที่ดีที่สุดที่มี */
export function bestHome(owned: readonly string[]): HomeId {
  for (const h of [...homes].reverse()) if (h.price === 0 || owned.includes(homeKey(h.id))) return h.id;
  return 'room';
}

export const ownsOutfit = (owned: readonly string[], id: OutfitId) =>
  outfitDef(id).price === 0 || owned.includes(outfitKey(id));

/** ของที่ผู้เล่นเลือกเข้ารอบ: ใช้ได้เฉพาะของที่มีจริง */
export function loadoutFor(owned: readonly string[], outfit: OutfitId | undefined): Loadout {
  return { home: bestHome(owned), outfit: outfit && ownsOutfit(owned, outfit) ? outfit : 'casual' };
}

const loadoutRe = /\|L=([a-z]+)\.([a-z]+)$/;

export function seedWithLoadout(seed: string, l: Loadout): string {
  if (l.home === 'room' && l.outfit === 'casual') return seed;
  return `${seed}|L=${l.home}.${l.outfit}`;
}

/** อ่านบ้านกับชุดจาก seed (seed เก่าหรือ Daily ได้ห้องเช่ากับเสื้อยืด) */
export function loadoutOf(seed: string): Loadout {
  const m = loadoutRe.exec(seed);
  const home = homes.find((h) => h.id === m?.[1])?.id ?? 'room';
  const outfit = outfits.find((o) => o.id === m?.[2])?.id ?? 'casual';
  return { home, outfit };
}

/** บ้านกับชุดของรอบนี้ */
export const homeOf = (s: { seed: string }): HomeDef => homeDef(loadoutOf(s.seed).home);
export const outfitOf = (s: { seed: string }): OutfitDef => outfitDef(loadoutOf(s.seed).outfit);
