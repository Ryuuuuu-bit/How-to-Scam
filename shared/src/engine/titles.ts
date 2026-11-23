import type { Character, GameContent } from '../types/content';
import type { GameState } from '../types/state';

/** ฉายาของรอบนี้ตามสไตล์การเล่น (ใช้หลังจบรอบ) */
export function titleFor(s: GameState, c: GameContent): string {
  const cards: Record<string, number> = {};
  const methods: Record<string, number> = {};
  let rest = 0;
  for (const h of s.history) {
    if (h.launderCardId) cards[h.launderCardId] = (cards[h.launderCardId] ?? 0) + 1;
    if (h.methodId) methods[h.methodId] = (methods[h.methodId] ?? 0) + 1;
    else rest++;
  }
  const top = Object.entries(methods).sort((a, b) => b[1] - a[1])[0]?.[0];
  for (const t of c.titles) {
    const r = t.rule;
    const ok =
      (r.kind === 'caughtBy' && s.end?.reason === 'caught' && s.day <= r.day) ||
      (r.kind === 'card' && (cards[r.cardId] ?? 0) >= r.count) ||
      (r.kind === 'karma' && s.karma >= r.min) ||
      (r.kind === 'restDays' && rest >= r.count) ||
      (r.kind === 'method' && top === r.methodId) ||
      r.kind === 'always';
    if (ok) return t.id;
  }
  return c.titles.at(-1)?.id ?? '';
}

/** ความคืบหน้าข้ามรอบที่ใช้ตัดสินว่าเล่นอาชีพไหนได้ */
export interface UnlockProgress {
  xp: number;
  endings: string[];
  /** ของที่ซื้อหรือได้จากออดิชั่นแล้ว เช่น "char:live_seller" */
  owned?: string[];
}

export function isCharacterUnlocked(ch: Character, p: UnlockProgress): boolean {
  if (ch.unlockEnding) return p.endings.includes(ch.unlockEnding);
  if (ch.price !== undefined && !(p.owned ?? []).includes(`char:${ch.id}`)) return false;
  return p.xp >= (ch.unlockXp ?? 0);
}
