import { bountyOf } from '@hts/shared';

/** ค่าหัวแบบอ่านง่าย เช่น "฿1.2 ล้าน" */
export function bountyText(xp: number): string {
  const n = bountyOf(xp);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `฿${m >= 100 ? Math.round(m).toLocaleString('th-TH') : m.toFixed(1).replace(/\.0$/, '')} ล้าน`;
  }
  return `฿${n.toLocaleString('th-TH')}`;
}

export const moneyText = (n: number) => `฿${n.toLocaleString('th-TH')}`;
