import type { ChoiceRequirement, EventCondition, GameContent, GameEvent } from '../types/content';
import type { GameState } from '../types/state';
import { activeFestivals, dateOf } from './calendar';
import { applyEffects } from './effects';
import { invariant } from './errors';
import { getEvent } from './lookup';
import { perksOfKind } from './perks';
import type { Rng } from './rng';
import { careerSeedPrefix, sketchSeedPrefix } from './opening';

const inRange = (v: number, r?: readonly [number, number]) => !r || (v >= r[0] && v <= r[1]);

export function isEventEligible(s: GameState, c: GameContent, ev: GameEvent): boolean {
  if (ev.chainOnly) return false;
  if (ev.id === 'counter_live' && !s.seed.startsWith('v3:soi:live:')) return false;
  if (ev.id === 'cf_orange_cat' && s.seed.startsWith('v3:soi:live:')) return false;
  if ((ev.once ?? true) && s.seenEvents.includes(ev.id)) return false;
  if (s.pendingEvents.includes(ev.id)) return false;
  return conditionMet(s, c, ev.when);
}

export function conditionMet(s: GameState, c: GameContent, w: EventCondition): boolean {
  if (w.sketchEdition && !s.seed.startsWith(sketchSeedPrefix)) return false;
  if (w.careerEdition && !s.seed.startsWith(careerSeedPrefix)) return false;
  if (w.neighborhoodEdition && !s.seed.startsWith('v3:soi:')) return false;
  if (w.recruit && !s.henchmen.some((h) => h.recruit === w.recruit)) return false;
  if (w.methods && (!s.todayMethodId || !w.methods.includes(s.todayMethodId))) return false;
  if (w.usedMethods && !w.usedMethods.some((m) => s.methodsUsed.includes(m))) return false;
  if (!inRange(s.heat, w.heat)) return false;
  if (!inRange(s.day, w.day)) return false;
  if (!inRange(s.karma, w.karma)) return false;
  if (w.minFame !== undefined && s.fame < w.minFame) return false;
  if (w.minLevel && s.gangLevel < w.minLevel) return false;
  if (w.flagsAll && !w.flagsAll.every((f) => s.flags.includes(f))) return false;
  if (w.flagsNone && w.flagsNone.some((f) => s.flags.includes(f))) return false;
  if (w.needsHenchman && s.henchmen.length === 0) return false;
  if (w.minDirtyCash !== undefined && s.dirtyCash < w.minDirtyCash) return false;
  if (w.characters && !w.characters.includes(s.characterId)) return false;
  if (w.minWorkStreak !== undefined && s.workStreak < w.minWorkStreak) return false;
  if (w.months || w.dates) {
    const { month, date } = dateOf(s, s.day);
    if (w.months && !w.months.includes(month)) return false;
    if (w.dates && !w.dates.includes(date)) return false;
  }
  if (w.festivals) {
    const active = activeFestivals(s, c).map((f) => f.id);
    if (!w.festivals.some((f) => active.includes(f))) return false;
  }
  return true;
}

/** ทางเลือกพิเศษ: เช็กว่าผู้เล่นคนนี้เลือกได้ไหม (UI ใช้ซ่อนปุ่ม) */
export function choiceAvailable(s: GameState, req?: ChoiceRequirement): boolean {
  if (!req) return true;
  if (req.characters && !req.characters.includes(s.characterId)) return false;
  if (req.upgrades && !req.upgrades.some((u) => (s.upgrades[u] ?? 0) > 0)) return false;
  if (req.minFame !== undefined && s.fame < req.minFame) return false;
  if (req.minDirtyCash !== undefined && s.dirtyCash < req.minDirtyCash) return false;
  if (req.minHenchmen !== undefined && s.henchmen.length < req.minHenchmen) return false;
  if (req.flags && !req.flags.every((f) => s.flags.includes(f))) return false;
  return true;
}

function weightOf(s: GameState, c: GameContent, ev: GameEvent): number {
  return perksOfKind(s, c, 'eventWeight')
    .filter((p) => p.eventIds.includes(ev.id))
    .reduce((w, p) => w * p.mul, ev.weight);
}

/** เหตุการณ์ของวันนี้: ตอนต่อที่ถูกนัดไว้ก่อน แล้วค่อยสุ่มเพิ่ม (รวมไม่เกิน 2) */
export function rollDailyEvents(s: GameState, c: GameContent, rng: Rng): void {
  const due = s.scheduled.filter((x) => x.day <= s.day);
  s.scheduled = s.scheduled.filter((x) => x.day > s.day);
  for (const x of due) {
    s.pendingEvents.push(x.eventId);
    s.seenEvents.push(x.eventId);
  }
  if (s.seed.startsWith('v3:soi:live:') && s.todayMethodId === 'fake_shop' &&
      s.pendingEvents.length < 2 && !s.seenEvents.includes('counter_live')) {
    s.pendingEvents.push('counter_live');
    s.seenEvents.push('counter_live');
  }
  const count = Math.max(0, rng.weightedIndex(c.config.eventCountWeights) - s.pendingEvents.length);
  for (let i = 0; i < count; i++) {
    const pool = c.events.filter((ev) => isEventEligible(s, c, ev));
    if (pool.length === 0) break;
    const idx = rng.weightedIndex(pool.map((ev) => weightOf(s, c, ev)));
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
  invariant(choiceAvailable(s, choice.requires), `choice ${choiceIdx} not available`);
  if (choice.requires) s.stats.specialChoices++;
  const oi = rng.weightedIndex(choice.outcomes.map((o) => o.weight ?? 1));
  const outcome = choice.outcomes[oi];
  invariant(outcome, `event ${ev.id} choice ${choiceIdx} has no outcomes`);
  const before = { dirty: s.dirtyCash, clean: s.cleanCash, heat: s.heat };
  applyEffects(s, c, outcome.effects, rng);
  s.pendingEvents.shift();
  s.history.at(-1)?.events.push(ev.id);
  const log = s.history.at(-1);
  if (log && choice.interview) log.interview = choice.interview;
  if (log && choice.liveCat) log.liveCat = choice.liveCat;
  s.lastResults.push({
    kind: 'event',
    textKey: `${ev.id}:${choiceIdx}:${oi}`,
    dirtyCash: s.dirtyCash - before.dirty,
    cleanCash: s.cleanCash - before.clean,
    heat: s.heat - before.heat,
  });
}
