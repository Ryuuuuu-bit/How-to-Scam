// RNG แบบมี seed (mulberry32) — ห้ามใช้ Math.random ใน engine
// สถานะ RNG เป็นตัวเลข uint32 เก็บไว้ใน GameState เพื่อให้ replay ได้ผลเดิมเสมอ

import type { Range } from '../types/content';

/** แปลง seed ข้อความเป็น uint32 (FNV-1a) */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** ตัวช่วยใช้ภายใน step เท่านั้น: อ่านสถานะ → สุ่ม → เขียนกลับ */
export class Rng {
  constructor(public state: number) {}

  /** 0 ≤ x < 1 */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** จำนวนเต็มในช่วง [min, max] */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  range(r: Range): number {
    return this.int(r[0], r[1]);
  }

  /** true ด้วยโอกาส pct% */
  chance(pct: number): boolean {
    return this.next() * 100 < pct;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** เลือกตามน้ำหนัก คืน index */
  weightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
    if (total <= 0) return -1;
    let roll = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= Math.max(0, weights[i] ?? 0);
      if (roll < 0) return i;
    }
    return weights.length - 1;
  }

  /** สุ่มหยิบ n ชิ้นไม่ซ้ำ */
  sample<T>(items: readonly T[], n: number): T[] {
    const pool = [...items];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
      const i = this.int(0, pool.length - 1);
      out.push(pool.splice(i, 1)[0] as T);
    }
    return out;
  }
}
