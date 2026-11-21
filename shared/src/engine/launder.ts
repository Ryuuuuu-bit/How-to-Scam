import type { GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { clampHeat } from './effects';
import { invariant } from './errors';
import { getCard } from './lookup';
import type { Rng } from './rng';

export function dealLaunderOffer(s: GameState, c: GameContent, rng: Rng): void {
  s.launderOffer = rng.sample(
    c.launderCards.map((x) => x.id),
    c.config.launderOfferSize,
  );
}

/** ฟอกเงินด้วยการ์ดที่เลือก หรือ null = ข้าม (ถือเงินสกปรกเสี่ยงต่อ) */
export function launder(s: GameState, c: GameContent, rng: Rng, cardId: string | null): void {
  const log = s.history.at(-1);
  if (cardId === null) {
    s.launderOffer = [];
    return;
  }
  invariant(s.launderOffer.includes(cardId), `card ${cardId} not in today's offer`);
  const card = getCard(c, cardId);
  const amount = Math.min(s.dirtyCash, card.capacity);
  invariant(amount > 0, 'nothing to launder');

  const success = rng.chance(card.successPct);
  s.dirtyCash -= amount;
  if (success) {
    const clean = Math.round(amount * (1 - card.lossPct / 100));
    s.cleanCash += clean;
    s.totalLaundered += clean;
    s.heat += card.heat;
  } else {
    // ส่วนที่ไม่หายกลับมาเป็นเงินสกปรก
    s.dirtyCash += Math.round(amount * (1 - card.failLossPct / 100));
    s.heat += card.heat * 2;
  }
  s.karma += card.karma ?? 0;
  clampHeat(s);
  s.launderOffer = [];
  if (log) {
    log.launderCardId = cardId;
    log.launderSuccess = success;
    log.laundered = success ? amount : 0;
  }
  s.lastResults.push({ kind: 'launder', textKey: card.id, success });
}
