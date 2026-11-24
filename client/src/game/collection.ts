import {
  addCards,
  addRun,
  bestHome,
  cardIdsOf,
  cars,
  cleanCareer,
  cleanScrapbook,
  emptyCareer,
  mergeCareer,
  mergeScrapbook,
  pets,
  petKey,
  carKey,
  homes,
  type Career,
  type GameState,
  type Scrapbook,
} from '@hts/shared';
import { content } from '@hts/shared/data';
import type { PublicUser } from '../net/api';

// สมุดภาพการ์ดเหยื่อกับยศในซอย: ของสะสมข้ามรอบ ไม่มีผลกับเกม ใช้โชว์อย่างเดียว
// ที่เก็บหลักอยู่บน server (ติดไปกับบัญชี) ส่วนในเครื่องเก็บสำเนาไว้ระหว่างเล่น
// และไว้ใช้ตอนเล่นออฟไลน์ ค่าที่โชว์คือของ server รวมกับของในเครื่อง

export { cardsFromRun, trapCards, type Career, type Scrapbook, type TrapCard, type VictimCard } from '@hts/shared';

export const allCardIds: string[] = cardIdsOf(content);

const bookKey = (uid?: string) => `hts.scrapbook.v1.${uid ?? 'offline'}`;
const careerKey = (uid?: string) => `hts.career.v1.${uid ?? 'offline'}`;

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as unknown;
  } catch {
    return {};
  }
}

function writeJson(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* เก็บไม่ได้ก็เล่นต่อได้ */
  }
}

/** สมุดในเครื่องอย่างเดียว */
export const localScrapbook = (uid?: string): Scrapbook => cleanScrapbook(readJson(bookKey(uid)), allCardIds);
/** ประวัติในเครื่องอย่างเดียว */
export const localCareer = (uid?: string): Career => cleanCareer(readJson(careerKey(uid)));

/** สมุดภาพที่ใช้โชว์: ของ server รวมกับของในเครื่อง */
export function loadScrapbook(user?: PublicUser | null): Scrapbook {
  const local = localScrapbook(user?.uid);
  return user?.scrapbook ? mergeScrapbook(cleanScrapbook(user.scrapbook, allCardIds), local) : local;
}

export function loadCareer(user?: PublicUser | null): Career {
  const local = localCareer(user?.uid);
  return user?.career ? mergeCareer(cleanCareer(user.career), local) : local;
}

/** เก็บการ์ดจากผลของวันนี้ลงเครื่อง (เรียกซ้ำได้ ไม่นับซ้ำ) คืน id การ์ดที่เพิ่งได้ */
export function collectCards(s: GameState, user?: PublicUser | null): string[] {
  const { book, fresh, changed } = addCards(localScrapbook(user?.uid), s.lastResults, s.seed);
  if (changed) writeJson(bookKey(user?.uid), book);
  // นับว่าใหม่เฉพาะใบที่ยังไม่มีบน server ด้วย (เคยได้จากเครื่องอื่นแล้วไม่นับ)
  const server = user?.scrapbook ? cleanScrapbook(user.scrapbook, allCardIds) : {};
  return fresh.filter((id) => !server[id]);
}

/** บันทึกรอบที่จบแล้วลงเครื่อง (ครั้งเดียวต่อ seed) server นับเองตอนส่งผล */
export function recordRun(s: GameState, user?: PublicUser | null): Career {
  const c = localCareer(user?.uid);
  const next = addRun(c, s);
  if (next !== c) writeJson(careerKey(user?.uid), next);
  return mergeCareer(user?.career ? cleanCareer(user.career) : emptyCareer(), next);
}

/**
 * ของในเครื่องที่ server ยังไม่มี (ข้อมูลก่อนย้ายมาเก็บที่ server หรือรอบที่ไม่ได้ส่ง)
 * คืน null ถ้าไม่มีอะไรต้องส่ง
 */
export function pendingUpload(user: PublicUser): { scrapbook: Scrapbook; career: Career } | null {
  if (user.scrapbook === undefined) return null; // server รุ่นเก่า
  const server = cleanScrapbook(user.scrapbook, allCardIds);
  const sc = cleanCareer(user.career);
  const book = localScrapbook(user.uid);
  const career = localCareer(user.uid);
  const newCard = Object.entries(book).some(([id, c]) => !server[id] || (c.won && !server[id]?.won));
  const ahead =
    career.runs > sc.runs ||
    career.survived > sc.survived ||
    career.escapes > sc.escapes ||
    career.bestScore > sc.bestScore ||
    career.honest > sc.honest;
  return newCard || ahead ? { scrapbook: book, career } : null;
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

export function rankCtx(user: PublicUser | null | undefined, owned: readonly string[]): RankCtx {
  return { career: loadCareer(user), cards: Object.keys(loadScrapbook(user)).length, owned };
}
