import { casualMarker } from './casual';
import { questSeedPrefix } from './opening';

export const durations = [30, 60, 90] as const;
export type Duration = (typeof durations)[number];
const campaignPrefix = questSeedPrefix + 'campaign1:';

export function campaignSeed(days: Duration, nonce: string, casual = true) {
  // 1.0: 'v1:' เปิดซอยมีชีวิตและสารวัตรคู่ปรับ seed เก่าที่ไม่มีเครื่องหมายนี้เล่นกติกาเดิม
  // 'easy:' เปิดโหมดเล่นสบาย (casual.ts) รอบใหม่ทุกรอบใช้โหมดนี้
  return campaignPrefix + days + ':v1:' + (casual ? casualMarker : '') + nonce;
}

export function campaignDays(seed: string) {
  return durations.find(days => seed.startsWith(campaignPrefix + days + ':'));
}
