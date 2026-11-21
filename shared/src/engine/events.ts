import type { EventCondition, GameContent, GameEvent } from '../types/content';
import type { GameState } from '../types/state';
import { applyEffects } from './effects';
import { invariant } from './errors';
import { getEvent } from './lookup';
import type { Rng } from './rng';

const inRange = (v: number, r?: readonly [number, number]) => !r || (v >= r[0] && v <= r[1]);

export function isEventEligible(s: GameState, ev: GameEvent): boolean {
  if ((ev.once ?? true) && s.seenEvents.includes(ev.id)) return false;
  if (s.pendingEvents.includes(ev.id)) return false;
  return conditionMet(s, ev.when);
}

export function conditionMet(s: GameState, w: EventCondition): boolean {
  if (w.methods && (!s.todayMethodId || !w.methods.includes(s.todayMethodId))) return false;
  if (!inRange(s.heat, w.heat)) return false;
  if (!inRange(s.day, w.day)) return false;
  if (w.minLevel && s.gangLevel < w.minLevel) return false;
  if (w.flagsAll && !w.flagsAll.every((f) => s.flags.includes(f))) return false;
  if (w.flagsNone && w.flagsNone.some((f) => s.flags.includes(f))) return false;
  if (w.needsHenchman && s.henchmen.length === 0) return false;
  if (w.minDirtyCash !== undefined && s.dirtyCash < w.minDirtyCash) return false;
  return true;
}

/** สุ่มเหตุการณ์ 0–2 อย่างของวันนี้ ใส่ไว้ใน pendingEvents */
export function rollDailyEvents(s: GameState, c: GameContent, rng: Rng): void {
  const count = rng.weightedIndex(c.config.eventCountWeights);
  for (let i = 0; i < count; i++) {
    const pool = c.events.filter((ev) => isEventEligible(s, ev));
    if (pool.length === 0) break;
    const idx = rng.weightedIndex(pool.map((ev) => ev.weight));
    const ev = pool[idx];
    if (!ev) break;
    s.pendingEvents.push(ev.id);
    s.seenEvents.push(ev.id);
  }
}

/** ผู้เล่นเลือกทางรับมือเหตุการณ์แรกในคิว */
export function resolveEventChoice(
  s: GameState,
  c: GameContent,
  rng: Rng,
  choiceIdx: number,
): void {
  const eventId = s.pendingEvents[0];
  invariant(eventId, 'no pending event');
  const ev = getEvent(c, eventId);
  const choice = ev.choices[choiceIdx];
  invariant(choice, `invalid choice ${choiceIdx} for event ${ev.id}`);
  const oi = rng.weightedIndex(choice.outcomes.map((o) => o.weight ?? 1));
  const outcome = choice.outcomes[oi];
  invariant(outcome, `event ${ev.id} choice ${choiceIdx} has no outcomes`);
  const before = { dirty: s.dirtyCash, clean: s.cleanCash, heat: s.heat };
  applyEffects(s, outcome.effects, rng);
  s.pendingEvents.shift();
  s.history.at(-1)?.events.push(ev.id);
  s.lastResults.push({
    kind: 'event',
    textKey: `${ev.id}:${choiceIdx}:${oi}`,
    dirtyCash: s.dirtyCash - before.dirty,
    cleanCash: s.cleanCash - before.clean,
    heat: s.heat - before.heat,
  });
}
