// สถิติของรอบที่ใช้ทำกระดานรายสัปดาห์แบบมีธีม (server คำนวณจาก state ที่ replay เอง)
import type { GameState } from '../types/state';
import { generationOf } from './apprentice';

export interface RunStats {
  /** วันที่จบด้วย Heat 70+ แล้วรอด */
  edgeDays: number;
  /** Heat สูงสุดตอนจบวันที่รอดมาได้ */
  peakHeat: number;
  /** งานด่วนติดกันยาวสุด (วันทำงานติดกันที่รับงานด่วน) */
  rushStreak: number;
  /** รุ่นของสายสืบทอด (รอบปกติ = 1) */
  generation: number;
}

export function runStats(s: GameState): RunStats {
  let rushStreak = 0;
  let run = 0;
  for (const h of s.history) {
    run = h.methodId && h.rush ? run + 1 : 0;
    rushStreak = Math.max(rushStreak, run);
  }
  return {
    edgeDays: s.stats.edgeDays ?? 0,
    peakHeat: s.stats.peakHeat ?? 0,
    rushStreak,
    generation: generationOf(s.seed),
  };
}
