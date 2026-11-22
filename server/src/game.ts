import { createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  achievementsFor,
  bangkokDate,
  dailyCharacter,
  InvalidActionError,
  isCharacterUnlocked,
  replay,
  titleFor,
  xpForRun,
} from '@hts/shared';
import type { Action, GameContent } from '@hts/shared';
import { seasonFor } from './season';
import type { Store, UserRec } from './store';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message = code,
  ) {
    super(message);
  }
}

const id = z.string().min(1).max(64);
/** รูปแบบ action ที่รับจาก client (ตรวจก่อนเอาไป replay) */
export const actionSchema: z.ZodType<Action> = z.discriminatedUnion('t', [
  z.object({ t: z.literal('choosePlan'), methodId: id.nullable() }),
  z.object({ t: z.literal('invest'), itemId: id }),
  z.object({ t: z.literal('confirmInvest') }),
  z.object({ t: z.literal('callPitch'), pitchId: id }),
  z.object({ t: z.literal('eventChoice'), choiceIdx: z.number().int().min(0).max(10) }),
  z.object({ t: z.literal('launder'), cardId: id.nullable() }),
  z.object({ t: z.literal('buy'), itemId: id }),
  z.object({ t: z.literal('endDay') }),
  z.object({ t: z.literal('escapeAttempt') }),
  z.object({ t: z.literal('retire') }),
]) as z.ZodType<Action>;

export const MAX_ACTIONS = 4_000;
const RUN_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_RUNS_PER_HOUR = 60;

export function newSeed(): string {
  return randomBytes(16).toString('hex');
}

/** เริ่มรอบใหม่: server เป็นคนออก seed */
export async function startRun(store: Store, c: GameContent, user: UserRec, characterId: string) {
  const ch = c.characters.find((x) => x.id === characterId);
  if (!ch) throw new HttpError(400, 'unknown_character');
  if (!isCharacterUnlocked(ch, user)) throw new HttpError(403, 'character_locked');
  const recent = await store.countRecentRuns(user.id, new Date(Date.now() - 60 * 60 * 1000));
  if (recent >= MAX_RUNS_PER_HOUR) throw new HttpError(429, 'too_many_runs');
  const run = await store.createRun({
    userId: user.id,
    characterId,
    seed: newSeed(),
    mode: 'normal',
    dailyDate: null,
  });
  return { runId: run.id, seed: run.seed, characterId, mode: 'normal' as const };
}

/** seed ของ Daily Challenge: ทุกคนได้ seed เดียวกันในวันนั้น แต่เดาล่วงหน้าไม่ได้ */
export function dailySeed(date: string, secret: string): string {
  return createHmac('sha256', secret).update(`daily:${date}`).digest('hex').slice(0, 32);
}

/** ข้อมูล Daily ของวันนี้ + ผู้เล่นคนนี้เล่นไปหรือยัง */
export async function dailyInfo(
  store: Store,
  c: GameContent,
  user: UserRec | undefined,
  now = new Date(),
) {
  const date = bangkokDate(now);
  const characterId = dailyCharacter(date, c).id;
  let status: 'new' | 'started' | 'done' = 'new';
  let result: { score: number; titleId: string; rank: number } | null = null;
  if (user) {
    const run = await store.findDailyRun(user.id, date);
    if (run) status = run.status === 'started' ? 'started' : 'done';
    const sc = await store.dailyScore(user.id, date);
    if (sc) result = { ...sc, rank: await store.rankOf({ dailyDate: date }, sc.score) };
  }
  return { date, characterId, status, result };
}

/** เริ่ม (หรือเล่นต่อ) Daily Challenge — นับคะแนนได้วันละ 1 รอบ */
export async function startDaily(
  store: Store,
  c: GameContent,
  user: UserRec,
  secret: string,
  now = new Date(),
) {
  const date = bangkokDate(now);
  const characterId = dailyCharacter(date, c).id;
  const existing = await store.findDailyRun(user.id, date);
  if (existing) {
    if (existing.status !== 'started') throw new HttpError(409, 'daily_already_played');
    return { runId: existing.id, seed: existing.seed, characterId, mode: 'daily' as const, date };
  }
  const run = await store.createRun({
    userId: user.id,
    characterId,
    seed: dailySeed(date, secret),
    mode: 'daily',
    dailyDate: date,
  });
  return { runId: run.id, seed: run.seed, characterId, mode: 'daily' as const, date };
}

/**
 * ส่งรอบที่เล่นจบ: server replay จาก seed + action log เพื่อคำนวณคะแนนเอง
 * ไม่เชื่อตัวเลขใดๆ จาก client
 */
export async function submitRun(
  store: Store,
  c: GameContent,
  user: UserRec,
  runId: string,
  rawActions: unknown,
  now = new Date(),
) {
  const run = await store.findRun(runId);
  if (!run || run.userId !== user.id) throw new HttpError(404, 'run_not_found');
  if (run.status !== 'started') throw new HttpError(409, 'run_already_submitted');
  if (now.getTime() - run.createdAt.getTime() > RUN_TTL_MS) {
    await store.rejectRun(run.id, 'expired', 0);
    throw new HttpError(410, 'run_expired');
  }
  const parsed = z.array(actionSchema).max(MAX_ACTIONS).safeParse(rawActions);
  if (!parsed.success) {
    await store.rejectRun(run.id, 'bad_actions', 0);
    throw new HttpError(400, 'bad_actions');
  }
  const actions = parsed.data;

  let state;
  try {
    state = replay(run.seed, run.characterId, actions, c);
  } catch (err) {
    const reason = err instanceof InvalidActionError ? err.message : 'replay_failed';
    await store.rejectRun(run.id, reason, actions.length);
    throw new HttpError(422, 'invalid_replay', reason);
  }
  if (state.phase !== 'ended' || !state.end) {
    // ยังเล่นไม่จบ ไม่ปฏิเสธถาวร เผื่อส่งใหม่ตอนจบจริง
    throw new HttpError(422, 'run_not_finished');
  }

  const season = seasonFor(now);
  const mode = run.mode === 'daily' ? 'daily' : 'normal';
  const titleId = titleFor(state, c);
  const had = await store.achievementsOf(user.id);
  const newAchievements = achievementsFor(
    state,
    { runs: user.runsPlayed + 1, daily: mode === 'daily' || user.dailyPlays > 0 },
    c,
  ).filter((a) => !had.includes(a));
  const xpGained = xpForRun(state);
  const before = c.characters.filter((ch) => isCharacterUnlocked(ch, user)).map((ch) => ch.id);
  const days = state.end.reason === 'survived' ? c.config.maxDays : state.day;
  const updated = await store.saveScore({
    runId: run.id,
    userId: user.id,
    season,
    mode,
    dailyDate: run.dailyDate,
    characterId: run.characterId,
    score: state.end.score,
    cleanCash: state.cleanCash,
    days,
    reason: state.end.reason,
    endingId: state.end.endingId,
    titleId,
    actionCount: actions.length,
    xpGained,
    newAchievements,
  });
  const unlocked = c.characters
    .filter((ch) => isCharacterUnlocked(ch, updated) && !before.includes(ch.id))
    .map((ch) => ch.id);
  const scope =
    mode === 'daily' && run.dailyDate ? { dailyDate: run.dailyDate } : { seasonId: season.id };
  const rank = await store.rankOf(scope, state.end.score);
  return {
    score: state.end.score,
    days,
    reason: state.end.reason,
    endingId: state.end.endingId,
    titleId,
    xpGained,
    unlocked,
    seasonId: season.id,
    mode,
    dailyDate: run.dailyDate,
    rank,
    newAchievements,
    user: updated,
  };
}
