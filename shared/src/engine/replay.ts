import type { GameContent } from '../types/content';
import type { Action, GameState, PublicGameState } from '../types/state';
import { newGame, step } from './reducer';

/**
 * เล่นซ้ำจาก seed + action log — server ใช้คำนวณคะแนนเอง ไม่เชื่อ client
 * action ไหนผิดกติกาจะโยน InvalidActionError
 */
export function replay(
  seed: string,
  characterId: string,
  actions: readonly Action[],
  c: GameContent,
): GameState {
  let s = newGame(seed, characterId, c);
  for (const a of actions) s = step(s, a, c);
  return s;
}

/** ตัดค่าที่ผู้เล่นห้ามเห็น (Karma, สถานะ RNG) ก่อนส่งให้ UI */
export function toPublicView(s: GameState): PublicGameState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { karma, rng, ...rest } = s;
  return rest;
}
