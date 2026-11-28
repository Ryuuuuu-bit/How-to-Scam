import type { GameContent, LaunderCard } from '../types/content';
import type { GameState } from '../types/state';
import { activeFestivals, currentNews } from './calendar';
import { campaignDays } from './campaign';
import { clampHeat } from './effects';
import { invariant } from './errors';
import { getCard } from './lookup';
import { karmaDelta, perksOfKind } from './perks';
import type { Rng } from './rng';
import { isAlly } from './soi';

/** seed รุ่น 1.3 (':v1:risk1:back1:wash1:'): การ์ดฟอกเงินชุด 2 และวิธีแจกการ์ดใหม่ */
export const washMarker = 'v1:risk1:back1:wash1:';
export function washRules(seed: string): boolean {
  const days = campaignDays(seed);
  return days !== undefined && seed.includes(`campaign1:${days}:${washMarker}`);
}

export function launderOfferSize(s: GameState, c: GameContent): number {
  const extra = perksOfKind(s, c, 'launderOffer').reduce((n, p) => n + p.extra, 0);
  return c.config.launderOfferSize + extra;
}

/** การ์ดที่โผล่ได้ในรอบนี้วันนี้ */
export function washPool(s: GameState, c: GameContent): LaunderCard[] {
  const festival = activeFestivals(s, c).length > 0;
  return c.launderCards.filter(
    (x) => (!x.minLevel || s.gangLevel >= x.minLevel) && (!x.festival || festival),
  );
}

type Role = 'safe' | 'big' | 'special';
/** บทบาทของการ์ด: ใบปลอดภัย / ใบฟอกก้อนใหญ่หรือค่าฟอกถูก / ใบวิธีเล่นพิเศษ */
export function roleOf(x: LaunderCard): Role {
  if (x.style || x.festival || x.ally) return 'special';
  if (x.successPct >= 72) return 'safe';
  return 'big';
}

export function dealLaunderOffer(s: GameState, c: GameContent, rng: Rng): void {
  const size = launderOfferSize(s, c);
  if (!washRules(s.seed)) {
    // กติกาเดิม: สุ่มจากการ์ดชุดแรกเท่านั้น (รอบเก่า replay ได้ผลเดิม)
    s.launderOffer = rng.sample(
      c.launderCards.filter((x) => !x.edition).map((x) => x.id),
      size,
    );
    return;
  }
  // ชุด 2: ใบปลอดภัย 1 + ใบก้อนใหญ่ 1 + ใบพิเศษ 1 ไม่ซ้ำกับที่โผล่เมื่อวาน
  const yesterday = new Set(s.lastWashOffer ?? []);
  const pool = washPool(s, c);
  const fresh = pool.filter((x) => !yesterday.has(x.id));
  const picked: string[] = [];
  const take = (cands: LaunderCard[]) => {
    const left = cands.filter((x) => !picked.includes(x.id));
    if (left.length) picked.push(rng.pick(left).id);
  };
  for (const role of ['safe', 'big', 'special'] as const) {
    const byRole = fresh.filter((x) => roleOf(x) === role);
    take(byRole.length ? byRole : pool.filter((x) => roleOf(x) === role));
  }
  while (picked.length < size) {
    const before = picked.length;
    take(fresh.length > picked.length ? fresh : pool);
    if (picked.length === before) break;
  }
  // สลับลำดับไม่ให้ใบปลอดภัยอยู่บนสุดทุกวัน
  s.launderOffer = rng.sample(picked, picked.length).slice(0, Math.max(size, 0));
  s.lastWashOffer = [...s.launderOffer];
}

/** โบนัสดวงชดเชยต่อการฟอกพังติดกันหนึ่งครั้ง */
export const LAUNDER_PITY_PER_FAIL = 15;

/**
 * ดวงชดเชย: ฟอกพังติดกันกี่ครั้ง ครั้งถัดไปได้ +15% ต่อครั้ง (รีเซ็ตเมื่อสำเร็จ)
 * กันไม่ให้การ์ด 80% พังติดกันสามสี่ครั้งจนรู้สึกว่าตัวเลขโกหก
 */
export function launderPityPct(s: GameState): number {
  return (s.launderFailStreak ?? 0) * LAUNDER_PITY_PER_FAIL;
}

/** การ์ดใบนี้ได้โบนัสเส้นสายในซอยไหม */
export const allyHelps = (s: GameState, card: LaunderCard): boolean =>
  !!card.ally && isAlly(s, card.ally);

/** โอกาสสำเร็จจริงของการ์ดใบนี้ (รวมอาชีพ ข่าว เส้นสาย และดวงชดเชย) — ตัวเลขเดียวกับที่ใช้ทอยจริง */
export function launderSuccessPct(s: GameState, c: GameContent, cardId: string): number {
  const card = getCard(c, cardId);
  if (card.style === 'legit') return 100;
  const bonus =
    perksOfKind(s, c, 'launderSuccess').reduce((n, p) => n + p.pct, 0) +
    (currentNews(s, c)?.launderSuccessPct ?? 0) +
    (allyHelps(s, card) ? c.config.launderAllyBonus : 0) +
    launderPityPct(s);
  return Math.max(5, Math.min(95, card.successPct + bonus));
}

/** ผลที่จะได้ถ้าผ่าน/พัง (ให้ UI แสดงก่อนเลือก) */
export function launderPreview(s: GameState, c: GameContent, cardId: string) {
  const card = getCard(c, cardId);
  const amount = Math.min(s.dirtyCash, card.capacity);
  const clean = Math.round(amount * (1 - card.lossPct / 100));
  const lost = Math.round(amount * (card.failLossPct / 100));
  return {
    amount,
    clean,
    lost,
    perDay: card.style === 'drip' ? Math.round(clean / (card.dripDays ?? 1)) : clean,
  };
}

/** เงินสะอาดที่ยังทยอยเข้าไม่ครบ */
export const washPending = (s: GameState): number =>
  (s.washQueue ?? []).reduce((n, x) => n + x.amount, 0);

/** ปล่อยเงินทยอยเข้าที่ถึงวัน (all = ปล่อยทั้งหมดตอนจบรอบ) */
export function releaseWash(s: GameState, all = false): void {
  if (!s.washQueue?.length) return;
  const due = s.washQueue.filter((x) => all || x.day <= s.day);
  if (!due.length) return;
  s.washQueue = s.washQueue.filter((x) => !due.includes(x));
  const total = due.reduce((n, x) => n + x.amount, 0);
  s.cleanCash += total;
  s.totalLaundered += total;
  s.flowNote = { ...s.flowNote, launder: (s.flowNote?.launder ?? 0) + total };
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

  // ทางสุจริตผ่านแน่ ไม่ทอย (ไม่ใช้ RNG)
  const success = card.style === 'legit' ? true : rng.chance(launderSuccessPct(s, c, cardId));
  s.dirtyCash -= amount;
  if (success) {
    const clean = Math.round(amount * (1 - card.lossPct / 100));
    if (card.style === 'drip') {
      // ทยอยเข้าวันละงวดตั้งแต่พรุ่งนี้ งวดสุดท้ายเก็บเศษ
      const days = Math.max(1, card.dripDays ?? 1);
      const per = Math.floor(clean / days);
      s.washQueue = [
        ...(s.washQueue ?? []),
        ...Array.from({ length: days }, (_, i) => ({
          day: s.day + 1 + i,
          amount: i === days - 1 ? clean - per * (days - 1) : per,
          cardId: card.id,
        })),
      ];
    } else {
      s.cleanCash += clean;
      s.totalLaundered += clean;
    }
    s.stats.launderOk++;
    s.launderFailStreak = 0;
    s.heat += card.heat;
  } else {
    s.launderFailStreak = (s.launderFailStreak ?? 0) + 1;
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
