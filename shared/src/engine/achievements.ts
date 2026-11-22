import type { AchievementRule, GameContent } from '../types/content';
import type { GameState } from '../types/state';

/** สถิติสะสมของผู้เล่น (นับรวมรอบที่เพิ่งจบแล้ว) */
export interface PlayerTotals {
  runs: number;
  daily: boolean;
}

function ruleMet(r: AchievementRule, s: GameState, t: PlayerTotals, c: GameContent): boolean {
  const end = s.end;
  if (!end) return false;
  switch (r.kind) {
    case 'ending':
      return end.endingId === r.endingId;
    case 'reason': {
      const day = end.reason === 'survived' ? c.config.maxDays : s.day;
      return (
        end.reason === r.reason &&
        (r.maxDay === undefined || day <= r.maxDay) &&
        (r.minDay === undefined || day >= r.minDay)
      );
    }
    case 'cleanCash':
      return s.cleanCash >= r.min;
    case 'level':
      return s.gangLevel >= r.min;
    case 'methodsUsed':
      return s.methodsUsed.length >= r.min;
    case 'ponziStreak':
      return s.stats.maxPonziStreak >= r.min;
    case 'launderOk':
      return s.stats.launderOk >= r.min;
    case 'specialChoices':
      return s.stats.specialChoices >= r.min;
    case 'seenEvent':
      return s.seenEvents.includes(r.eventId);
    case 'characterWin':
      return s.characterId === r.characterId && end.reason === 'survived';
    case 'flag':
      return s.flags.includes(r.flag);
    case 'escapes':
      return s.escapes >= r.min;
    case 'dirtyHoarder':
      return s.dirtyCash >= r.min && end.reason !== 'caught';
    case 'runs':
      return t.runs >= r.min;
    case 'daily':
      return t.daily;
  }
}

/** เหรียญที่รอบนี้ปลดล็อกได้ (ยังไม่ตัดอันที่มีอยู่แล้ว) */
export function achievementsFor(s: GameState, totals: PlayerTotals, c: GameContent): string[] {
  return c.achievements.filter((a) => ruleMet(a.rule, s, totals, c)).map((a) => a.id);
}
