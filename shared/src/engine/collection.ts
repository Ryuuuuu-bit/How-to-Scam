import type { GameContent } from '../types/content';
import type { Action, GameState, LastResult } from '../types/state';
import { newGame, step } from './reducer';

// สมุดภาพการ์ดเหยื่อกับประวัติการเล่นข้ามรอบ (ใช้คิดยศในซอย)
// ใช้ร่วมกันทั้ง client และ server: server เป็นที่เก็บหลัก client เก็บสำเนาในเครื่องไว้ระหว่างเล่น

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

export interface Career {
  seeds: string[];
  runs: number;
  /** จบแบบรอดครบรอบหรือวางมือ */
  survived: number;
  escapes: number;
  bestScore: number;
  honest: number;
}

export const emptyCareer = (): Career => ({
  seeds: [],
  runs: 0,
  survived: 0,
  escapes: 0,
  bestScore: 0,
  honest: 0,
});

const MAX_SEEDS = 300;

export const cardIdsOf = (c: GameContent): string[] => [
  ...c.victimParts.names.map((_, i) => `n${i}`),
  ...trapCards,
];

function cardFrom(r: LastResult, seed: string): [string, VictimCard] | null {
  if (r.kind === 'baited') return ['baiter', { portrait: 'baiter', won: false, firstSeed: seed }];
  if (r.kind === 'sting')
    return ['undercover', { portrait: 'undercover', won: false, firstSeed: seed }];
  if (r.kind !== 'call' || !r.textKey) return null;
  const [portrait, pitchId, nameIdx] = r.textKey.split(':');
  if (!portrait || nameIdx === undefined) return null;
  return [`n${nameIdx}`, { portrait, pitchId, won: !!r.success, firstSeed: seed }];
}

/** เพิ่มการ์ดจากผลของวัน (เรียกซ้ำได้ ไม่นับซ้ำ) คืนสมุดใหม่กับ id การ์ดที่เพิ่งได้ */
export function addCards(book: Scrapbook, results: readonly LastResult[], seed: string) {
  const next: Scrapbook = { ...book };
  const fresh: string[] = [];
  let changed = false;
  for (const r of results) {
    const got = cardFrom(r, seed);
    if (!got) continue;
    const [id, card] = got;
    const had = next[id];
    if (!had) {
      next[id] = card;
      fresh.push(id);
      changed = true;
    } else if (card.won && !had.won) {
      next[id] = { ...had, won: true };
      changed = true;
    }
  }
  return { book: next, fresh, changed };
}

/** การ์ดที่ได้ใหม่ในรอบนี้ */
export const cardsFromRun = (book: Scrapbook, seed: string) =>
  Object.keys(book).filter((id) => book[id]?.firstSeed === seed);

/** นับรอบที่จบแล้วเข้าประวัติ (ครั้งเดียวต่อ seed) */
export function addRun(c: Career, s: GameState): Career {
  if (!s.end || c.seeds.includes(s.seed)) return c;
  return {
    seeds: [...c.seeds, s.seed].slice(-MAX_SEEDS),
    runs: c.runs + 1,
    survived: c.survived + (s.end.reason === 'survived' || s.end.reason === 'retired' ? 1 : 0),
    escapes: c.escapes + s.escapes,
    bestScore: Math.max(c.bestScore, s.end.score),
    honest: c.honest + (s.end.endingId === 'honest_shop' ? 1 : 0),
  };
}

/** รวมสมุดสองเล่ม: ได้ทุกใบ เก็บวันที่ได้ครั้งแรกของเล่มแรก และนับว่าหลอกสำเร็จถ้าเล่มไหนก็ได้สำเร็จ */
export function mergeScrapbook(a: Scrapbook, b: Scrapbook): Scrapbook {
  const out: Scrapbook = { ...a };
  for (const [id, card] of Object.entries(b)) {
    const had = out[id];
    out[id] = had ? { ...had, won: had.won || card.won } : card;
  }
  return out;
}

/**
 * รวมประวัติสองชุดโดยไม่นับซ้ำ: ตัวเลขเอาค่ามากสุด (สองชุดอาจนับรอบเดียวกันมาแล้ว)
 * ถ้าชุดหนึ่งมีรอบที่อีกชุดไม่มี ก็บวกส่วนที่เกินจากรอบเหล่านั้นไม่ได้ จึงใช้ค่ามากสุดซึ่งไม่ทำให้ยศลด
 */
export function mergeCareer(a: Career, b: Career): Career {
  const seeds = [...a.seeds, ...b.seeds.filter((x) => !a.seeds.includes(x))].slice(-MAX_SEEDS);
  return {
    seeds,
    runs: Math.max(a.runs, b.runs),
    survived: Math.max(a.survived, b.survived),
    escapes: Math.max(a.escapes, b.escapes),
    bestScore: Math.max(a.bestScore, b.bestScore),
    honest: Math.max(a.honest, b.honest),
  };
}

const int = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : undefined);

/** ตรวจสมุดที่อ่านมาจากที่เก็บหรือจาก client: ทิ้งใบที่ไม่รู้จักหรือรูปแบบผิด */
export function cleanScrapbook(raw: unknown, validIds: readonly string[]): Scrapbook {
  const out: Scrapbook = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const id of validIds) {
    const v = (raw as Record<string, unknown>)[id];
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    const portrait = str(o.portrait, 64);
    const firstSeed = str(o.firstSeed, 200) ?? '';
    if (!portrait) continue;
    const pitchId = str(o.pitchId, 64);
    out[id] = { portrait, won: o.won === true, firstSeed, ...(pitchId ? { pitchId } : {}) };
  }
  return out;
}

/** ตรวจประวัติที่อ่านมาจากที่เก็บหรือจาก client */
export function cleanCareer(raw: unknown): Career {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyCareer();
  const o = raw as Record<string, unknown>;
  const seeds = Array.isArray(o.seeds)
    ? o.seeds.filter((x): x is string => typeof x === 'string' && x.length <= 200).slice(-MAX_SEEDS)
    : [];
  const runs = int(o.runs, 100_000);
  return {
    seeds,
    runs,
    survived: Math.min(runs, int(o.survived, 100_000)),
    escapes: int(o.escapes, 1_000_000),
    bestScore: int(o.bestScore, 1_000_000_000),
    honest: Math.min(runs, int(o.honest, 100_000)),
  };
}

/** replay พร้อมเก็บการ์ดทุกวัน (server ใช้ตอนรับผลรอบ) */
export function replayWithCards(
  seed: string,
  characterId: string,
  actions: readonly Action[],
  c: GameContent,
): { state: GameState; cards: Scrapbook } {
  let s = newGame(seed, characterId, c);
  let cards: Scrapbook = {};
  for (const a of actions) {
    s = step(s, a, c);
    if (s.lastResults.length > 0) cards = addCards(cards, s.lastResults, seed).book;
  }
  return { state: s, cards };
}
