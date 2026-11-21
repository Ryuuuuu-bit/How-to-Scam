// ชนิดข้อมูลของ "เนื้อหาเกม" ที่อยู่ใน /shared/data
// เพิ่ม/แก้เนื้อหาได้โดยไม่ต้องแตะ logic ใน engine

/** ข้อความหลายภาษา ตอนนี้มีแค่ไทย เติม en ได้ภายหลัง */
export interface LocalizedText {
  th: string;
  en?: string;
}

/** ช่วงตัวเลข [ต่ำสุด, สูงสุด] รวมปลายทั้งสองข้าง */
export type Range = readonly [number, number];

export type MethodId = string;
export type CardId = string;
export type EventId = string;
export type CharacterId = string;
export type ShopItemId = string;
export type DangerSignId = string;
export type EndingId = string;
export type PitchId = string;
export type VictimId = string;

export type GangLevel = 1 | 2 | 3 | 4;

/** สถิติที่ effect แตะได้ */
export type Stat = 'dirtyCash' | 'cleanCash' | 'heat' | 'fame' | 'karma';

/** จุดอ่อนของเหยื่อในมินิเกมคอลเซ็นเตอร์ */
export type Weakness = 'greed' | 'fear' | 'faith' | 'lonely';

/** กลไกเฉพาะของแต่ละวิธีโกง */
export type MethodMechanic =
  | 'none'
  | 'romance' // ต้องเลี้ยงเหยื่อต่อเนื่อง
  | 'callCenter' // มินิเกมจับคู่มุก
  | 'foundation' // ตัวนับเวลาก่อนโดนขุด (Phase 4)
  | 'merit' // โบนัสเทศกาล (Phase 4)
  | 'gambling' // จ้างดารา (Phase 4)
  | 'ponzi'; // โอกาสล่มสะสม (Phase 4)

export interface ScamMethod {
  id: MethodId;
  level: GangLevel;
  mechanic: MethodMechanic;
  /** ต้นทุนต่อวัน (หักจากเงินสด) */
  cost: number;
  /** รายได้พื้นฐานต่อวัน */
  income: Range;
  /** Heat ที่เพิ่มต่อวัน */
  heat: Range;
  /** ชื่อเสียงโซเชียลที่เปลี่ยนต่อวัน */
  fame?: number;
  /** Karma ที่เปลี่ยนต่อวัน (ติดลบ = บาป) */
  karma: number;
  name: LocalizedText;
  desc: LocalizedText;
}

export type Effect =
  /** บวก/ลบค่าคงที่ หรือสุ่มในช่วง */
  | { kind: 'add'; stat: Stat; value: number | Range }
  /** คูณค่า เช่น เงินสกปรก × 0.5 */
  | { kind: 'mul'; stat: Stat; value: number }
  /** ตั้ง/ลบ flag ไว้ใช้เป็นเงื่อนไขภายหลัง */
  | { kind: 'flag'; flag: string; remove?: boolean }
  /** ตัวคูณชั่วคราวหลายวัน เช่น มูลนิธิ ×3 ช่วงน้ำท่วม */
  | {
      kind: 'modifier';
      target: 'income' | 'heat';
      methodId?: MethodId;
      /** +200 = ×3, -50 = ครึ่งเดียว */
      pct: number;
      days: number;
    }
  /** ลูกน้องหายไป 1 คน (หนี/โดนจับ) */
  | { kind: 'loseHenchman' }
  /** ความภักดีลูกน้องทุกคนเปลี่ยน */
  | { kind: 'loyalty'; value: number }
  /** ความผูกพันเหยื่อหลอกรักเปลี่ยน */
  | { kind: 'romanceBond'; value: number };

export interface EventOutcome {
  /** น้ำหนักโอกาสของผลลัพธ์นี้ (ค่าเริ่มต้น 1) */
  weight?: number;
  text: LocalizedText;
  effects: Effect[];
}

export interface EventChoice {
  text: LocalizedText;
  /** สุ่ม 1 ผลตามน้ำหนัก */
  outcomes: EventOutcome[];
}

export interface EventCondition {
  /** แผนของวันนี้ต้องเป็นหนึ่งในนี้ */
  methods?: MethodId[];
  heat?: Range;
  day?: Range;
  minLevel?: GangLevel;
  flagsAll?: string[];
  flagsNone?: string[];
  /** ต้องมีลูกน้องอย่างน้อย 1 คน */
  needsHenchman?: boolean;
  /** เงินสกปรกขั้นต่ำ */
  minDirtyCash?: number;
}

export type EventCategory = 'lucky' | 'unlucky' | 'silly' | 'karma';

export interface GameEvent {
  id: EventId;
  category: EventCategory;
  weight: number;
  /** เกิดได้ครั้งเดียวต่อรอบ (ค่าเริ่มต้น true) */
  once?: boolean;
  when: EventCondition;
  title: LocalizedText;
  body: LocalizedText;
  /** 1–3 ทางเลือก */
  choices: EventChoice[];
}

export interface LaunderCard {
  id: CardId;
  /** โอกาสสำเร็จ 0–100 */
  successPct: number;
  /** % ค่าธรรมเนียม/ส่วนที่หายตอนสำเร็จ */
  lossPct: number;
  /** % ที่หายตอนล้มเหลว */
  failLossPct: number;
  /** Heat ที่เพิ่ม (ล้มเหลวได้ ×2) */
  heat: number;
  /** ฟอกได้สูงสุดต่อครั้ง */
  capacity: number;
  karma?: number;
  name: LocalizedText;
  desc: LocalizedText;
  successText: LocalizedText;
  failText: LocalizedText;
}

export interface Character {
  id: CharacterId;
  /** โบนัสรายได้ของวิธีโกงที่ถนัด */
  bonus: { methodId: MethodId; pct: number };
  startDirtyCash?: number;
  name: LocalizedText;
  desc: LocalizedText;
}

export type ShopItemKind = 'daily' | 'permanent' | 'henchman';

export interface ShopItem {
  id: ShopItemId;
  /** daily = ขั้นลงทุนประจำวัน, permanent = ร้านอัปเกรดท้ายวัน */
  kind: ShopItemKind;
  price: number;
  /** ซื้อซ้ำได้กี่ครั้ง (permanent) หรือต่อวัน (daily) */
  maxStack: number;
  minLevel?: GangLevel;
  /** ผลของไอเท็ม (ต่อชิ้น) */
  incomePct?: number;
  heatPct?: number;
  /** Heat ลดทันทีตอนซื้อ */
  heatNow?: number;
  /** ค่าจ้างลูกน้องต่อวัน */
  wage?: number;
  name: LocalizedText;
  desc: LocalizedText;
}

export interface Victim {
  id: VictimId;
  age: number;
  weakness: Weakness;
  /** ตัวคูณรายได้ถ้าหลอกสำเร็จ */
  wealth: number;
  name: LocalizedText;
  job: LocalizedText;
  trait: LocalizedText;
}

export interface Pitch {
  id: PitchId;
  weakness: Weakness;
  text: LocalizedText;
}

/** การ์ดสัญญาณอันตราย — เนื้อหาจริง เพื่อสอนวิธีสังเกตมิจฉาชีพ */
export interface DangerSign {
  id: DangerSignId;
  triggers: { methods?: MethodId[]; events?: EventId[] };
  title: LocalizedText;
  body: LocalizedText;
}

export type EndReason = 'caught' | 'survived' | 'retired';

export interface Ending {
  id: EndingId;
  /** ลำดับความสำคัญ ตัวเลขน้อยตรวจก่อน */
  priority: number;
  when: {
    reasons?: EndReason[];
    karma?: Range;
    minCleanCash?: number;
    maxCleanCash?: number;
  };
  title: LocalizedText;
  body: LocalizedText;
}

/** ค่าสมดุลเกม */
export interface GameConfig {
  maxDays: number;
  startDirtyCash: number;
  /** เงินสะอาดสะสม (ยอดฟอกสำเร็จรวม) ที่ต้องมีเพื่อขึ้นระดับ 2,3,4 */
  levelThresholds: readonly [number, number, number];
  /** Heat ลดเองต่อวันถ้าวันนั้นไม่ได้ทำงานเสี่ยง */
  heatDecayQuietDay: number;
  /** น้ำหนักจำนวนเหตุการณ์ต่อวัน [0 อย่าง, 1 อย่าง, 2 อย่าง] */
  eventCountWeights: readonly [number, number, number];
  launderOfferSize: number;
  callCenter: { matchSuccessPct: number; missSuccessPct: number; failHeat: number };
  romance: { bondIncomePct: number; maxBond: number; fleeAfterIdleDays: number };
  /** ตัวแทนโหมดหนีชั่วคราวของ Phase 1 (ของจริงมาใน Phase 4) */
  escapePlaceholder: { successPct: number; heatAfter: number };
  caughtCleanKeepPct: number;
  score: { daysWeight: number; maxVarietyBonus: number; noEscapeBonus: number };
}

export interface GameContent {
  config: GameConfig;
  methods: ScamMethod[];
  launderCards: LaunderCard[];
  events: GameEvent[];
  characters: Character[];
  shopItems: ShopItem[];
  victims: Victim[];
  pitches: Pitch[];
  dangerSigns: DangerSign[];
  endings: Ending[];
}
