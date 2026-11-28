// ซีซั่นรายเดือนตามเวลาไทย (UTC+7) — id เช่น "2026-11"
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface SeasonInfo {
  id: string;
  startsAt: Date;
  endsAt: Date;
}

export function seasonFor(now: Date): SeasonInfo {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const y = bkk.getUTCFullYear();
  const m = bkk.getUTCMonth();
  const startsAt = new Date(Date.UTC(y, m, 1) - BKK_OFFSET_MS);
  const endsAt = new Date(Date.UTC(y, m + 1, 1) - BKK_OFFSET_MS);
  return { id: `${y}-${String(m + 1).padStart(2, '0')}`, startsAt, endsAt };
}

/** สัปดาห์ตามเวลาไทย เริ่มวันจันทร์ 00:00 — id คือวันจันทร์นั้น เช่น "2026-11-30" */
export function weekFor(now: Date): SeasonInfo {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const sinceMonday = (bkk.getUTCDay() + 6) % 7;
  const monday = Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate() - sinceMonday);
  const startsAt = new Date(monday - BKK_OFFSET_MS);
  const endsAt = new Date(monday + 7 * 86_400_000 - BKK_OFFSET_MS);
  return { id: new Date(monday).toISOString().slice(0, 10), startsAt, endsAt };
}

export const isSeasonId = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
