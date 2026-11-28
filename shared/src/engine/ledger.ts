// สรุปบัญชี: จดว่าเงิน (สกปรก + สะอาด) ของแต่ละวันเข้า-ออกเพราะอะไร ไม่ใช้ RNG จึงไม่กระทบการ replay
import type { Action, DayLog, FlowKind, GameState } from '../types/state';
// หมายเหตุ: เงินที่เปลี่ยนก่อนมีบันทึกของวัน (ก่อนเลือกแผน) พักไว้ใน s.preFlow แล้วรวมเข้าเมื่อบันทึกของวันนั้นเกิด

export const flowKinds: readonly FlowKind[] = [
  'job',
  'gear',
  'events',
  'launder',
  'shop',
  'wages',
  'escape',
  'other',
];

const kindOf: Partial<Record<Action['t'], FlowKind>> = {
  confirmInvest: 'job',
  callPitch: 'job',
  callHangup: 'job',
  relief: 'job',
  careerDecision: 'job',
  careerFinale: 'job',
  invest: 'gear',
  scoutNews: 'gear',
  acceptOffer: 'gear',
  eventChoice: 'events',
  launder: 'launder',
  buy: 'shop',
  endDay: 'wages',
  escapeDisguise: 'escape',
  escapeRoute: 'escape',
  escapeEvent: 'escape',
  escapeBribe: 'escape',
  escapeQte: 'escape',
  escapeSurrender: 'escape',
  custodyVerdict: 'escape',
};

const money = (s: GameState) => s.dirtyCash + s.cleanCash;

/** จดเงินที่เปลี่ยนจาก action นี้ลงบันทึกของวันที่ action เกิด */
export function trackFlow(prev: GameState, s: GameState, action: Action): void {
  const delta = money(s) - money(prev);
  let log: DayLog | undefined;
  for (let i = s.history.length - 1; i >= 0; i--) {
    const h = s.history[i];
    if (h && h.day === prev.day) {
      log = h;
      break;
    }
  }
  if (log && s.preFlow) {
    // เงินที่เปลี่ยนก่อนวางแผน (เช่น เรื่องในซอยตอนเช้า) รวมเข้าวันนี้
    for (const [k, v] of Object.entries(s.preFlow) as [FlowKind, number][])
      log.flow = { ...log.flow, [k]: (log.flow?.[k] ?? 0) + v };
    delete s.preFlow;
  }
  if (delta === 0) return;
  const kind = kindOf[action.t] ?? 'other';
  if (!log) {
    s.preFlow = { ...s.preFlow, [kind]: (s.preFlow?.[kind] ?? 0) + delta };
    return;
  }
  log.flow = { ...log.flow, [kind]: (log.flow?.[kind] ?? 0) + delta };
}

export interface WeekLedger {
  week: number;
  fromDay: number;
  toDay: number;
  flow: Record<FlowKind, number>;
  /** ยอดที่ฟอกสำเร็จ (ย้ายจากเงินสกปรกเป็นสะอาด) */
  laundered: number;
  net: number;
}

/** สรุปบัญชีของสัปดาห์ที่ week (เริ่ม 1 = วันที่ 1–7) */
export function weekLedger(s: GameState, week: number): WeekLedger {
  const fromDay = (week - 1) * 7 + 1;
  const toDay = Math.min(s.maxDays, week * 7);
  const flow = Object.fromEntries(flowKinds.map((k) => [k, 0])) as Record<FlowKind, number>;
  let laundered = 0;
  for (const h of s.history) {
    if (h.day < fromDay || h.day > toDay) continue;
    laundered += h.laundered;
    for (const k of flowKinds) flow[k] += h.flow?.[k] ?? 0;
  }
  return { week, fromDay, toDay, flow, laundered, net: flowKinds.reduce((n, k) => n + flow[k], 0) };
}

/** สัปดาห์ที่เพิ่งจบ ถ้าวันนี้เป็นวันแรกของสัปดาห์ใหม่ (วันที่ 8, 15, ...) */
export function finishedWeek(s: GameState): number | null {
  return s.day > 1 && (s.day - 1) % 7 === 0 ? (s.day - 1) / 7 : null;
}
