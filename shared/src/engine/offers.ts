import type { DailyOffer, GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { applyEffects } from './effects';
import { invariant } from './errors';
import { conditionMet } from './events';
import type { Rng } from './rng';

export function currentOffer(s: GameState, c: GameContent): DailyOffer | undefined {
  return s.offer ? c.offers.find((o) => o.id === s.offer?.id) : undefined;
}

/** สุ่มข้อเสนอของวันนี้ (มีภารกิจค้างอยู่ จะไม่สุ่มภารกิจใหม่) */
export function rollOffer(s: GameState, c: GameContent, rng: Rng): void {
  const pool = c.offers.filter(
    (o) => !(o.kind === 'mission' && s.mission) && (!o.when || conditionMet(s, c, o.when)),
  );
  const o = pool[rng.weightedIndex(pool.map((x) => x.weight))];
  s.offer = o ? { id: o.id, accepted: o.kind === 'twist' } : null;
}

/** ส่วนลด % ของไอเท็มนี้วันนี้ */
export function offerDiscountPct(s: GameState, c: GameContent, itemId: string): number {
  const o = currentOffer(s, c);
  return o?.kind === 'twist' && o.discount?.itemIds.includes(itemId) ? o.discount.pct : 0;
}

export function offerBans(s: GameState, c: GameContent, itemId: string): boolean {
  const o = currentOffer(s, c);
  return o?.kind === 'twist' && (o.ban?.includes(itemId) ?? false);
}

/** รับดีลหรือภารกิจของวันนี้ */
export function acceptOffer(
  s: GameState,
  c: GameContent,
  rng: Rng,
  spend: (s: GameState, n: number) => void,
): void {
  const o = currentOffer(s, c);
  invariant(o && s.offer && !s.offer.accepted, 'no offer to accept');
  invariant(o.kind !== 'twist', 'twist cannot be accepted');
  if (o.kind === 'deal') {
    spend(s, o.price ?? 0);
    applyEffects(s, c, o.effects ?? [], rng);
  } else {
    invariant(!s.mission, 'mission already active');
    s.mission = { offerId: o.id, progress: 0 };
  }
  s.offer.accepted = true;
  s.lastResults.push({ kind: 'offer', textKey: o.id });
}

/** นับภารกิจตอนเริ่มงานของวัน: ทำตรงก็นับต่อ ไม่ตรงก็ล้มเหลว */
export function tickMission(s: GameState, c: GameContent, rng: Rng, methodId: string | null): void {
  if (!s.mission) return;
  const o = c.offers.find((x) => x.id === s.mission?.offerId);
  if (!o?.mission) {
    s.mission = null;
    return;
  }
  if (o.mission.methodId !== methodId) {
    s.lastResults.push({ kind: 'missionFail', textKey: o.id });
    s.mission = null;
    return;
  }
  s.mission.progress++;
  if (s.mission.progress >= o.mission.days) {
    applyEffects(s, c, o.mission.reward, rng);
    s.lastResults.push({ kind: 'missionDone', textKey: o.id });
    s.mission = null;
  }
}
