// ชั้นเก็บข้อมูล: แยกเป็น interface เพื่อให้ test ใช้ของในหน่วยความจำแทน Postgres ได้
import type { SeasonInfo } from './season';

export type Board = 'top' | 'longest' | 'fastest';

export interface UserRec {
  id: string;
  kind: 'guest' | 'google';
  googleSub: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  runsPlayed: number;
  endings: string[];
  createdAt: Date;
}

export interface RunRec {
  id: string;
  userId: string;
  seed: string;
  characterId: string;
  status: 'started' | 'submitted' | 'rejected';
  createdAt: Date;
}

export interface ScoreInput {
  runId: string;
  userId: string;
  season: SeasonInfo;
  characterId: string;
  score: number;
  cleanCash: number;
  days: number;
  reason: string;
  endingId: string;
  titleId: string;
  actionCount: number;
  xpGained: number;
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

export interface Store {
  createGuest(displayName: string): Promise<UserRec>;
  findUser(id: string): Promise<UserRec | null>;
  findByGoogleSub(sub: string): Promise<UserRec | null>;
  /** ผูก Google เข้ากับผู้ใช้เดิม (Guest → Google, UID เดิม) */
  linkGoogle(userId: string, g: GoogleProfile): Promise<UserRec>;
  createGoogleUser(g: GoogleProfile): Promise<UserRec>;
  renameUser(userId: string, displayName: string): Promise<UserRec>;
  createRun(userId: string, characterId: string, seed: string): Promise<RunRec>;
  findRun(id: string): Promise<RunRec | null>;
  countRecentRuns(userId: string, since: Date): Promise<number>;
  /** บันทึกคะแนน + อัปเดตแต้มแก๊งของผู้เล่น (ใน transaction เดียว) */
  saveScore(s: ScoreInput): Promise<UserRec>;
  rejectRun(runId: string, reason: string, actionCount: number): Promise<void>;
  leaderboard(seasonId: string, board: Board, limit: number): Promise<BoardRow[]>;
  /** อันดับของคะแนนนี้ในบอร์ด top (นับผู้เล่นที่ทำได้ดีกว่า) */
  rankOf(seasonId: string, score: number): Promise<number>;
  seasons(): Promise<{ id: string; players: number }[]>;
}

export interface GoogleProfile {
  sub: string;
  email: string | null;
  name: string;
  picture: string | null;
}
