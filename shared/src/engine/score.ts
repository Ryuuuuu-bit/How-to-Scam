import type { EndReason, GameContent } from '../types/content';
import type { GameState } from '../types/state';
import type { Rng } from './rng';

/** คะแนน = เงินสะอาด × ตัวคูณวันที่รอด × ตัวคูณสไตล์ */
export function computeScore(s: GameState, c: GameContent, reason: EndReason): number {
  const { maxDays, score } = c.config;
  const days = reason === 'survived' ? maxDays : s.day;
  const daysMult = 1 + (score.daysWeight * days) / maxDays;
  const total = c.methods.length;
  const used = s.methodsUsed.length;
  let style = 1 + (total > 1 ? (score.maxVarietyBonus * Math.max(0, used - 1)) / (total - 1) : 0);
  if (s.escapes === 0 && reason !== 'caught') style += score.noEscapeBonus;
  return Math.round(s.cleanCash * daysMult * style);
}

export function pickEnding(s: GameState, c: GameContent, reason: EndReason): string {
  const sorted = [...c.endings].sort((a, b) => a.priority - b.priority);
  for (const e of sorted) {
    const w = e.when;
    if (w.reasons && !w.reasons.includes(reason)) continue;
    if (w.karma && (s.karma < w.karma[0] || s.karma > w.karma[1])) continue;
    if (w.minCleanCash !== undefined && s.cleanCash < w.minCleanCash) continue;
    if (w.maxCleanCash !== undefined && s.cleanCash > w.maxCleanCash) continue;
    if (w.flagsAll && !w.flagsAll.every((f) => s.flags.includes(f))) continue;
    return e.id;
  }
  const fallback = sorted.at(-1);
  if (!fallback) throw new Error('content has no endings');
  return fallback.id;
}

/** เลือกการ์ดสัญญาณอันตราย 1–2 ใบ ให้ตรงกับสิ่งที่เกิดในรอบนี้ */
export function pickDangerSigns(s: GameState, c: GameContent, rng: Rng): string[] {
  const scored = c.dangerSigns.map((d) => {
    const m = (d.triggers.methods ?? []).filter((x) => s.methodsUsed.includes(x)).length;
    const e = (d.triggers.events ?? []).filter((x) => s.seenEvents.includes(x)).length;
    return { id: d.id, score: m * 2 + e, tie: rng.next() };
  });
  const relevant = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.tie - b.tie);
  if (relevant.length > 0) return relevant.slice(0, 2).map((x) => x.id);
  const generic = c.dangerSigns.filter((d) => !d.triggers.methods && !d.triggers.events);
  const pick = generic.length > 0 ? rng.pick(generic) : c.dangerSigns[0];
  return pick ? [pick.id] : [];
}

/** แต้มประสบการณ์แก๊งที่ได้จากรอบนี้ (ใช้ปลดล็อกอาชีพ) */
export function xpForRun(s: GameState): number {
  if (!s.end) return 0;
  const days = s.end.reason === 'survived' ? 30 : s.day;
  return days + Math.floor(s.end.score / 5_000) + s.methodsUsed.length * 3;
}
