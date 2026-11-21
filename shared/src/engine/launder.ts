import type { GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { currentNews } from './calendar';
import { clampHeat } from './effects';
import { invariant } from './errors';
import { getCard } from './lookup';
import { karmaDelta, perksOfKind } from './perks';
import type { Rng } from './rng';

export function launderOfferSize(s: GameState, c: GameContent): number {
  const extra = perksOfKind(s, c, 'launderOffer').reduce((n, p) => n + p.extra, 0);
  return c.config.launderOfferSize + extra;
}

export function dealLaunderOffer(s: GameState, c: GameContent, rng: Rng): void {
  s.launderOffer = rng.sample(
    c.launderCards.map((x) => x.id),
    launderOfferSize(s, c),
  );
}

/** โอกาสสำเร็จจริงของการ์ดใบนี้ (รวมอาชีพและข่าว) */
export function launderSuccessPct(s: GameState, c: GameContent, cardId: string): number {
  const card = getCard(c, cardId);
  const bonus =
    perksOfKind(s, c, 'launderSuccess').reduce((n, p) => n + p.pct, 0) +
    (currentNews(s, c)?.launderSuccessPct ?? 0);
  return Math.max(5, Math.min(95, card.successPct + bonus));
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

  const success = rng.chance(launderSuccessPct(s, c, cardId));
  s.dirtyCash -= amount;
  if (success) {
    const clean = Math.round(amount * (1 - card.lossPct / 100));
    s.cleanCash += clean;
    s.totalLaundered += clean;
    s.heat += card.heat;
  } else {
    // ส่วนที่ไม่หายกลับมาเป็นเงินสกปรก
    s.dirtyCash += Math.round(amount * (1 - card.failLossPct / 100));
    const mul = perksOfKind(s, c, 'launderFailHeat').reduce((m, p) => m * p.mul, 2);
    s.heat += card.heat * mul;
  }
  s.karma += karmaDelta(s, c, card.karma ?? 0);
  clampHeat(s);
  s.launderOffer = [];
  if (log) {
    log.launderCardId = cardId;
    log.launderSuccess = success;
    log.laundered = success ? amount : 0;
  }
  s.lastResults.push({ kind: 'launder', textKey: card.id, success });
}
