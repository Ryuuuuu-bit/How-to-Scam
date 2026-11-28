// ลูกศิษย์สืบทอดแก๊ง: รอบที่จบแล้วส่งมรดก 1 อย่างกับภาระ 1 อย่างให้รอบถัดไป
// ข้อมูลมรดกอยู่ใน seed เป็น "|A=<รุ่น>.<ของ>.<ภาระ>" (ก่อน "|L=" ของ loadout) seed เก่าไม่มีป้ายนี้จึงเล่นเหมือนเดิม
import type { GameContent } from '../types/content';
import type { GameState, SoiNpcId } from '../types/state';
import { addEvidence, npcIds } from './soi';

export type HeirGift = 'cash' | 'fame' | SoiNpcId;
export type HeirDebt = 'none' | 'debt' | 'case';
export interface HeirOffer {
  /** รุ่นของลูกศิษย์ (อาจารย์รุ่นแรก = 1 ลูกศิษย์ = 2) */
  gen: number;
  gift: HeirGift;
  debt: HeirDebt;
  /** ฉากจบของอาจารย์ (ไว้เล่าเรื่อง) */
  from: string;
}

const gifts: readonly HeirGift[] = ['cash', 'fame', ...npcIds];
const debts: readonly HeirDebt[] = ['none', 'debt', 'case'];
const tagRe = /\|A=(\d{1,3})\.([a-z]+)\.([a-z]+)(?=\||$)/;
export const MAX_GEN = 999;

export const isHeirGift = (v: unknown): v is HeirGift =>
  typeof v === 'string' && (gifts as readonly string[]).includes(v);
export const isHeirDebt = (v: unknown): v is HeirDebt =>
  typeof v === 'string' && (debts as readonly string[]).includes(v);

/** ใส่ป้ายลูกศิษย์ลงใน seed (ต้องเรียกก่อน seedWithLoadout) */
export function seedWithApprentice(
  seed: string,
  h: Pick<HeirOffer, 'gen' | 'gift' | 'debt'>,
): string {
  return `${seed}|A=${Math.min(MAX_GEN, Math.max(2, h.gen))}.${h.gift}.${h.debt}`;
}

export function apprenticeOf(seed: string): Pick<HeirOffer, 'gen' | 'gift' | 'debt'> | null {
  const m = tagRe.exec(seed);
  if (!m || !isHeirGift(m[2]) || !isHeirDebt(m[3])) return null;
  const gen = Number(m[1]);
  return gen >= 2 ? { gen, gift: m[2], debt: m[3] } : null;
}

/** รุ่นของรอบนี้ (รอบปกติ = 1) */
export const generationOf = (seed: string): number => apprenticeOf(seed)?.gen ?? 1;

/** ใช้มรดกกับภาระตอนเริ่มรอบ (ไม่ใช้ RNG) */
export function applyApprentice(s: GameState, c: GameContent): void {
  const a = apprenticeOf(s.seed);
  if (!a) return;
  const cfg = c.config.apprentice;
  if (a.gift === 'cash') s.dirtyCash += cfg.giftCash;
  else if (a.gift === 'fame') s.fame += cfg.giftFame;
  else if (s.soi) s.soi.rep[a.gift] = cfg.giftRep;
  if (a.debt === 'debt') s.dirtyCash = Math.max(0, s.dirtyCash - cfg.debtCash);
  if (a.debt === 'case' && s.case) addEvidence(s, 'oldcase', cfg.oldCaseWeight);
  s.lastResults = [];
  if (!s.flags.includes('apprentice')) s.flags.push('apprentice');
}

/** มรดกที่รอบนี้ส่งต่อให้ลูกศิษย์ */
export function heirFrom(s: GameState): HeirOffer | null {
  if (!s.end) return null;
  const gen = Math.min(MAX_GEN, generationOf(s.seed) + 1);
  const ally = s.soi
    ? [...npcIds]
        .sort((a, b) => (s.soi?.rep[b] ?? 0) - (s.soi?.rep[a] ?? 0))
        .find((n) => (s.soi?.rep[n] ?? 0) >= 2)
    : undefined;
  const gift: HeirGift = ally ?? (s.fame >= 30 ? 'fame' : 'cash');
  const debt: HeirDebt = s.end.reason === 'caught' ? 'case' : s.cleanCash < 5_000 ? 'debt' : 'none';
  return { gen, gift, debt, from: s.end.endingId };
}
