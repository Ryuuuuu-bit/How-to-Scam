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

export type PetId = 'none' | 'dog' | 'cat' | 'parrot';

export interface PetDef {
  id: PetId;
  name: string;
  price: number;
  desc: string;
  effect: string;
  /** โอกาสหนีตำรวจรอด +% */
  escapePct?: number;
  /** วันพัก: ได้เงินสกปรกเพิ่ม (ของที่คาบมาขายได้) */
  quietCash?: number;
  /** คอลเซ็นเตอร์: ถ้ามุกไม่ตรงจุดอ่อน โอกาสสำเร็จ +% */
  missCallPct?: number;
}

export const pets: readonly PetDef[] = [
  { id: 'none', name: 'ไม่มีสัตว์เลี้ยง', price: 0, desc: 'ห้องเงียบ มีแต่เสียงพัดลม', effect: 'ไม่มีผลพิเศษ' },
  {
    id: 'dog',
    name: 'ไอ้ด่าง หมาเฝ้าซอย',
    price: 3_000,
    desc: 'ได้ยินเสียงรถตำรวจก่อนคนทั้งซอยห้านาที แล้วเห่าไม่หยุด',
    effect: 'เห่าเตือนตำรวจ: หนีรอด +7%',
    escapePct: 7,
  },
  {
    id: 'cat',
    name: 'ส้มจี๊ด แมวขโมย',
    price: 2_500,
    desc: 'ออกไปตอนตีสอง กลับมาพร้อมของที่ไม่รู้ว่าของใคร',
    effect: 'คาบของมาให้: วันพักได้เงิน +฿400',
    quietCash: 400,
  },
  {
    id: 'parrot',
    name: 'เจ๊แก้ว นกแก้วปากหวาน',
    price: 3_500,
    desc: 'จำสคริปต์คอลเซ็นเตอร์ได้ทุกบรรทัด พูดแทนได้ตอนคุณพูดผิด',
    effect: 'พูดหลอกแทน: มุกไม่ตรงจุด โอกาสสำเร็จ +12%',
    missCallPct: 12,
  },
];

export type CarId = 'none' | 'scooter' | 'pickup' | 'sports';

export interface CarDef {
  id: CarId;
  name: string;
  price: number;
  desc: string;
  effect: string;
  escapePct: number;
  /** หนีรอดแล้ว Heat ต่ำลงอีก */
  escapeHeat?: number;
  /** Heat ทุกงาน +/-% (รถเด่นเกินไปคนจำได้) */
  heatPct?: number;
}

export const cars: readonly CarDef[] = [
  { id: 'none', name: 'เดินเท้า', price: 0, desc: 'วิ่งเร็วเท่าที่ขาจะพาไป', effect: 'ไม่มีผลพิเศษ', escapePct: 0 },
  {
    id: 'scooter',
    name: 'มอเตอร์ไซค์ป้ายแดงถาวร',
    price: 1_500,
    desc: 'ลัดเข้าซอยแคบได้ทุกซอย ป้ายแดงมาสามปีแล้ว',
    effect: 'หนีตำรวจรอด +4%',
    escapePct: 4,
  },
  {
    id: 'pickup',
    name: 'กระบะซิ่งแต่งหล่อ',
    price: 4_500,
    desc: 'ท้ายกระบะคลุมผ้าใบ ซ่อนคนได้สองคนกับลังซิมอีกสิบลัง',
    effect: 'หนีรอด +8% และ Heat หลังหนีลดอีก 5',
    escapePct: 8,
    escapeHeat: 5,
  },
  {
    id: 'sports',
    name: 'รถสปอร์ตสีส้มสะท้อนแสง',
    price: 12_000,
    desc: 'เร็วที่สุดในจังหวัด และเด่นที่สุดในจังหวัดด้วย',
    effect: 'หนีรอด +15% แต่ทุกงาน Heat +5%',
    escapePct: 15,
    heatPct: 5,
  },
];

/** ทุนเปิดร้านสุจริต: ซื้อครั้งเดียว แล้วเลือกได้ว่ารอบไหนจะตั้งใจกลับใจ */
export const reformKey = 'reform:shop';
export const reformPrice = 6_000;
export const reformFlag = 'reform_shop';
/** รอบที่ตั้งใจกลับใจ รายได้ทุกงานลดลง เพราะใจไม่อยู่กับงาน */
export const reformIncomePct = -10;
export const reformStartKarma = 5;

export interface Loadout {
  home: HomeId;
  outfit: OutfitId;
  pet: PetId;
  car: CarId;
  reform: boolean;
}

/** ของที่ผู้เล่นเลือกเอง (บ้านใช้หลังที่ดีที่สุดเสมอ) */
export interface LoadoutPick {
  outfit?: OutfitId;
  pet?: PetId;
  car?: CarId;
  reform?: boolean;
}

export const homeKey = (id: HomeId) => `home:${id}`;
export const outfitKey = (id: OutfitId) => `outfit:${id}`;
export const petKey = (id: PetId) => `pet:${id}`;
export const carKey = (id: CarId) => `car:${id}`;

const [roomHome] = homes as [HomeDef];
export const homeDef = (id: HomeId): HomeDef => homes.find((h) => h.id === id) ?? roomHome;
const [casualFit] = outfits as [OutfitDef];
export const outfitDef = (id: OutfitId): OutfitDef => outfits.find((o) => o.id === id) ?? casualFit;
const [noPet] = pets as [PetDef];
export const petDef = (id: PetId): PetDef => pets.find((p) => p.id === id) ?? noPet;
const [onFoot] = cars as [CarDef];
export const carDef = (id: CarId): CarDef => cars.find((x) => x.id === id) ?? onFoot;

/** ราคาบ้าน ชุด สัตว์เลี้ยง รถ และทุนกลับใจในตลาดใต้ดิน (ของฟรีไม่ขาย) */
export const loadoutPrices: Record<string, number> = Object.fromEntries([
  ...homes.filter((h) => h.price > 0).map((h) => [homeKey(h.id), h.price]),
  ...outfits.filter((o) => o.price > 0).map((o) => [outfitKey(o.id), o.price]),
  ...pets.filter((p) => p.price > 0).map((p) => [petKey(p.id), p.price]),
  ...cars.filter((x) => x.price > 0).map((x) => [carKey(x.id), x.price]),
  [reformKey, reformPrice],
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
export const ownsPet = (owned: readonly string[], id: PetId) =>
  petDef(id).price === 0 || owned.includes(petKey(id));
export const ownsCar = (owned: readonly string[], id: CarId) =>
  carDef(id).price === 0 || owned.includes(carKey(id));

/** ของที่ผู้เล่นเลือกเข้ารอบ: ใช้ได้เฉพาะของที่มีจริง */
export function loadoutFor(owned: readonly string[], pick: LoadoutPick = {}): Loadout {
  const { outfit, pet, car } = pick;
  return {
    home: bestHome(owned),
    outfit: outfit && ownsOutfit(owned, outfit) ? outfit : 'casual',
    pet: pet && ownsPet(owned, pet) ? pet : 'none',
    car: car && ownsCar(owned, car) ? car : 'none',
    reform: !!pick.reform && owned.includes(reformKey),
  };
}

// รูปแบบเก่า |L=home.outfit ยังอ่านได้ รูปแบบใหม่ต่อท้าย .pet.car.(reform|plain)
const loadoutRe = /\|L=([a-z]+)\.([a-z]+)(?:\.([a-z]+)\.([a-z]+)\.([a-z]+))?$/;

export function seedWithLoadout(seed: string, l: Loadout): string {
  const extra = l.pet !== 'none' || l.car !== 'none' || l.reform;
  if (!extra && l.home === 'room' && l.outfit === 'casual') return seed;
  const tail = extra ? `.${l.pet}.${l.car}.${l.reform ? 'reform' : 'plain'}` : '';
  return `${seed}|L=${l.home}.${l.outfit}${tail}`;
}

/** อ่านของจาก seed (seed เก่าหรือ Daily ได้ห้องเช่ากับเสื้อยืด ไม่มีสัตว์ ไม่มีรถ) */
export function loadoutOf(seed: string): Loadout {
  const m = loadoutRe.exec(seed);
  const home = homes.find((h) => h.id === m?.[1])?.id ?? 'room';
  const outfit = outfits.find((o) => o.id === m?.[2])?.id ?? 'casual';
  const pet = pets.find((p) => p.id === m?.[3])?.id ?? 'none';
  const car = cars.find((x) => x.id === m?.[4])?.id ?? 'none';
  return { home, outfit, pet, car, reform: m?.[5] === 'reform' };
}

/** บ้านกับชุดของรอบนี้ */
export const homeOf = (s: { seed: string }): HomeDef => homeDef(loadoutOf(s.seed).home);
export const outfitOf = (s: { seed: string }): OutfitDef => outfitDef(loadoutOf(s.seed).outfit);
export const petOf = (s: { seed: string }): PetDef => petDef(loadoutOf(s.seed).pet);
export const carOf = (s: { seed: string }): CarDef => carDef(loadoutOf(s.seed).car);
export const reformOf = (s: { seed: string }): boolean => loadoutOf(s.seed).reform;
