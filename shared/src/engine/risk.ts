// 1.1 "เสี่ยงแล้วคุ้ม": ให้การเล่นเสี่ยงแบบมีแผนได้ผลตอบแทน ไม่ใช่เล่นระวังแล้วชนะเสมอ
//  - งานด่วน: เลือกได้ทุกวันทำงาน รายได้และ Heat พื้นฐานคูณเพิ่ม
//  - หน้าสิ่ว: ทำงานตอน Heat สูงได้รายได้เพิ่ม
//  - หลบเงียบ: พักติดกันหลายวัน Heat ลดเร็วขึ้น ให้สายเสี่ยงมีทางถอยที่วางแผนได้
//  - วันเสียว: จบวันด้วย Heat สูงโดยไม่โดนจับ ได้โบนัสคะแนนสไตล์
// ทุกกติกาในไฟล์นี้เปิดเฉพาะ seed รุ่น 1.1 (':v1:risk1:' หลังจำนวนวัน) ซึ่งยังเป็นซอยมีชีวิตรุ่น 1.0 ครบ
// รอบเก่าที่เซฟไว้จึง replay ได้ผลเดิม
import type { GameContent, GangLevel, ScamMethod } from '../types/content';
import type { GameState } from '../types/state';
import { campaignDays } from './campaign';

export const riskMarker = 'v1:risk1:';

/** รอบนี้ใช้กติกา "เสี่ยงแล้วคุ้ม" ไหม */
export function riskRules(seed: string): boolean {
  const days = campaignDays(seed);
  return days !== undefined && seed.includes(`campaign1:${days}:${riskMarker}`);
}

/** วันนี้รับงานด่วนไหม */
export function isRush(s: GameState): boolean {
  const log = s.history.at(-1);
  return !!log?.rush && log.day === s.day && s.todayMethodId !== null;
}

/** % รายได้เพิ่มจากการทำงานตอน Heat สูง (0 ถ้ากติกาเดิม) */
export function edgeIncomePct(s: GameState, c: GameContent, heat = s.heat): number {
  if (!riskRules(s.seed)) return 0;
  let pct = 0;
  for (const [min, bonus] of c.config.risk.edgeIncome) if (heat >= min) pct = bonus;
  return pct;
}

/** จำนวนวันพักติดกันจนถึงวันนี้ (รวมวันนี้ถ้าวันนี้พัก) — ไม่นับกะแก้ถังแตก */
export function restStreak(s: GameState): number {
  let n = 0;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const d = s.history[i];
    if (!d || d.methodId !== null || d.relief) break;
    n++;
  }
  return n;
}

function decayFor(c: GameContent, streak: number): number {
  const { base, perDay, max } = c.config.risk.restDecay;
  return Math.min(max, base + perDay * Math.max(0, streak - 1));
}

/** Heat พื้นฐานที่ลดในวันพัก (ก่อนบวกโบนัสบ้าน/ของ) */
export function restHeatDecay(s: GameState, c: GameContent): number {
  if (!riskRules(s.seed)) return c.config.heatDecayQuietDay;
  return decayFor(c, restStreak(s));
}

/** Heat พื้นฐานที่จะลดถ้าพักวันนี้ (ให้ UI แสดงก่อนเลือก) */
export function nextRestDecay(s: GameState, c: GameContent): number {
  if (!riskRules(s.seed)) return c.config.heatDecayQuietDay;
  // ถ้าวันนี้ยังไม่ได้เลือกแผน วันพักวันนี้จะต่อจากวันพักก่อนหน้า
  const planned = s.history.at(-1)?.day === s.day;
  return decayFor(c, planned ? restStreak(s) : restStreak(s) + 1);
}

/** ระดับแก๊งที่ต้องมีเพื่อใช้วิธีนี้ */
export function methodLevel(s: GameState, c: GameContent, m: ScamMethod): GangLevel {
  if (!riskRules(s.seed)) return m.level;
  return c.config.risk.methodLevels[m.id] ?? m.level;
}

/** โบนัสคะแนนสไตล์จากวันเสียว */
export function edgeScoreBonus(s: GameState, c: GameContent): number {
  if (!riskRules(s.seed)) return 0;
  const { edgeScorePerDay, edgeScoreMax } = c.config.risk;
  return Math.min(edgeScoreMax, (s.stats.edgeDays ?? 0) * edgeScorePerDay);
}

/** นับวันเสียวตอนจบวัน */
export function tallyEdgeDay(s: GameState, c: GameContent): void {
  if (!riskRules(s.seed) || s.heat < c.config.risk.edgeHeat) return;
  s.stats.edgeDays = (s.stats.edgeDays ?? 0) + 1;
}
