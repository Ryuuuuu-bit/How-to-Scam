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
export type NewsId = string;
export type FestivalId = string;

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
  | 'foundation' // มีโอกาสไวรัล + มาตรวัดชาวเน็ตขุด
  | 'merit' // รายได้ ×2 ช่วงเทศกาล
  | 'gambling' // จ้างดาราโปรโมตได้
  | 'ponzi'; // ทบต้นทุกวันที่ทำต่อเนื่อง แต่โอกาสล่มเพิ่มขึ้น

export interface ScamMethod {
  id: MethodId;
  /** An authored first shift for this job, queued once when there is room. */
  debutEvent?: EventId;
  cleanIncome?: boolean;
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

/** ตัวคูณที่ใช้ร่วมกันโดยข่าว/เทศกาล/effect */
export interface ModifierSpec {
  target: 'income' | 'heat';
  methodId?: MethodId;
  /** +200 = ×3, -50 = ครึ่งเดียว */
  pct: number;
}

export type Effect =
  /** บวก/ลบค่าคงที่ หรือสุ่มในช่วง */
  | { kind: 'add'; stat: Stat; value: number | Range }
  /** คูณค่า เช่น เงินสกปรก × 0.5 */
  | { kind: 'mul'; stat: Stat; value: number }
  /** ตั้ง/ลบ flag ไว้ใช้เป็นเงื่อนไขภายหลัง */
  | { kind: 'flag'; flag: string; remove?: boolean }
  /** ตัวคูณชั่วคราวหลายวัน เช่น มูลนิธิ ×3 ช่วงน้ำท่วม */
  | (ModifierSpec & { kind: 'modifier'; days: number })
  /** ลูกน้องหายไป 1 คน (หนี/โดนจับ) */
  | { kind: 'loseHenchman' }
  /** ได้ลูกน้องฟรี 1 คน */
  | { kind: 'gainHenchman'; loyalty?: number }
  /** ความภักดีลูกน้องทุกคนเปลี่ยน */
  | { kind: 'loyalty'; value: number }
  /** ความผูกพันเหยื่อหลอกรักเปลี่ยน */
  | { kind: 'romanceBond'; value: number }
  /** นัดเหตุการณ์ต่อเนื่องให้เกิดในอีก N วัน */
  | { kind: 'schedule'; eventId: EventId; inDays: number }
  /** ปิดวิธีโกงชั่วคราว */
  | { kind: 'cooldown'; methodId: MethodId; days: number };

export interface EventOutcome {
  /** น้ำหนักโอกาสของผลลัพธ์นี้ (ค่าเริ่มต้น 1) */
  weight?: number;
  text: LocalizedText;
  effects: Effect[];
}

/** เงื่อนไขที่ทางเลือกจะโผล่ (ทางเลือกพิเศษตามอาชีพ/ของที่มี) */
export interface ChoiceRequirement {
  characters?: CharacterId[];
  upgrades?: ShopItemId[];
  minFame?: number;
  minDirtyCash?: number;
  minHenchmen?: number;
  flags?: string[];
}

export interface EventChoice {
  liveCat?: 'lift' | 'stay' | 'sale';
  interview?: 'henchman' | 'cat';
  text: LocalizedText;
  requires?: ChoiceRequirement;
  /** สุ่ม 1 ผลตามน้ำหนัก */
  outcomes: EventOutcome[];
}

export interface EventCondition {
  sketchEdition?: boolean;
  careerEdition?: boolean;
  neighborhoodEdition?: boolean;
  recruit?: string;
  /** แผนของวันนี้ต้องเป็นหนึ่งในนี้ */
  methods?: MethodId[];
  /** เคยใช้วิธีนี้แล้วในรอบนี้ */
  usedMethods?: MethodId[];
  heat?: Range;
  day?: Range;
  karma?: Range;
  minFame?: number;
  minLevel?: GangLevel;
  flagsAll?: string[];
  flagsNone?: string[];
  /** ต้องมีลูกน้องอย่างน้อย 1 คน */
  needsHenchman?: boolean;
  /** เงินสกปรกขั้นต่ำ */
  minDirtyCash?: number;
  /** เฉพาะอาชีพเหล่านี้ */
  characters?: CharacterId[];
  /** เดือน (1–12) ตามปฏิทินของรอบนี้ */
  months?: number[];
  /** วันที่ของเดือน เช่น [1, 16] วันหวยออก */
  dates?: number[];
  /** มีเทศกาลนี้อยู่ */
  festivals?: FestivalId[];
  /** ทำงานติดกันอย่างน้อย N วัน */
  minWorkStreak?: number;
}

export type EventCategory = 'lucky' | 'unlucky' | 'silly' | 'karma';

export interface GameEvent {
  lifeStory?: boolean;
  illustration?: { scene: string; title: string; alt: string };
  lifeMilestone?: number;
  careerQuest?: { chapter: number; fromDay: number };
  id: EventId;
  category: EventCategory;
  weight: number;
  /** เกิดได้ครั้งเดียวต่อรอบ (ค่าเริ่มต้น true) */
  once?: boolean;
  /** เกิดเฉพาะเมื่อถูกนัดจากเหตุการณ์อื่น (ตอนต่อของเรื่อง) */
  chainOnly?: boolean;
  when: EventCondition;
  title: LocalizedText;
  body: LocalizedText;
  /** 1–3 ทางเลือกปกติ + ทางเลือกพิเศษ */
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

/** ความสามารถ/ข้อเสียของอาชีพ */
export type Perk =
  | { kind: 'earlyMethod'; methodId: MethodId }
  | { kind: 'methodIncome'; methodId: MethodId; pct: number }
  | { kind: 'methodHeat'; methodId: MethodId; pct: number }
  | { kind: 'startFame'; value: number }
  | { kind: 'startCash'; value: number }
  /** Heat ทุกงานเพิ่ม pct% ต่อชื่อเสียง 10 แต้ม */
  | { kind: 'fameHeat'; pctPer10Fame: number }
  | { kind: 'launderOffer'; extra: number }
  | { kind: 'launderSuccess'; pct: number }
  | { kind: 'launderFailHeat'; mul: number }
  | { kind: 'shopDiscount'; itemIds: ShopItemId[]; pct: number }
  /** UI บอกจุดอ่อนเหยื่อแบบนี้ให้เลย */
  | { kind: 'revealWeakness'; weaknesses: Weakness[] }
  /** รายได้ทุกงานสุ่มคูณ min–max */
  | { kind: 'chaos'; min: number; max: number }
  | { kind: 'bannedMethod'; methodId: MethodId }
  /** โอกาสแชร์ลูกโซ่ล่มคูณ */
  | { kind: 'ponziRisk'; mul: number }
  | { kind: 'karmaMul'; mul: number }
  | { kind: 'eventWeight'; eventIds: EventId[]; mul: number }
  | { kind: 'victimWealth'; pct: number };

export interface Character {
  id: CharacterId;
  /** ใช้แต้มประสบการณ์แก๊งเท่านี้เพื่อปลดล็อก (ไม่ใส่ = เปิดตั้งแต่แรก) */
  unlockXp?: number;
  /** ตัวลับ: ปลดล็อกเมื่อเคยเห็นฉากจบนี้ */
  unlockEnding?: EndingId;
  perks: Perk[];
  name: LocalizedText;
  desc: LocalizedText;
  /** ข้อความสรุปจุดเด่น/ข้อเสียสั้นๆ */
  pros: LocalizedText;
  cons: LocalizedText;
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
  /** ผลเฉพาะวิธีโกงนี้ (ไม่ใส่ = ทุกวิธี) */
  methodId?: MethodId;
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

/** ตัวละครเหยื่อหน้าตา (ใช้รูป) */
export interface Victim {
  id: VictimId;
  age: number;
  portraitAges: Range;
  weakness: Weakness;
  /** ตัวคูณรายได้ถ้าหลอกสำเร็จ */
  wealth: number;
  name: LocalizedText;
  job: LocalizedText;
  trait: LocalizedText;
}

/** ชิ้นส่วนสำหรับสุ่มประกอบเหยื่อ */
export interface VictimParts {
  names: (LocalizedText & { portraits: VictimId[]; ages?: Range })[];
  jobs: { text: LocalizedText; wealth: number; age: Range; portraits?: VictimId[] }[];
  traits: Record<Weakness, LocalizedText[]>;
  /** ประโยคพิรุธ: เหยื่อหลอกกลับ / ตำรวจปลอมตัว / หลอกให้ระแวงเล่น (เหยื่อธรรมดา) */
  tells: Record<CallerTell, LocalizedText[]>;
}

export type CallerKind = 'normal' | 'baiter' | 'undercover';
export type CallerTell = 'baiter' | 'undercover' | 'herring';

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
    retirementLife?: RetirementLife;
    reasons?: EndReason[];
    karma?: Range;
    minCleanCash?: number;
    maxCleanCash?: number;
    flagsAll?: string[];
  };
  title: LocalizedText;
  body: LocalizedText;
}

export type RetirementLife = 'radio' | 'crew' | 'kitchen' | 'repair' | 'arcade' | 'breakfast' | 'cat';

/** เทศกาลตามปฏิทินไทย */
export interface Festival {
  id: FestivalId;
  /** ช่วงวันที่ [เดือน, วัน] ถึง [เดือน, วัน] */
  from: readonly [number, number];
  to: readonly [number, number];
  modifiers: ModifierSpec[];
  name: LocalizedText;
}

/** ข่าวประจำสัปดาห์ — เปลี่ยนกติกา 7 วัน */
export interface News {
  id: NewsId;
  weight: number;
  minLevel?: GangLevel;
  modifiers: ModifierSpec[];
  launderSuccessPct?: number;
  victimWealthPct?: number;
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
  callCenter: {
    matchSuccessPct: number;
    missSuccessPct: number;
    failHeat: number;
    /** โอกาสเจอคนหลอกกลับ */
    baiterPct: number;
    /** โอกาสเจอตำรวจปลอมตัว = base + perHeat10 × (Heat/10) */
    undercoverBasePct: number;
    undercoverPerHeat10: number;
    /** เหยื่อธรรมดาที่พูดแปลกๆ ให้ระแวงเล่น */
    herringPct: number;
    /** โดนหลอกกลับ เสีย % ของเงินสกปรก (ขั้นต่ำ) */
    baiterLossPct: number;
    baiterLossMin: number;
    undercoverHeat: number;
  };
  romance: { bondIncomePct: number; maxBond: number; fleeAfterIdleDays: number };
  foundation: {
    viralPct: number;
    viralMul: number;
    exposurePerUse: Range;
    exposureDecay: number;
    exposedHeat: number;
    exposedCooldown: number;
  };
  ponzi: { growthPct: number; baseCrashPct: number; crashPctPerDay: number; crashHeat: number };
  escape: EscapeConfig;
  caughtCleanKeepPct: number;
  newsEveryDays: number;
  score: { daysWeight: number; maxVarietyBonus: number; varietyTarget: number; noEscapeBonus: number };
}

/** ฉายาอัตโนมัติ */
export type TitleRule =
  | { kind: 'caughtBy'; day: number }
  | { kind: 'card'; cardId: CardId; count: number }
  | { kind: 'karma'; min: number }
  | { kind: 'restDays'; count: number }
  /** วิธีที่ใช้บ่อยที่สุดในรอบ */
  | { kind: 'method'; methodId: MethodId }
  | { kind: 'always' };

export interface Title {
  id: string;
  rule: TitleRule;
  name: LocalizedText;
}

/** เงื่อนไขของเหรียญความสำเร็จ: ตรวจจากรอบที่จบ หรือจากสถิติสะสมของผู้เล่น */
export type AchievementRule =
  | { kind: 'ending'; endingId: EndingId }
  | { kind: 'reason'; reason: EndReason; maxDay?: number; minDay?: number }
  | { kind: 'cleanCash'; min: number }
  | { kind: 'level'; min: GangLevel }
  | { kind: 'methodsUsed'; min: number }
  | { kind: 'ponziStreak'; min: number }
  | { kind: 'launderOk'; min: number }
  | { kind: 'specialChoices'; min: number }
  | { kind: 'seenEvent'; eventId: EventId }
  | { kind: 'characterWin'; characterId: CharacterId }
  | { kind: 'escapes'; min: number }
  | { kind: 'flag'; flag: string }
  | { kind: 'dirtyHoarder'; min: number }
  | { kind: 'runs'; min: number }
  | { kind: 'daily' };

export interface Achievement {
  id: string;
  icon: string;
  rule: AchievementRule;
  name: LocalizedText;
  desc: LocalizedText;
}

/** ข้อเสนอประจำวันในขั้นลงทุน */
export interface DailyOffer {
  id: string;
  kind: 'twist' | 'deal' | 'mission';
  weight: number;
  when?: EventCondition;
  /** deal: ราคา */
  price?: number;
  /** deal: ผลเมื่อรับดีล */
  effects?: Effect[];
  /** twist: ลดราคาของ */
  discount?: { itemIds: ShopItemId[]; pct: number };
  /** twist: ห้ามซื้อของวันนี้ */
  ban?: ShopItemId[];
  /** mission: ทำวิธีนี้ (null = พัก) ติดกันกี่วัน แล้วได้รางวัล */
  mission?: { methodId: MethodId | null; days: number; reward: Effect[] };
  name: LocalizedText;
  desc: LocalizedText;
}

/** โหมดหนีตำรวจ: ชุดปลอมตัว */
export interface Disguise {
  id: string;
  cost: number;
  bonus: number;
  /** เข้ากับเส้นทางไหน ได้โบนัสเพิ่ม */
  goodFor: string[];
  goodBonus: number;
  name: LocalizedText;
  desc: LocalizedText;
}

export interface EscapeEventChoice {
  text: LocalizedText;
  /** บวก/ลบ % โอกาสรอด */
  chance: number;
  cost?: number;
  karma?: number;
  result: LocalizedText;
}

export interface EscapeEvent {
  id: string;
  text: LocalizedText;
  choices: EscapeEventChoice[];
}

/** โหมดหนีตำรวจ: ที่หนี */
export interface EscapeRoute {
  id: string;
  cost: number;
  baseChance: number;
  /** ต้องกบดานกี่วัน (ข้ามวัน ไม่มีรายได้) */
  hideDays: number;
  heatAfter: number;
  events: EscapeEvent[];
  name: LocalizedText;
  desc: LocalizedText;
}

export interface EscapeConfig {
  bribePct: number;
  bribeMin: number;
  bribeTrustPct: number;
  bribeGood: number;
  bribeBad: number;
  qteTargets: number;
  qtePerHit: number;
  /** หนีรอดมาแล้วกี่ครั้ง ครั้งต่อไปยากขึ้น % ต่อครั้ง */
  repeatPenalty: number;
  /** มอบตัว: เก็บเงินสะอาดได้ % และได้กรรมดี */
  surrenderKeepPct: number;
  surrenderKarma: number;
}

export interface GameContent {
  config: GameConfig;
  methods: ScamMethod[];
  launderCards: LaunderCard[];
  events: GameEvent[];
  characters: Character[];
  shopItems: ShopItem[];
  victims: Victim[];
  victimParts: VictimParts;
  pitches: Pitch[];
  dangerSigns: DangerSign[];
  endings: Ending[];
  festivals: Festival[];
  news: News[];
  titles: Title[];
  achievements: Achievement[];
  offers: DailyOffer[];
  disguises: Disguise[];
  routes: EscapeRoute[];
}
