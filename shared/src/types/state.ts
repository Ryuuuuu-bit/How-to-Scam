import type {
  CardId,
  CharacterId,
  DangerSignId,
  EndReason,
  EndingId,
  EventId,
  GangLevel,
  MethodId,
  PitchId,
  ShopItemId,
  VictimId,
} from './content';

/**
 * ลำดับขั้นในหนึ่งวัน
 * plan → invest → (call) → event → launder → shop → plan ของวันถัดไป
 * Heat ถึง 100 เมื่อไหร่ → escape
 */
export type DayPhase =
  'plan' | 'invest' | 'call' | 'event' | 'launder' | 'shop' | 'escape' | 'ended';

export interface Henchman {
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

export interface CallState {
  victimId: VictimId;
  /** มุก 3 ตัวเลือก */
  pitchIds: PitchId[];
}

export interface DayLog {
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
  kind: 'resolve' | 'call' | 'event' | 'launder' | 'escape' | 'romanceFled' | 'levelUp';
  textKey?: string;
  dirtyCash?: number;
  cleanCash?: number;
  heat?: number;
  success?: boolean;
}

export interface GameState {
  version: 1;
  seed: string;
  /** สถานะภายในของ RNG (uint32) */
  rng: number;
  day: number;
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
  romance: RomanceState;
  call: CallState | null;
  pendingEvents: EventId[];
  seenEvents: EventId[];
  launderOffer: CardId[];
  flags: string[];
  escapes: number;
  methodsUsed: MethodId[];
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
  | { t: 'choosePlan'; methodId: MethodId | null }
  | { t: 'invest'; itemId: ShopItemId }
  | { t: 'confirmInvest' }
  | { t: 'callPitch'; pitchId: PitchId }
  | { t: 'eventChoice'; choiceIdx: number }
  | { t: 'launder'; cardId: CardId | null }
  | { t: 'buy'; itemId: ShopItemId }
  | { t: 'endDay' }
  | { t: 'escapeAttempt' }
  | { t: 'retire' };

export type PublicGameState = Omit<GameState, 'karma' | 'rng'>;
