// โหมดเล่นสบาย (casual) — เปิดเฉพาะ seed ใหม่ที่มี ':v1:easy:' หลังจำนวนวัน
// รอบเก่าที่เซฟไว้ (ไม่มีเครื่องหมายนี้) replay ด้วยตัวเลขเดิมทุกอย่าง
// ตัวเลขส่วนใหญ่ปรับผ่าน content ชุดใหม่ (casualContent) เพื่อให้หน้าจอโชว์ตัวเลขเดียวกับที่ engine ใช้
// ส่วนที่ฝังอยู่ใน engine ใช้ casualRules ด้านล่าง
import type { Effect, GameContent, Range } from '../types/content';
import type { GameState } from '../types/state';

export const casualMarker = 'easy:';

/** seed นี้เล่นด้วยกติกาเล่นสบายไหม */
export function isCasualSeed(seed: string): boolean {
  return /campaign1:\d+:v1:easy:/.test(seed);
}

export const isCasual = (s: Pick<GameState, 'seed'>) => isCasualSeed(s.seed);

/** ตัวเลขที่ฝังใน engine: [กติกาเดิม, เล่นสบาย] */
export const casualRules = {
  /** แชร์ลูกโซ่ล่ม: เงินสกปรกเหลือกี่ส่วน */
  ponziCrashKeep: [0.7, 0.85],
  /** ฟอกพัง: Heat ของการ์ดคูณเท่าไร */
  launderFailHeatMul: [2, 1.5],
  /** น้ำหนักคดีที่ทำให้สารวัตรบุก */
  raidAt: [7, 9],
  /** สารวัตรบุก: ยึดเงินสกปรกกี่ส่วน (ไม่มีสายเตือน / มีสาย) */
  raidSeize: [0.2, 0.1],
  raidSeizeWarned: [0.1, 0.05],
  /** โอกาสหนีลดลงต่อน้ำหนักคดี 1 หน่วย */
  caseEscapePerWeight: [2, 1],
} as const;

export function rule<K extends keyof typeof casualRules>(s: Pick<GameState, 'seed'>, key: K): number {
  return casualRules[key][isCasual(s) ? 1 : 0];
}

const soften = (v: number) => Math.round(v * 0.7);
const softenRange = (v: number | Range): number | Range =>
  typeof v === 'number' ? soften(v) : [soften(v[0]), soften(v[1])];
const isLoss = (v: number | Range) => (typeof v === 'number' ? v : Math.max(v[0], v[1])) < 0;
const isGain = (v: number | Range) => (typeof v === 'number' ? v : Math.min(v[0], v[1])) > 0;

/** เหตุการณ์ร้าย: Heat ที่เพิ่มและเงินที่เสียเบาลง 30% (ส่วนที่เป็นผลดีคงเดิม) */
function softenEffect(e: Effect): Effect {
  if (e.kind === 'add') {
    if (e.stat === 'heat' && isGain(e.value)) return { ...e, value: softenRange(e.value) };
    if ((e.stat === 'dirtyCash' || e.stat === 'cleanCash') && isLoss(e.value)) return { ...e, value: softenRange(e.value) };
  }
  if (e.kind === 'mul' && (e.stat === 'dirtyCash' || e.stat === 'cleanCash') && e.value < 1) {
    return { ...e, value: Math.round((1 - (1 - e.value) * 0.7) * 100) / 100 };
  }
  if (e.kind === 'mul' && e.stat === 'heat' && e.value > 1) {
    return { ...e, value: Math.round((1 + (e.value - 1) * 0.7) * 100) / 100 };
  }
  return e;
}

function buildCasual(c: GameContent): GameContent {
  const cfg = c.config;
  return {
    ...c,
    config: {
      ...cfg,
      startDirtyCash: 7_000,
      levelThresholds: [18_000, 80_000, 300_000],
      heatDecayQuietDay: 12,
      callCenter: {
        ...cfg.callCenter,
        matchSuccessPct: 90,
        missSuccessPct: 40,
        failHeat: 5,
        baiterPct: 7,
        undercoverBasePct: 1,
        undercoverPerHeat10: 1,
        baiterLossPct: 8,
        baiterLossMin: 1_000,
        undercoverHeat: 20,
      },
      romance: { ...cfg.romance, fleeAfterIdleDays: 3 },
      foundation: { ...cfg.foundation, exposurePerUse: [10, 18], exposedHeat: 20, exposedCooldown: 2 },
      ponzi: { ...cfg.ponzi, baseCrashPct: 3, crashPctPerDay: 4, crashHeat: 25 },
      escape: {
        ...cfg.escape,
        bribeTrustPct: 80,
        bribeBad: -5,
        qtePerHit: 4,
        repeatPenalty: 2,
        surrenderKeepPct: 90,
      },
      caughtCleanKeepPct: 75,
    },
    methods: c.methods.map((m) => ({
      ...m,
      heat: [Math.round(m.heat[0] * 0.8), Math.round(m.heat[1] * 0.8)] as Range,
      ...(m.id === 'romance' && {
        desc: { ...m.desc, th: m.desc.th.replace('ทิ้งไว้สองวันเหยื่อหนี', 'ทิ้งไว้สามวันเหยื่อหนี') },
      }),
    })),
    launderCards: c.launderCards.map((card) => ({
      ...card,
      successPct: Math.min(95, card.successPct + 5),
      failLossPct: Math.round(card.failLossPct / 2),
    })),
    events: c.events.map((ev) => ({
      ...ev,
      choices: ev.choices.map((ch) => ({
        ...ch,
        outcomes: ch.outcomes.map((o) => ({ ...o, effects: o.effects.map(softenEffect) })),
      })),
    })),
    routes: c.routes.map((r) => ({
      ...r,
      baseChance: Math.min(90, r.baseChance + 15),
      heatAfter: Math.max(0, r.heatAfter - 10),
    })),
  };
}

const casualOf = new WeakMap<GameContent, GameContent>();
const baseOf = new WeakMap<GameContent, GameContent>();

/** content ชุดเล่นสบายของ content ชุดนี้ (สร้างครั้งเดียวแล้วจำไว้) */
export function casualContent(c: GameContent): GameContent {
  if (baseOf.has(c)) return c;
  let tuned = casualOf.get(c);
  if (!tuned) {
    tuned = buildCasual(c);
    casualOf.set(c, tuned);
    baseOf.set(tuned, c);
  }
  return tuned;
}

/** content ที่ seed นี้ใช้: seed เล่นสบายได้ชุดใหม่ seed เก่าได้ชุดเดิม */
export function contentForSeed(c: GameContent, seed: string): GameContent {
  if (isCasualSeed(seed)) return casualContent(c);
  return baseOf.get(c) ?? c;
}
