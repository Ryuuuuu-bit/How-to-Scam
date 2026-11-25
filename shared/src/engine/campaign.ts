import { questSeedPrefix } from './opening';

export const durations = [30, 60, 90] as const;
export type Duration = (typeof durations)[number];
const campaignPrefix = questSeedPrefix + 'campaign1:';

export function campaignSeed(days: Duration, nonce: string) {
  // 1.0: 'v1:' เปิดซอยมีชีวิตและสารวัตรคู่ปรับ seed เก่าที่ไม่มีเครื่องหมายนี้เล่นกติกาเดิม
  return campaignPrefix + days + ':v1:' + nonce;
}

/** seed รุ่น 1.1: ซอยมีชีวิต 1.0 + กติกา "เสี่ยงแล้วคุ้ม" (engine/risk.ts) */
export function riskSeed(days: Duration, nonce: string) {
  return campaignPrefix + days + ':v1:risk1:' + nonce;
}

export function campaignDays(seed: string) {
  return durations.find(days => seed.startsWith(campaignPrefix + days + ':'));
}
