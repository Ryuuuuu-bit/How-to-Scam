import {
  achievementsFor,
  auditionsPassed,
  charKey,
  isCharacterUnlocked,
  legacyCharacterKeys,
  marketPrice,
  marketRequires,
  moneyForRun,
  xpForRun,
} from '@hts/shared';
import type { Character, GameState, UnlockProgress } from '@hts/shared';
import { content } from './content';

// ความคืบหน้าข้ามรอบ (meta progression) เก็บในเครื่อง
// ล็อกอินอยู่ใช้ของ server แทน
const META_KEY = 'hts.meta.v1';

export interface Meta {
  /** แต้มประสบการณ์ (โชว์เป็นค่าหัว) */
  xp: number;
  runs: number;
  endings: string[];
  /** seed ของรอบที่ให้แต้มไปแล้ว กันนับซ้ำ */
  awarded: string[];
  /** เหรียญที่ได้ตอนเล่นออฟไลน์ */
  achievements: string[];
  /** เงินใต้ดิน */
  money: number;
  /** ของที่ซื้อหรือได้จากออดิชั่นแล้ว */
  owned: string[];
}

const empty: Meta = {
  xp: 0,
  runs: 0,
  endings: [],
  awarded: [],
  achievements: [],
  money: 0,
  owned: [],
};

/** ความคืบหน้าที่ใช้ปลดล็อกและซื้อของ */
export interface Progress extends UnlockProgress {
  money: number;
  owned: string[];
}

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { ...empty, owned: [] };
    const saved = JSON.parse(raw) as Partial<Meta>;
    const m: Meta = { ...empty, ...saved };
    // คนที่เคยเล่นก่อนมีตลาดใต้ดิน ได้ตัวละครที่เคยเปิดครบเหมือนเดิม
    if (!Array.isArray(saved.owned)) {
      m.owned = m.runs > 0 ? legacyCharacterKeys(content) : [];
      saveMeta(m);
    }
    return m;
  } catch {
    return { ...empty, owned: [] };
  }
}

function saveMeta(m: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    // เล่นต่อได้ แค่ไม่จำความคืบหน้า
  }
}

export function isUnlocked(ch: Character, m: UnlockProgress): boolean {
  return isCharacterUnlocked(ch, m);
}

/** ความคืบหน้าที่ใช้ปลดล็อก: ล็อกอินอยู่ใช้ของ server ไม่งั้นใช้ของในเครื่อง */
export function progressFor(
  user: {
    xp: number;
    endings: string[];
    money?: number;
    owned?: string[];
    runsPlayed?: number;
  } | null,
): Progress {
  if (!user) return loadMeta();
  // server รุ่นเก่ายังไม่ส่ง owned: ถือว่าเปิดตัวละครเดิมไว้ก่อน
  const owned = user.owned ?? legacyCharacterKeys(content);
  return { xp: user.xp, endings: user.endings, money: user.money ?? 0, owned };
}

/** ซื้อของในเครื่อง (เล่นออฟไลน์) */
export function buyLocal(key: string): Meta | null {
  const m = loadMeta();
  const price = marketPrice(content, key);
  if (price === null || m.owned.includes(key) || m.money < price) return null;
  const need = marketRequires(key);
  if (need && !m.owned.includes(need)) return null;
  const next = { ...m, money: m.money - price, owned: [...m.owned, key] };
  saveMeta(next);
  return next;
}

export interface RunAward {
  gained: number;
  money: number;
  unlocked: Character[];
  auditions: Character[];
  newAchievements: string[];
}

export const noAward: RunAward = {
  gained: 0,
  money: 0,
  unlocked: [],
  auditions: [],
  newAchievements: [],
};

/** ให้แต้มจากรอบที่จบแล้ว (ครั้งเดียวต่อ seed) คืนแต้ม เงิน และตัวละครที่เพิ่งได้ */
export function awardRun(s: GameState): RunAward {
  const m = loadMeta();
  if (!s.end || m.awarded.includes(s.seed)) return noAward;
  const newAchievements = achievementsFor(s, { runs: m.runs + 1, daily: false }, content).filter(
    (a) => !m.achievements.includes(a),
  );
  const before = content.characters.filter((c) => isUnlocked(c, m)).map((c) => c.id);
  const gained = xpForRun(s);
  const money = moneyForRun(s);
  const passed = auditionsPassed(s, content, m.owned);
  const next: Meta = {
    xp: m.xp + gained,
    runs: m.runs + 1,
    endings: m.endings.includes(s.end.endingId) ? m.endings : [...m.endings, s.end.endingId],
    awarded: [...m.awarded, s.seed].slice(-200),
    achievements: [...m.achievements, ...newAchievements],
    money: m.money + money,
    owned: [...m.owned, ...passed.map(charKey)],
  };
  saveMeta(next);
  const unlocked = content.characters.filter((c) => isUnlocked(c, next) && !before.includes(c.id));
  return {
    gained,
    money,
    unlocked: unlocked.filter((c) => !passed.includes(c.id)),
    auditions: content.characters.filter((c) => passed.includes(c.id)),
    newAchievements,
  };
}
