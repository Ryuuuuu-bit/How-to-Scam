import type { Disguise, EscapeRoute, GameContent } from '../types/content';
import type { EscapeState, GameState } from '../types/state';
import { goToLaunder, spend } from './day';
import { invariant } from './errors';
import { karmaDelta } from './perks';
import { hashSeed, Rng } from './rng';

const dreamSymbols = [0, 1, 2] as const;
type DreamSymbol = (typeof dreamSymbols)[number];
export function dreamSequence(s: GameState): [DreamSymbol, DreamSymbol, DreamSymbol] {
  const rng = new Rng(hashSeed(s.seed + ':dream:' + s.day + ':' + s.escapes));
  return [rng.pick(dreamSymbols), rng.pick(dreamSymbols), rng.pick(dreamSymbols)];
}

/**
 * โหมดหนีตำรวจ (มุกล้วนๆ ไม่ใช่วิธีหนีจริง):
 * ปลอมตัว → เลือกที่หนี → เหตุการณ์ระหว่างทาง → จ่ายส่วย (หรือไม่) → QTE แตะหน้าจอ → ทอยผล
 */

export function escapeOf(s: GameState): EscapeState {
  return s.escape ?? { step: 'disguise', bonus: 0 };
}

function disguiseOf(c: GameContent, id: string | undefined): Disguise | undefined {
  return c.disguises.find((d) => d.id === id);
}

function routeOf(c: GameContent, id: string | undefined): EscapeRoute | undefined {
  return c.routes.find((r) => r.id === id);
}

function expectStep(e: EscapeState, step: EscapeState['step']): void {
  invariant(e.step === step, `escape step is "${e.step}", not "${step}"`);
}

const money = (s: GameState) => s.dirtyCash + s.cleanCash;

/** ค่าส่วย: % ของเงินทั้งหมด แต่ไม่ต่ำกว่าขั้นต่ำ */
export function bribeCost(s: GameState, c: GameContent): number {
  const { bribePct, bribeMin } = c.config.escape;
  return Math.max(bribeMin, Math.round((money(s) * bribePct) / 100));
}

/** โอกาสรอด (%) ถ้า QTE ได้ hits ครั้ง — UI ใช้โชว์ตัวเลข */
export function escapeChance(s: GameState, c: GameContent, hits = 0): number {
  const e = escapeOf(s);
  const route = routeOf(c, e.routeId);
  const cfg = c.config.escape;
  const h = Math.max(0, Math.min(cfg.qteTargets, Math.floor(hits)));
  const raw =
    (route?.baseChance ?? 0) + e.bonus + h * cfg.qtePerHit - s.escapes * cfg.repeatPenalty;
  return Math.max(5, Math.min(95, Math.round(raw)));
}

export function escapeDisguise(s: GameState, c: GameContent, id: string): void {
  const e = escapeOf(s);
  expectStep(e, 'disguise');
  const d = disguiseOf(c, id);
  invariant(d, `unknown disguise ${id}`);
  spend(s, d.cost);
  s.escape = { ...e, step: 'route', disguiseId: d.id, bonus: e.bonus + d.bonus };
}

export function escapeRoute(s: GameState, c: GameContent, rng: Rng, id: string): void {
  const e = escapeOf(s);
  expectStep(e, 'route');
  const r = routeOf(c, id);
  invariant(r, `unknown route ${id}`);
  spend(s, r.cost);
  const d = disguiseOf(c, e.disguiseId);
  const match = d?.goodFor.includes(r.id) ? d.goodBonus : 0;
  const ev = rng.pick(r.events);
  s.escape = { ...e, step: 'event', routeId: r.id, eventId: ev.id, bonus: e.bonus + match };
}

export function escapeEvent(s: GameState, c: GameContent, choiceIdx: number): void {
  const e = escapeOf(s);
  expectStep(e, 'event');
  const ev = routeOf(c, e.routeId)?.events.find((x) => x.id === e.eventId);
  invariant(ev, 'escape event missing');
  const ch = ev.choices[choiceIdx];
  invariant(ch, `bad escape choice ${choiceIdx}`);
  if (ch.cost) spend(s, ch.cost);
  if (ch.karma) s.karma += karmaDelta(s, c, ch.karma);
  s.escape = { ...e, step: 'bribe', eventChoice: choiceIdx, bonus: e.bonus + ch.chance };
}

export function escapeBribe(s: GameState, c: GameContent, rng: Rng, pay: boolean): void {
  const e = escapeOf(s);
  expectStep(e, 'bribe');
  const cfg = c.config.escape;
  if (!pay) {
    s.escape = { ...e, step: 'qte', bribe: 'none' };
    return;
  }
  spend(s, bribeCost(s, c));
  // จ่ายถูกคน = ได้ทางสะดวก / จ่ายผิดคน (เช่นนักข่าว) = ข่าวลือแพร่ + บาปเพิ่ม
  const good = rng.chance(cfg.bribeTrustPct);
  s.karma += karmaDelta(s, c, -2);
  s.escape = {
    ...e,
    step: 'qte',
    bribe: good ? 'good' : 'bad',
    bonus: e.bonus + (good ? cfg.bribeGood : cfg.bribeBad),
  };
}

/** ขั้นสุดท้าย: ทอยผล คืน true ถ้าโดนจับ */
export function escapeQte(s: GameState, c: GameContent, rng: Rng, hits: number): boolean {
  const e = escapeOf(s);
  expectStep(e, 'qte');
  const route = routeOf(c, e.routeId);
  invariant(route, 'escape route missing');
  const success = rng.chance(escapeChance(s, c, hits));
  s.lastResults.push({ kind: 'escape', success, textKey: route.id });
  s.escape = null;
  if (!success) return true;
  s.escapes++;
  s.heat = route.heatAfter;
  s.pendingEvents = [];
  // กบดาน: ข้ามวัน (ไม่มีรายได้) แต่ไม่เกินวันสุดท้าย
  s.day = Math.min(s.maxDays, s.day + route.hideDays);
  goToLaunder(s, c, rng);
  return false;
}

/** มอบตัว (ทำได้ทุกขั้นของโหมดหนี): จบรอบแบบโดนจับ แต่เก็บเงินได้มากกว่าและได้กรรมดี */
export function escapeSurrender(s: GameState, c: GameContent): void {
  if (!s.flags.includes('surrendered')) s.flags.push('surrendered');
  s.karma += c.config.escape.surrenderKarma;
}

/** โดนจับ: เงินสกปรกถูกยึดหมด เงินสะอาดเหลือตาม config (50%, มอบตัว 80%) */
export function applyCaught(s: GameState, c: GameContent): void {
  s.escape = null;
  s.dirtyCash = 0;
  const keep = s.flags.includes('surrendered')
    ? c.config.escape.surrenderKeepPct
    : c.config.caughtCleanKeepPct;
  s.cleanCash = Math.round((s.cleanCash * keep) / 100);
}
