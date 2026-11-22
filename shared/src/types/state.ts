import type {
  CallerKind,
  CallerTell,
  CardId,
  CharacterId,
  DangerSignId,
  EndReason,
  EndingId,
  EventId,
  GangLevel,
  MethodId,
  NewsId,
  PitchId,
  ShopItemId,
  VictimId,
  Weakness,
} from './content';

/**
 * ลำดับขั้นในหนึ่งวัน
 * plan → invest → (call) → event → launder → shop → plan ของวันถัดไป
 * Heat ถึง 100 เมื่อไหร่ → escape
 */
export type DayPhase =
  'plan' | 'invest' | 'call' | 'event' | 'launder' | 'shop' | 'escape' | 'ended';

export interface Henchman {
  recruit?: string;
  id: string;
  /** โบนัสรายได้ % */
  skill: number;
  /** 0–100 ต่ำมากเสี่ยงซัดทอด */
  loyalty: number;
  wage: number;
}

export interface Modifier {
  target: 'income' | 'heat';
  methodId?: MethodId;
  pct: number;
  daysLeft: number;
}

export interface RomanceState {
  /** ความผูกพันของเหยื่อ ยิ่งสูงยิ่งโอนเยอะ */
  bond: number;
  idleDays: number;
}

/** เหยื่อที่สุ่มประกอบขึ้นสำหรับสายนี้ (เก็บเป็น index ของชิ้นส่วนใน data) */
export interface CallVictim {
  /** รูปหน้าตา (id ใน content.victims) */
  portrait: VictimId;
  nameIdx: number;
  jobIdx: number;
  traitIdx: number;
  age: number;
  weakness: Weakness;
  wealth: number;
  /** คนจริงๆ ที่อยู่ปลายสาย (ไม่ส่งให้ UI รู้ก่อน — UI เห็นแค่ tell) */
  kind?: CallerKind;
  /** ประโยคพิรุธที่ได้ยิน */
  tell?: { kind: CallerTell; idx: number };
}

export interface CallState {
  victim: CallVictim;
  /** มุก 3 ตัวเลือก */
  pitchIds: PitchId[];
}

/** ขั้นตอนของโหมดหนีตำรวจ */
export interface EscapeState {
  step: 'disguise' | 'route' | 'event' | 'bribe' | 'qte';
  /** % โอกาสรอดที่สะสมจากการเลือก (ก่อนบวกเส้นทาง) */
  bonus: number;
  disguiseId?: string;
  routeId?: string;
  eventId?: string;
  eventChoice?: number;
  bribe?: 'none' | 'good' | 'bad';
}

/** สถานะเฉพาะของแต่ละวิธีโกง */
export interface MethodState {
  /** ทำติดกันกี่วัน (แชร์ลูกโซ่) */
  streak: number;
  /** มาตรวัดชาวเน็ตขุด 0–100 (มูลนิธิ) */
  exposure: number;
  /** ปิดใช้งานถึงวันนี้ (รวม) */
  cooldownUntil: number;
}

export interface DayLog {
  liveCat?: 'lift' | 'stay' | 'sale';
  natFirstPay?: boolean;
  opening?: 'mother' | 'guild' | 'parcel';
  recruits?: string[];
  interview?: 'henchman' | 'cat';
  repeatableCost?: number;
  day: number;
  methodId: MethodId | null;
  income: number;
  heatGained: number;
  events: EventId[];
  launderCardId: CardId | null;
  launderSuccess: boolean | null;
  laundered: number;
}

/** ผลล่าสุดที่ UI เอาไปแสดง (ข้อความ + ตัวเลขที่เปลี่ยน) */
export interface LastResult {
  kind:
    | 'resolve'
    | 'call'
    | 'event'
    | 'launder'
    | 'escape'
    | 'romanceFled'
    | 'levelUp'
    | 'viral'
    | 'exposed'
    | 'ponziCrash'
    | 'news'
    | 'offer'
    | 'missionDone'
    | 'missionFail'
    | 'baited'
    | 'sting'
    | 'hangup';
  textKey?: string;
  dirtyCash?: number;
  cleanCash?: number;
  heat?: number;
  success?: boolean;
}

export interface GameState {
  scoutedDay?: number;
  version: 2;
  seed: string;
  /** สถานะภายในของ RNG (uint32) */
  rng: number;
  day: number;
  /** ปฏิทินของรอบนี้: วันที่ 1 ของเกมตรงกับวันที่เท่าไหร่ เดือนอะไร */
  startMonth: number;
  startDate: number;
  phase: DayPhase;
  characterId: CharacterId;
  gangLevel: GangLevel;
  dirtyCash: number;
  cleanCash: number;
  /** ยอดฟอกสำเร็จสะสม ใช้คำนวณระดับแก๊ง */
  totalLaundered: number;
  heat: number;
  fame: number;
  /** ซ่อนจากผู้เล่น — ใช้ toPublicView ก่อนส่งให้ UI */
  karma: number;
  henchmen: Henchman[];
  nextHenchmanId: number;
  modifiers: Modifier[];
  /** ไอเท็มรายวันที่ซื้อในวันนี้ */
  dailyItems: Record<ShopItemId, number>;
  /** อัปเกรดถาวรที่ซื้อแล้ว */
  upgrades: Record<ShopItemId, number>;
  todayMethodId: MethodId | null;
  /** ทำงานติดกันกี่วัน (วันพักรีเซ็ต) */
  workStreak: number;
  romance: RomanceState;
  methodState: Record<MethodId, MethodState>;
  call: CallState | null;
  /** ข่าวประจำสัปดาห์ที่มีผลอยู่ */
  news: { id: NewsId; untilDay: number } | null;
  /** อยู่ระหว่างหนีตำรวจ */
  escape: EscapeState | null;
  /** ข้อเสนอของวันนี้ */
  offer: { id: string; accepted: boolean } | null;
  /** ภารกิจจากเฮียใหญ่ที่รับไว้ */
  mission: { offerId: string; progress: number } | null;
  /** เหตุการณ์ต่อเนื่องที่ถูกนัดไว้ */
  scheduled: { eventId: EventId; day: number }[];
  pendingEvents: EventId[];
  seenEvents: EventId[];
  launderOffer: CardId[];
  flags: string[];
  escapes: number;
  methodsUsed: MethodId[];
  /** สถิติสำหรับ achievement */
  stats: { specialChoices: number; maxPonziStreak: number; launderOk: number };
  history: DayLog[];
  lastResults: LastResult[];
  end: {
    reason: EndReason;
    endingId: EndingId;
    dangerSignIds: DangerSignId[];
    score: number;
  } | null;
}

/** การกระทำของผู้เล่น — server เก็บเป็น action log เพื่อ replay */
export type Action =
  | { t: 'choosePlan'; methodId: MethodId | null; opening?: true | undefined }
  | { t: 'invest'; itemId: ShopItemId }
  | { t: 'acceptOffer' }
  | { t: 'scoutNews' }
  | { t: 'confirmInvest' }
  | { t: 'callPitch'; pitchId: PitchId }
  | { t: 'callHangup' }
  | { t: 'eventChoice'; choiceIdx: number }
  | { t: 'launder'; cardId: CardId | null }
  | { t: 'buy'; itemId: ShopItemId }
  | { t: 'endDay' }
  | { t: 'escapeDisguise'; id: string }
  | { t: 'escapeRoute'; id: string }
  | { t: 'escapeEvent'; choiceIdx: number }
  | { t: 'escapeBribe'; pay: boolean }
  | { t: 'escapeQte'; hits: number }
  | { t: 'escapeSurrender' }
  | { t: 'retire' };

export type PublicGameState = Omit<GameState, 'karma' | 'rng'>;
