import { createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import {
  campaignSeed,
  riskSeed,
  type Duration,
  achievementsFor,
  bangkokDate,
  dailyCharacter,
  InvalidActionError,
  auditionsPassed,
  charKey,
  isCharacterUnlocked,
  marketPrice,
  marketRequires,
  moneyForRun,
  loadoutFor,
  seedWithLoadout,
  type LoadoutPick,
  questSeedPrefix,
  addRun,
  cardIdsOf,
  cleanCareer,
  cleanScrapbook,
  mergeCareer,
  mergeScrapbook,
  replayWithCards,
  type Career,
  type Scrapbook,
  titleFor,
  xpForRun,
} from '@hts/shared';
import type { Action, GameContent, GameState } from '@hts/shared';
import { seasonFor } from './season';
import type { Store, UserRec, Scope } from './store';

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
  z.object({ t: z.literal('shapePlace'), place: z.enum(['market', 'temple', 'field', 'dorm', 'mookata']), form: z.enum(['patron', 'local', 'show']) }),
  z.object({ t: z.literal('appointment'), npc: z.enum(['jae', 'uncle', 'coach', 'auntie', 'hia']) }),
  z.object({ t: z.literal('caseMove'), kind: z.enum(['burn', 'decoy', 'tipoff']), evidenceId: z.number().int().min(1).max(10_000).optional() }),
  z.object({ t: z.literal('specialize'), methodId: id, branch: z.enum(['face', 'boss']) }),
  z.object({ t: z.literal('careerFinale'), methodId: id, choice: z.enum(['fee', 'credit']) }),
  z.object({ t: z.literal('careerDecision'), methodId: id, choice: z.enum(['patron', 'local', 'talent']) }),
  z.object({ t: z.literal('relief'), job: z.enum(['mascot', 'stage', 'advance', 'favor']) }),
  z.object({ t: z.literal('choosePlan'), methodId: id.nullable(), opening: z.literal(true).optional(), rush: z.literal(true).optional() }),
  z.object({ t: z.literal('replyOrigin'), reply: z.enum(['help', 'later']) }),
  z.object({ t: z.literal('readOrigin') }),
  z.object({ t: z.literal('invest'), itemId: id }),
  z.object({ t: z.literal('acceptOffer') }),
  z.object({ t: z.literal('scoutNews') }),
  z.object({ t: z.literal('confirmInvest') }),
  z.object({ t: z.literal('callPitch'), pitchId: id }),
  z.object({ t: z.literal('eventChoice'), choiceIdx: z.number().int().min(0).max(10) }),
  z.object({ t: z.literal('launder'), cardId: id.nullable() }),
  z.object({ t: z.literal('buy'), itemId: id }),
  z.object({ t: z.literal('shopDeal') }),
  z.object({ t: z.literal('shopHold'), itemId: id }),
  z.object({ t: z.literal('endDay') }),
  z.object({ t: z.literal('escapeDisguise'), id: z.string().max(40) }),
  z.object({ t: z.literal('escapeRoute'), id: z.string().max(40) }),
  z.object({ t: z.literal('escapeEvent'), choiceIdx: z.number().int().min(0).max(5) }),
  z.object({ t: z.literal('escapeBribe'), pay: z.boolean() }),
  z.object({ t: z.literal('escapeQte'), hits: z.number().int().min(0).max(20), custody: z.literal(true).optional() }),
  z.object({ t: z.literal('escapeSurrender'), custody: z.literal(true).optional() }),
  z.object({ t: z.literal('custodyVerdict'), answer: z.array(z.number().int().min(0).max(2)).length(3).nullable() }),
  z.object({ t: z.literal('callHangup') }),
  z.object({ t: z.literal('retire') }),
]) as z.ZodType<Action>;

export const MAX_ACTIONS = 4_000;
const RUN_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_RUNS_PER_HOUR = 60;

/**
 * วันแรก (เวลาไทย) ที่รอบใหม่ใช้กติกา "เสี่ยงแล้วคุ้ม" (1.1) — ตรงกับวันเริ่มซีซั่นใหม่
 * เพื่อไม่ให้คะแนนกติกาใหม่ปนกับซีซั่นที่เล่นกันมาแล้ว และ Daily ของวันเดียวกันได้ seed ชุดเดียวกันทุกคน
 */
export const RISK_RULES_FROM = '2026-12-01';

export function newSeed(days: Duration = 30, now = new Date()): string {
  const nonce = randomBytes(16).toString('hex');
  return bangkokDate(now) >= RISK_RULES_FROM ? riskSeed(days, nonce) : campaignSeed(days, nonce);
}

/** เริ่มรอบใหม่: server เป็นคนออก seed */
export async function startRun(
  store: Store,
  c: GameContent,
  user: UserRec,
  characterId: string,
  days: Duration = 30,
  pick: LoadoutPick = {},
) {
  const ch = c.characters.find((x) => x.id === characterId);
  if (!ch) throw new HttpError(400, 'unknown_character');
  if (!isCharacterUnlocked(ch, user)) throw new HttpError(403, 'character_locked');
  const recent = await store.countRecentRuns(user.id, new Date(Date.now() - 60 * 60 * 1000));
  if (recent >= MAX_RUNS_PER_HOUR) throw new HttpError(429, 'too_many_runs');
  const mode = days === 90 ? 'normal90' : days === 60 ? 'normal60' : 'normal';
  const run = await store.createRun({
    userId: user.id,
    characterId,
    // บ้าน ชุด สัตว์เลี้ยง รถ และทุนกลับใจติดไปกับ seed: ใช้ได้เฉพาะของที่ผู้เล่นมีจริง
    seed: seedWithLoadout(newSeed(days), loadoutFor(user.owned, pick)),
    mode,
    dailyDate: null,
  });
  return { runId: run.id, seed: run.seed, characterId, mode, days };
}

/** seed ของ Daily Challenge: ทุกคนได้ seed เดียวกันในวันนั้น แต่เดาล่วงหน้าไม่ได้ */
export function dailySeed(date: string, secret: string): string {
  const seed = createHmac('sha256', secret).update(`daily:${date}`).digest('hex').slice(0, 32);
  if (date >= RISK_RULES_FROM) return riskSeed(30, seed);
  if (date >= '2026-11-26') return campaignSeed(30, seed);
  if (date >= '2026-11-25') return questSeedPrefix + seed;
  if (date >= '2026-11-24') return 'v3:soi:live:' + seed;
  return date >= '2026-11-23' ? 'v3:soi:' + seed : seed;
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
  if (now.getTime() - run.createdAt.getTime() > RUN_TTL_MS * (run.mode === 'normal90' ? 3 : run.mode === 'normal60' ? 2 : 1)) {
    await store.rejectRun(run.id, 'expired', 0);
    throw new HttpError(410, 'run_expired');
  }
  const parsed = z.array(actionSchema).max(MAX_ACTIONS).safeParse(rawActions);
  if (!parsed.success) {
    await store.rejectRun(run.id, 'bad_actions', 0);
    throw new HttpError(400, 'bad_actions');
  }
  const actions = parsed.data;

  let state: GameState;
  let cards: Scrapbook;
  try {
    ({ state, cards } = replayWithCards(run.seed, run.characterId, actions, c));
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
  const mode = run.mode === 'daily' || run.mode === 'normal90' || run.mode === 'normal60' ? run.mode : 'normal';
  const titleId = titleFor(state, c);
  const had = await store.achievementsOf(user.id);
  const newAchievements = achievementsFor(
    state,
    { runs: user.runsPlayed + 1, daily: mode === 'daily' || user.dailyPlays > 0 },
    c,
  ).filter((a) => !had.includes(a));
  const xpGained = xpForRun(state);
  const moneyGained = moneyForRun(state);
  const auditions = auditionsPassed(state, c, user.owned);
  const before = c.characters.filter((ch) => isCharacterUnlocked(ch, user)).map((ch) => ch.id);
  const days = state.end.reason === 'survived' ? state.maxDays : state.day;
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
    moneyGained,
    newOwned: auditions.map(charKey),
    newAchievements,
    collect: (book, career) => ({
      scrapbook: mergeScrapbook(cleanScrapbook(book, cardIdsOf(c)), cards),
      career: addRun(cleanCareer(career), state),
    }),
  });
  const unlocked = c.characters
    .filter((ch) => isCharacterUnlocked(ch, updated) && !before.includes(ch.id))
    .map((ch) => ch.id);
  const scope: Scope =
    mode === 'daily' && run.dailyDate ? { dailyDate: run.dailyDate } : { seasonId: season.id, mode: mode === 'daily' ? 'normal' : mode };
  const rank = await store.rankOf(scope, state.end.score);
  return {
    score: state.end.score,
    days,
    reason: state.end.reason,
    endingId: state.end.endingId,
    titleId,
    xpGained,
    moneyGained,
    auditions,
    unlocked,
    seasonId: season.id,
    mode,
    dailyDate: run.dailyDate,
    rank,
    newAchievements,
    user: updated,
  };
}

/** ซื้อของในตลาดใต้ดินด้วยเงินใต้ดิน: ราคามาจากข้อมูลเกมเท่านั้น */
export async function buyMarketItem(store: Store, c: GameContent, user: UserRec, key: string) {
  const price = marketPrice(c, key);
  if (price === null) throw new HttpError(400, 'unknown_item');
  if (user.owned.includes(key)) throw new HttpError(409, 'already_owned');
  const need = marketRequires(key);
  if (need && !user.owned.includes(need)) throw new HttpError(409, 'needs_previous');
  if (user.money < price) throw new HttpError(402, 'not_enough_money');
  const updated = await store.buyItem(user.id, key, price);
  if (!updated) throw new HttpError(409, 'purchase_failed');
  return { key, price, user: updated };
}

/**
 * รับสมุดภาพกับประวัติจากเครื่องผู้เล่น (ข้อมูลเดิมก่อนย้ายมาเก็บที่ server หรือการ์ดจากรอบที่ยังไม่ได้ส่ง)
 * รวมแบบไม่นับซ้ำและไม่ลดของเดิม ประวัติจำนวนรอบต้องไม่เกินรอบที่ server เคยรับจริงมากนัก
 */
export async function importCollection(
  store: Store,
  c: GameContent,
  user: UserRec,
  raw: { scrapbook?: unknown; career?: unknown },
) {
  const local = cleanScrapbook(raw.scrapbook, cardIdsOf(c));
  const lc = cleanCareer(raw.career);
  const cap = user.runsPlayed + 50;
  const localCareer: Career = {
    ...lc,
    runs: Math.min(lc.runs, cap),
    survived: Math.min(lc.survived, cap),
    honest: Math.min(lc.honest, cap),
    escapes: Math.min(lc.escapes, cap * 30),
  };
  return store.mergeCollection(user.id, (book, career) => ({
    scrapbook: mergeScrapbook(cleanScrapbook(book, cardIdsOf(c)), local),
    career: mergeCareer(cleanCareer(career), localCareer),
  }));
}
