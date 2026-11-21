import type { GameConfig } from '../src/types/content';

// ค่าสมดุลเกม — ปรับตัวเลขตรงนี้ได้เลย ไม่ต้องแตะ engine
export const config: GameConfig = {
  maxDays: 30,
  startDirtyCash: 5_000,
  // ยอดฟอกสำเร็จสะสมเพื่อขึ้นระดับ 2 / 3 / 4
  levelThresholds: [50_000, 300_000, 2_000_000],
  heatDecayQuietDay: 5,
  eventCountWeights: [30, 50, 20],
  launderOfferSize: 3,
  callCenter: { matchSuccessPct: 85, missSuccessPct: 25, failHeat: 10 },
  romance: { bondIncomePct: 25, maxBond: 8, fleeAfterIdleDays: 2 },
  escapePlaceholder: { successPct: 50, heatAfter: 60 },
  caughtCleanKeepPct: 50,
  score: { daysWeight: 1, maxVarietyBonus: 0.5, noEscapeBonus: 0.2 },
};
