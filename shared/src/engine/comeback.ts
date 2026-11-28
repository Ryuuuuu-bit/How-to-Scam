// 1.2 "เหยื่อกลับมาหา": คนที่หลอกสำเร็จกลับมาภายใน 2–5 วัน แจ้งความ ตั้งกลุ่มเตือนภัย หรือหลอกกลับ
// เปิดเฉพาะ seed รุ่น 1.2 (':v1:risk1:back1:' หลังจำนวนวัน) ซึ่งยังมีกติกา 1.0 และ 1.1 ครบ
// รอบเก่าที่เซฟไว้จึง replay ได้ผลเดิม
import type { GameContent, ScamMethod } from '../types/content';
import type { GameState, VictimReturn } from '../types/state';
import { campaignDays } from './campaign';
import type { Rng } from './rng';

export const comebackMarker = 'v1:risk1:back1:';
export const comebackEvents = {
  report: 'victim_report',
  warning: 'victim_warning',
  hunter: 'victim_hunter',
} as const;
export type ComebackKind = keyof typeof comebackEvents;
const kinds = Object.keys(comebackEvents) as ComebackKind[];

export function comebackRules(seed: string): boolean {
  const days = campaignDays(seed);
  return days !== undefined && seed.includes(`campaign1:${days}:${comebackMarker}`);
}

export const isComebackEvent = (eventId: string | undefined) =>
  !!eventId && (Object.values(comebackEvents) as string[]).includes(eventId);

/** หลังหลอกสำเร็จ: สุ่มว่าเหยื่อจะกลับมาไหม แบบไหน และวันไหน */
export function maybeScheduleReturn(
  s: GameState,
  c: GameContent,
  rng: Rng,
  m: ScamMethod,
  take: number,
): void {
  if (!comebackRules(s.seed) || take <= 0 || m.cleanIncome || (m.karma ?? 0) >= 0) return;
  const cfg = c.config.comeback;
  const pending = s.returns ?? [];
  if (pending.length >= cfg.maxPending) return;
  if (!rng.chance(cfg.chancePct)) return;
  const kind = kinds[rng.weightedIndex(kinds.map((k) => cfg.weights[k]))] ?? 'report';
  const day = s.day + rng.int(cfg.inDays[0], cfg.inDays[1]);
  if (day > s.maxDays) return;
  const eventId = comebackEvents[kind];
  s.returns = [...pending, { eventId, methodId: m.id, from: s.day, day, take }];
  s.scheduled.push({ eventId, day });
}

/** เหยื่อที่กำลังกลับมาในเหตุการณ์ที่อยู่หน้าคิวตอนนี้ */
export function activeReturn(s: GameState): VictimReturn | undefined {
  const eventId = s.pendingEvents[0];
  if (!isComebackEvent(eventId)) return undefined;
  return s.returns?.find((r) => r.eventId === eventId && r.day <= s.day);
}

/** ปิดนัดที่จัดการแล้ว */
export function settleReturn(s: GameState, r: VictimReturn): void {
  s.returns = (s.returns ?? []).filter((x) => x !== r);
}
