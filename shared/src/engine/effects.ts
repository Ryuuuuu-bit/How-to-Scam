import type { Effect, GameContent, ModifierSpec, Stat } from '../types/content';
import type { GameState } from '../types/state';
import { ambientModifiers } from './calendar';
import { karmaDelta } from './perks';
import type { Rng } from './rng';
import { activeReturn } from './comeback';
import { addEvidence } from './soi';

export const HEAT_MAX = 100;

export function clampHeat(s: GameState): void {
  s.heat = Math.max(0, Math.min(HEAT_MAX, Math.round(s.heat)));
}

function setStat(s: GameState, stat: Stat, value: number): void {
  s[stat] = Math.round(value);
  if (stat === 'dirtyCash' || stat === 'cleanCash') s[stat] = Math.max(0, s[stat]);
  if (stat === 'heat') clampHeat(s);
}

export function methodStateOf(s: GameState, methodId: string) {
  s.methodState[methodId] ??= { streak: 0, exposure: 0, cooldownUntil: 0 };
  return s.methodState[methodId];
}

export function addHenchman(s: GameState, rng: Rng, wage: number, maxSkill = 15, loyalty?: number) {
  s.henchmen.push({
    id: `h${s.nextHenchmanId++}`,
    skill: rng.int(5, Math.max(5, maxSkill)),
    loyalty: loyalty ?? rng.int(30, 80),
    wage,
  });
}

/** ใช้ effect กับ state (mutate draft) */
export function applyEffect(s: GameState, c: GameContent, e: Effect, rng: Rng): void {
  switch (e.kind) {
    case 'add': {
      let v = typeof e.value === 'number' ? e.value : rng.range(e.value);
      if (e.stat === 'karma') v = karmaDelta(s, c, v);
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
    case 'gainHenchman':
      addHenchman(s, rng, 300, 15, e.loyalty);
      return;
    case 'loyalty':
      for (const h of s.henchmen) h.loyalty = Math.max(0, Math.min(100, h.loyalty + e.value));
      return;
    case 'romanceBond':
      s.romance.bond = Math.max(0, s.romance.bond + e.value);
      return;
    case 'schedule':
      s.scheduled.push({ eventId: e.eventId, day: s.day + e.inDays });
      return;
    case 'cooldown': {
      const ms = methodStateOf(s, e.methodId);
      ms.cooldownUntil = Math.max(ms.cooldownUntil, s.day + e.days);
      return;
    }
    case 'evidence':
      addEvidence(s, e.evidence, e.weight);
      return;
    case 'jobModifier': {
      const r = activeReturn(s);
      if (r) s.modifiers.push({ target: 'income', methodId: r.methodId, pct: e.pct, daysLeft: e.days });
      return;
    }
    case 'refund': {
      const r = activeReturn(s);
      if (!r) return;
      const due = Math.min(s.dirtyCash + s.cleanCash, Math.round((r.take * e.pct) / 100));
      const fromDirty = Math.min(s.dirtyCash, due);
      s.dirtyCash -= fromDirty;
      s.cleanCash -= due - fromDirty;
      return;
    }
  }
}

export function applyEffects(
  s: GameState,
  c: GameContent,
  effects: readonly Effect[],
  rng: Rng,
): void {
  for (const e of effects) applyEffect(s, c, e, rng);
}

const matches = (m: ModifierSpec, target: 'income' | 'heat', methodId: string | null) =>
  m.target === target && (!m.methodId || m.methodId === methodId);

/** รวม % ของ modifier (จาก effect + เทศกาล + ข่าว) ที่ใช้ได้กับ target/method นี้ */
export function modifierPct(
  s: GameState,
  c: GameContent,
  target: 'income' | 'heat',
  methodId: string | null,
): number {
  return [...s.modifiers, ...ambientModifiers(s, c)]
    .filter((m) => matches(m, target, methodId))
    .reduce((sum, m) => sum + m.pct, 0);
}
