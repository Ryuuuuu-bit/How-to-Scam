import type { Effect, Stat } from '../types/content';
import type { GameState } from '../types/state';
import type { Rng } from './rng';

export const HEAT_MAX = 100;

export function clampHeat(s: GameState): void {
  s.heat = Math.max(0, Math.min(HEAT_MAX, Math.round(s.heat)));
}

function setStat(s: GameState, stat: Stat, value: number): void {
  s[stat] = Math.round(value);
  if (stat === 'dirtyCash' || stat === 'cleanCash') s[stat] = Math.max(0, s[stat]);
  if (stat === 'heat') clampHeat(s);
}

/** ใช้ effect กับ state (mutate draft) */
export function applyEffect(s: GameState, e: Effect, rng: Rng): void {
  switch (e.kind) {
    case 'add': {
      const v = typeof e.value === 'number' ? e.value : rng.range(e.value);
      setStat(s, e.stat, s[e.stat] + v);
      return;
    }
    case 'mul':
      setStat(s, e.stat, s[e.stat] * e.value);
      return;
    case 'flag':
      if (e.remove) s.flags = s.flags.filter((f) => f !== e.flag);
      else if (!s.flags.includes(e.flag)) s.flags.push(e.flag);
      return;
    case 'modifier':
      s.modifiers.push({
        target: e.target,
        ...(e.methodId ? { methodId: e.methodId } : {}),
        pct: e.pct,
        daysLeft: e.days,
      });
      return;
    case 'loseHenchman':
      if (s.henchmen.length > 0) s.henchmen.splice(rng.int(0, s.henchmen.length - 1), 1);
      return;
    case 'loyalty':
      for (const h of s.henchmen) h.loyalty = Math.max(0, Math.min(100, h.loyalty + e.value));
      return;
    case 'romanceBond':
      s.romance.bond = Math.max(0, s.romance.bond + e.value);
      return;
  }
}

export function applyEffects(s: GameState, effects: readonly Effect[], rng: Rng): void {
  for (const e of effects) applyEffect(s, e, rng);
}

/** รวม % ของ modifier ที่ใช้ได้กับ target/method นี้ */
export function modifierPct(
  s: GameState,
  target: 'income' | 'heat',
  methodId: string | null,
): number {
  return s.modifiers
    .filter((m) => m.target === target && (!m.methodId || m.methodId === methodId))
    .reduce((sum, m) => sum + m.pct, 0);
}
