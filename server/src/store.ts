// ชั้นเก็บข้อมูล: แยกเป็น interface เพื่อให้ test ใช้ของในหน่วยความจำแทน Postgres ได้
import type { Career, Scrapbook } from '@hts/shared';
import type { SeasonInfo } from './season';

export type Board = 'top' | 'longest' | 'fastest';
export type RunMode = 'normal' | 'normal60' | 'normal90' | 'daily';

/** ขอบเขตของกระดาน: ซีซั่นรายเดือน (รอบปกติ) หรือวัน (Daily Challenge) */
export type Scope = { seasonId: string; mode?: Exclude<RunMode, 'daily'> } | { dailyDate: string };

export interface UserRec {
  id: string;
  kind: 'guest' | 'google';
  googleSub: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  runsPlayed: number;
  dailyPlays: number;
  endings: string[];
  money: number;
  owned: string[];
  /** สมุดภาพการ์ดเหยื่อ (JSON ดิบจากฐานข้อมูล ตรวจด้วย cleanScrapbook ก่อนใช้) */
  scrapbook: unknown;
  /** ประวัติข้ามรอบ (JSON ดิบ ตรวจด้วย cleanCareer ก่อนใช้) */
  career: unknown;
  createdAt: Date;
}

export interface RunRec {
  id: string;
  userId: string;
  seed: string;
  characterId: string;
  mode: string;
  dailyDate: string | null;
  status: 'started' | 'submitted' | 'rejected';
  createdAt: Date;
}

export interface ScoreInput {
  runId: string;
  userId: string;
  season: SeasonInfo;
  mode: RunMode;
  dailyDate: string | null;
  characterId: string;
  score: number;
  cleanCash: number;
  days: number;
  reason: string;
  endingId: string;
  titleId: string;
  actionCount: number;
  xpGained: number;
  moneyGained: number;
  /** ของที่ได้ฟรีจากออดิชั่นในรอบนี้ */
  newOwned: string[];
  /** เหรียญใหม่ที่ปลดล็อกในรอบนี้ */
  newAchievements: string[];
  /** สมุดภาพกับประวัติหลังรวมรอบนี้ (คำนวณใน transaction จากค่าล่าสุด) */
  collect: (scrapbook: unknown, career: unknown) => { scrapbook: Scrapbook; career: Career };
}

export interface BoardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  characterId: string;
  score: number;
  days: number;
  reason: string;
  titleId: string;
  createdAt: Date;
}

export interface NewRun {
  userId: string;
  characterId: string;
  seed: string;
  mode: RunMode;
  dailyDate: string | null;
}

export interface Store {
  saveFeedback(userId: string, category: string, message: string): Promise<void>;
  markOnline(userId: string, now: Date, since: Date): Promise<number>;
  createGuest(displayName: string): Promise<UserRec>;
  findUser(id: string): Promise<UserRec | null>;
  findByGoogleSub(sub: string): Promise<UserRec | null>;
  /** ผูก Google เข้ากับผู้ใช้เดิม (Guest → Google, UID เดิม) */
  linkGoogle(userId: string, g: GoogleProfile): Promise<UserRec>;
  createGoogleUser(g: GoogleProfile): Promise<UserRec>;
  renameUser(userId: string, displayName: string): Promise<UserRec>;
  achievementsOf(userId: string): Promise<string[]>;
  createRun(r: NewRun): Promise<RunRec>;
  findRun(id: string): Promise<RunRec | null>;
  findDailyRun(userId: string, dailyDate: string): Promise<RunRec | null>;
  countRecentRuns(userId: string, since: Date): Promise<number>;
  /** บันทึกคะแนน + อัปเดตแต้มแก๊งและเหรียญของผู้เล่น (ใน transaction เดียว) */
  saveScore(s: ScoreInput): Promise<UserRec>;
  /** หักเงินใต้ดินแล้วเพิ่มของ (ถ้าเงินไม่พอหรือมีแล้ว คืน null) */
  buyItem(userId: string, key: string, price: number): Promise<UserRec | null>;
  /** รวมสมุดภาพกับประวัติจากเครื่องผู้เล่นเข้ากับของบน server (merge คำนวณจากค่าล่าสุด) */
  mergeCollection(
    userId: string,
    merge: (scrapbook: unknown, career: unknown) => { scrapbook: Scrapbook; career: Career },
  ): Promise<UserRec>;
  rejectRun(runId: string, reason: string, actionCount: number): Promise<void>;
  leaderboard(scope: Scope, board: Board, limit: number): Promise<BoardRow[]>;
  /** อันดับของคะแนนนี้ในกระดานคะแนนสูงสุด (นับผู้เล่นที่ทำได้ดีกว่า) */
  rankOf(scope: Scope, score: number): Promise<number>;
  /** คะแนน Daily ของผู้เล่นในวันนั้น (ถ้ามี) */
  dailyScore(userId: string, dailyDate: string): Promise<{ score: number; titleId: string } | null>;
  seasons(): Promise<{ id: string; players: number }[]>;
}

export interface GoogleProfile {
  sub: string;
  email: string | null;
  name: string;
  picture: string | null;
}

/** where ของคะแนนตามขอบเขต: กระดานรายเดือนนับเฉพาะรอบปกติ */
export const scopeWhere = (scope: Scope) =>
  'dailyDate' in scope
    ? { mode: 'daily', dailyDate: scope.dailyDate }
    : { mode: scope.mode ?? 'normal', seasonId: scope.seasonId };
