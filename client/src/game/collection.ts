import { bestHome, cars, pets, petKey, carKey, homes, type GameState, type LastResult } from '@hts/shared';
import { content } from '@hts/shared/data';

// สมุดภาพการ์ดเหยื่อกับยศในซอย: ของสะสมข้ามรอบ เก็บในเครื่องแยกตามบัญชี
// ไม่มีผลกับเกม ใช้โชว์อย่างเดียว

// ---------- สมุดภาพการ์ดเหยื่อ ----------

/** การ์ดพิเศษจากสายที่หลอกกลับมา */
export const trapCards = ['baiter', 'undercover'] as const;
export type TrapCard = (typeof trapCards)[number];

export interface VictimCard {
  /** id รูปหน้าตา (content.victims) หรือ id การ์ดพิเศษ */
  portrait: string;
  /** มุกที่ใช้ครั้งแรก */
  pitchId?: string;
  /** เคยหลอกสำเร็จไหม */
  won: boolean;
  /** seed ของรอบที่ได้การ์ดใบนี้ครั้งแรก */
  firstSeed: string;
}

export type Scrapbook = Record<string, VictimCard>;

const bookKey = (uid?: string) => `hts.scrapbook.v1.${uid ?? 'offline'}`;

export const allCardIds: string[] = [
  ...content.victimParts.names.map((_, i) => `n${i}`),
  ...trapCards,
];

export function loadScrapbook(uid?: string): Scrapbook {
  try {
    const raw = JSON.parse(localStorage.getItem(bookKey(uid)) ?? '{}') as unknown;
    return raw && typeof raw === 'object' ? (raw as Scrapbook) : {};
  } catch {
    return {};
  }
}

function cardFrom(r: LastResult, seed: string): [string, VictimCard] | null {
  if (r.kind === 'baited') return ['baiter', { portrait: 'baiter', won: false, firstSeed: seed }];
  if (r.kind === 'sting') return ['undercover', { portrait: 'undercover', won: false, firstSeed: seed }];
  if (r.kind !== 'call' || !r.textKey) return null;
  const [portrait, pitchId, nameIdx] = r.textKey.split(':');
  if (!portrait || nameIdx === undefined) return null;
  return [`n${nameIdx}`, { portrait, pitchId, won: !!r.success, firstSeed: seed }];
}

/** เก็บการ์ดจากผลของวันนี้ (เรียกซ้ำได้ ไม่นับซ้ำ) คืน id การ์ดที่เพิ่งได้ */
export function collectCards(s: GameState, uid?: string): string[] {
  const book = loadScrapbook(uid);
  const fresh: string[] = [];
  let changed = false;
  for (const r of s.lastResults) {
    const got = cardFrom(r, s.seed);
    if (!got) continue;
    const [id, card] = got;
    const had = book[id];
    if (!had) {
      book[id] = card;
      fresh.push(id);
      changed = true;
    } else if (card.won && !had.won) {
      book[id] = { ...had, won: true };
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem(bookKey(uid), JSON.stringify(book));
    } catch {
      /* เก็บไม่ได้ก็เล่นต่อได้ */
    }
  }
  return fresh;
}

/** การ์ดที่ได้ใหม่ในรอบนี้ */
export const cardsFromRun = (book: Scrapbook, seed: string) =>
  Object.keys(book).filter((id) => book[id]?.firstSeed === seed);

// ---------- ประวัติการเล่นข้ามรอบ ----------

export interface Career {
  seeds: string[];
  runs: number;
  /** จบแบบรอดครบรอบหรือวางมือ */
  survived: number;
  escapes: number;
  bestScore: number;
  honest: number;
}

const careerKey = (uid?: string) => `hts.career.v1.${uid ?? 'offline'}`;
const emptyCareer: Career = { seeds: [], runs: 0, survived: 0, escapes: 0, bestScore: 0, honest: 0 };

export function loadCareer(uid?: string): Career {
  try {
    const raw = JSON.parse(localStorage.getItem(careerKey(uid)) ?? '{}') as Partial<Career>;
    return { ...emptyCareer, ...raw, seeds: Array.isArray(raw.seeds) ? raw.seeds : [] };
  } catch {
    return { ...emptyCareer };
  }
}

/** บันทึกรอบที่จบแล้ว (ครั้งเดียวต่อ seed) */
export function recordRun(s: GameState, uid?: string): Career {
  const c = loadCareer(uid);
  if (!s.end || c.seeds.includes(s.seed)) return c;
  const next: Career = {
    seeds: [...c.seeds, s.seed].slice(-300),
    runs: c.runs + 1,
    survived: c.survived + (s.end.reason === 'survived' || s.end.reason === 'retired' ? 1 : 0),
    escapes: c.escapes + s.escapes,
    bestScore: Math.max(c.bestScore, s.end.score),
    honest: c.honest + (s.end.endingId === 'honest_shop' ? 1 : 0),
  };
  try {
    localStorage.setItem(careerKey(uid), JSON.stringify(next));
  } catch {
    /* ไม่เป็นไร */
  }
  return next;
}

// ---------- ยศในซอย ----------

export interface RankCtx {
  career: Career;
  cards: number;
  owned: readonly string[];
}

export interface Quest {
  label: string;
  have: (x: RankCtx) => number;
  need: number;
}

export interface SoiRank {
  id: string;
  name: string;
  blurb: string;
  quests: Quest[];
}

const ownsAny = (owned: readonly string[], keys: string[]) => (keys.some((k) => owned.includes(k)) ? 1 : 0);
const homeLevel = (owned: readonly string[]) => homes.findIndex((h) => h.id === bestHome(owned));

export const soiRanks: SoiRank[] = [
  { id: 'rookie', name: 'มือใหม่ในซอย', blurb: 'ยังไม่มีใครจำชื่อได้ แม่ค้ายังทอนเงินผิดให้', quests: [] },
  {
    id: 'sim_runner',
    name: 'เด็กเดินซิม',
    blurb: 'วิ่งส่งซิมให้แก๊งทั่วซอย ยามหน้าหมู่บ้านเริ่มทักทาย',
    quests: [
      { label: 'เล่นจบ 3 รอบ', have: (x) => x.career.runs, need: 3 },
      { label: 'สะสมการ์ดเหยื่อ 5 ใบ', have: (x) => x.cards, need: 5 },
    ],
  },
  {
    id: 'desk_boss',
    name: 'หัวหน้าโต๊ะโทร',
    blurb: 'มีโต๊ะของตัวเอง มีคนเรียกพี่ มีแก้วกาแฟที่ห้ามใครยืม',
    quests: [
      { label: 'อยู่รอดจนจบรอบ 1 ครั้ง', have: (x) => x.career.survived, need: 1 },
      { label: 'ย้ายเข้าคอนโด', have: (x) => (homeLevel(x.owned) >= 1 ? 1 : 0), need: 1 },
      { label: 'สะสมการ์ดเหยื่อ 12 ใบ', have: (x) => x.cards, need: 12 },
    ],
  },
  {
    id: 'soi_tycoon',
    name: 'เสี่ยปากซอย',
    blurb: 'ร้านข้าวมันไก่เก็บโต๊ะประจำไว้ให้ หมาทั้งซอยไม่เห่า',
    quests: [
      { label: 'หนีตำรวจรอดรวม 5 ครั้ง', have: (x) => x.career.escapes, need: 5 },
      { label: 'มีสัตว์เลี้ยงอย่างน้อย 1 ตัว', have: (x) => ownsAny(x.owned, pets.map((p) => petKey(p.id))), need: 1 },
      { label: 'มีรถหนีตำรวจอย่างน้อย 1 คัน', have: (x) => ownsAny(x.owned, cars.map((c) => carKey(c.id))), need: 1 },
    ],
  },
  {
    id: 'godfather',
    name: 'เจ้าพ่อซอย',
    blurb: 'ทั้งซอยรู้ว่าใคร แต่ไม่มีใครกล้าพูดชื่อ',
    quests: [
      { label: 'อยู่รอดจนจบรอบ 5 ครั้ง', have: (x) => x.career.survived, need: 5 },
      { label: 'ย้ายเข้าบ้านเดี่ยว', have: (x) => (homeLevel(x.owned) >= 2 ? 1 : 0), need: 1 },
      { label: `สะสมการ์ดเหยื่อครบ ${allCardIds.length} ใบ`, have: (x) => x.cards, need: allCardIds.length },
    ],
  },
];

export const questDone = (q: Quest, x: RankCtx) => q.have(x) >= q.need;

/** ยศปัจจุบัน: ต้องทำภารกิจของยศนั้นและยศก่อนหน้าครบ */
export function soiRankIndex(x: RankCtx): number {
  let i = 0;
  for (let k = 1; k < soiRanks.length; k++) {
    if (!soiRanks[k]?.quests.every((q) => questDone(q, x))) break;
    i = k;
  }
  return i;
}

export function rankCtx(uid: string | undefined, owned: readonly string[]): RankCtx {
  return { career: loadCareer(uid), cards: Object.keys(loadScrapbook(uid)).length, owned };
}
