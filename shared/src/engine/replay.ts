import type { GameContent } from '../types/content';
import type { Action, GameState, PublicGameState } from '../types/state';
import { invariant } from './errors';
import { newGame, step } from './reducer';

/** ย้อนวันได้กี่ครั้งต่อรอบ */
export const MAX_REWINDS = 1;

/**
 * เล่นซ้ำจาก seed + action log — server ใช้คำนวณคะแนนเอง ไม่เชื่อ client
 * action ไหนผิดกติกาจะโยน InvalidActionError
 *
 * { t: 'rewindDay' } ย้อนกลับไปต้นวันปัจจุบัน (ถ้าวันนี้ยังไม่ได้ทำอะไร ย้อนไปต้นวันก่อนหน้า)
 * ทำได้ครั้งเดียวต่อรอบและต้องยังไม่จบรอบ ผลของวันจะออกเหมือนเดิมถ้าเลือกเหมือนเดิม เพราะ RNG กลับไปจุดเดียวกัน
 * onStep เรียกหลังทุก action ที่ถูกนำมาเล่นจริง (ใช้เก็บการ์ดเหยื่อ)
 */
export function playLog(
  seed: string,
  characterId: string,
  actions: readonly Action[],
  c: GameContent,
  onStep?: (s: GameState) => void,
): GameState {
  let s = newGame(seed, characterId, c);
  let kept: Action[] = [];
  /** ตำแหน่งใน kept ที่แต่ละวันเริ่ม */
  let starts: number[] = [0];
  let rewinds = 0;
  for (const a of actions) {
    if (a.t === 'rewindDay') {
      invariant(rewinds < MAX_REWINDS, 'rewind already used');
      invariant(s.phase !== 'ended', 'game already ended');
      const today = starts.at(-1) ?? 0;
      const cut = kept.length > today ? today : (starts.at(-2) ?? 0);
      invariant(kept.length > cut, 'nothing to rewind');
      kept = kept.slice(0, cut);
      starts = starts.filter((i) => i <= cut);
      if (starts.at(-1) !== cut) starts.push(cut);
      rewinds++;
      s = newGame(seed, characterId, c);
      for (const k of kept) s = step(s, k, c);
      s.rewinds = rewinds;
      continue;
    }
    const day = s.day;
    s = step(s, a, c);
    kept.push(a);
    if (s.day !== day) starts.push(kept.length);
    onStep?.(s);
  }
  return s;
}

export function replay(
  seed: string,
  characterId: string,
  actions: readonly Action[],
  c: GameContent,
): GameState {
  return playLog(seed, characterId, actions, c);
}

/** ย้อนวันได้ไหมตอนนี้ (UI ใช้แสดงปุ่ม) */
export function canRewind(s: GameState, actions: readonly Action[]): boolean {
  return (
    (s.rewinds ?? 0) < MAX_REWINDS &&
    s.phase !== 'ended' &&
    actions.some((a) => a.t !== 'rewindDay')
  );
}

/** ตัดค่าที่ผู้เล่นห้ามเห็น (Karma, สถานะ RNG) ก่อนส่งให้ UI */
export function toPublicView(s: GameState): PublicGameState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { karma, rng, ...rest } = s;
  return rest;
}
