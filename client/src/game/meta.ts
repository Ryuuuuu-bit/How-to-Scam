import { xpForRun } from '@hts/shared';
import type { Character, GameState } from '@hts/shared';
import { content } from '@hts/shared/data';

// ความคืบหน้าข้ามรอบ (meta progression) เก็บในเครื่อง
// Phase 3 จะย้ายไปเก็บที่ server ผูกกับบัญชี
const META_KEY = 'hts.meta.v1';

export interface Meta {
  xp: number;
  runs: number;
  endings: string[];
  /** seed ของรอบที่ให้แต้มไปแล้ว กันนับซ้ำ */
  awarded: string[];
}

const empty: Meta = { xp: 0, runs: 0, endings: [], awarded: [] };

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { ...empty };
    return { ...empty, ...(JSON.parse(raw) as Partial<Meta>) };
  } catch {
    return { ...empty };
  }
}

function saveMeta(m: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    // เล่นต่อได้ แค่ไม่จำความคืบหน้า
  }
}

export function isUnlocked(ch: Character, m: Meta): boolean {
  if (ch.unlockEnding) return m.endings.includes(ch.unlockEnding);
  return m.xp >= (ch.unlockXp ?? 0);
}

/** ให้แต้มจากรอบที่จบแล้ว (ครั้งเดียวต่อ seed) คืนแต้มที่ได้และอาชีพที่เพิ่งปลดล็อก */
export function awardRun(s: GameState): { gained: number; unlocked: Character[] } {
  const m = loadMeta();
  if (!s.end || m.awarded.includes(s.seed)) return { gained: 0, unlocked: [] };
  const before = content.characters.filter((c) => isUnlocked(c, m)).map((c) => c.id);
  const gained = xpForRun(s);
  const next: Meta = {
    xp: m.xp + gained,
    runs: m.runs + 1,
    endings: m.endings.includes(s.end.endingId) ? m.endings : [...m.endings, s.end.endingId],
    awarded: [...m.awarded, s.seed].slice(-200),
  };
  saveMeta(next);
  const unlocked = content.characters.filter((c) => isUnlocked(c, next) && !before.includes(c.id));
  return { gained, unlocked };
}
