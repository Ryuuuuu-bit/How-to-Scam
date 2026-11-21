import type { GameConfig } from '../src/types/content';

// ค่าสมดุลเกม — ปรับตัวเลขตรงนี้ได้เลย ไม่ต้องแตะ engine
export const config: GameConfig = {
  maxDays: 30,
  startDirtyCash: 5_000,
  // ยอดฟอกสำเร็จสะสมเพื่อขึ้นระดับ 2 / 3 / 4
  levelThresholds: [25_000, 110_000, 380_000],
  heatDecayQuietDay: 6,
  eventCountWeights: [25, 50, 25],
  launderOfferSize: 3,
  callCenter: { matchSuccessPct: 85, missSuccessPct: 25, failHeat: 10 },
  romance: { bondIncomePct: 25, maxBond: 8, fleeAfterIdleDays: 2 },
  foundation: {
    viralPct: 20,
    viralMul: 3,
    exposurePerUse: [15, 25],
    exposureDecay: 8,
    exposedHeat: 35,
    exposedCooldown: 4,
  },
  ponzi: { growthPct: 35, baseCrashPct: 4, crashPctPerDay: 5, crashHeat: 40 },
  escapePlaceholder: { successPct: 50, heatAfter: 60 },
  caughtCleanKeepPct: 50,
  newsEveryDays: 7,
  score: { daysWeight: 1, maxVarietyBonus: 0.5, noEscapeBonus: 0.2 },
};
