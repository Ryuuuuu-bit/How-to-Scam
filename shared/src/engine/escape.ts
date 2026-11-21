import type { GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { goToLaunder } from './day';
import type { Rng } from './rng';

/**
 * โหมดหนีตำรวจ — Phase 1 เป็นตัวแทนชั่วคราว: ทอยครั้งเดียว
 * Phase 4 จะแทนด้วย ปลอมตัว / ที่หนี / จ่ายส่วย / QTE
 * คืน true ถ้าโดนจับ
 */
export function escapeAttempt(s: GameState, c: GameContent, rng: Rng): boolean {
  const { successPct, heatAfter } = c.config.escapePlaceholder;
  const success = rng.chance(successPct);
  s.lastResults.push({ kind: 'escape', success });
  if (!success) return true;
  s.escapes++;
  s.heat = heatAfter;
  s.pendingEvents = [];
  goToLaunder(s, c, rng);
  return false;
}

/** โดนจับ: เงินสกปรกถูกยึดหมด เงินสะอาดเหลือตาม config (50%) */
export function applyCaught(s: GameState, c: GameContent): void {
  s.dirtyCash = 0;
  s.cleanCash = Math.round((s.cleanCash * c.config.caughtCleanKeepPct) / 100);
}
