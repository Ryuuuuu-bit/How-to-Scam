import type { GameContent, GangLevel, ScamMethod } from '../types/content';
import type { GameState } from '../types/state';
import { clampHeat, HEAT_MAX, modifierPct } from './effects';
import { invariant } from './errors';
import { rollDailyEvents } from './events';
import { dealLaunderOffer } from './launder';
import { getCharacter, getMethod, getPitch, getShopItem, getVictim } from './lookup';
import type { Rng } from './rng';

/** จ่ายเงิน: ใช้เงินสกปรกก่อน ไม่พอค่อยใช้เงินสะอาด */
export function spend(s: GameState, amount: number): void {
  invariant(s.dirtyCash + s.cleanCash >= amount, `not enough money for ${amount}`);
  const fromDirty = Math.min(s.dirtyCash, amount);
  s.dirtyCash -= fromDirty;
  s.cleanCash -= amount - fromDirty;
}

export function unlockedMethods(s: GameState, c: GameContent): ScamMethod[] {
  return c.methods.filter((m) => m.level <= s.gangLevel);
}

export function levelFor(totalLaundered: number, c: GameContent): GangLevel {
  const [l2, l3, l4] = c.config.levelThresholds;
  if (totalLaundered >= l4) return 4;
  if (totalLaundered >= l3) return 3;
  if (totalLaundered >= l2) return 2;
  return 1;
}

export function updateLevel(s: GameState, c: GameContent): void {
  const lvl = levelFor(s.totalLaundered, c);
  if (lvl > s.gangLevel) {
    s.gangLevel = lvl;
    s.lastResults.push({ kind: 'levelUp', textKey: `level${lvl}` });
  }
}

// ---------- 1. เลือกแผน ----------
export function choosePlan(s: GameState, c: GameContent, methodId: string | null): void {
  if (methodId !== null) {
    const m = getMethod(c, methodId);
    invariant(m.level <= s.gangLevel, `method ${methodId} is locked`);
  }
  s.todayMethodId = methodId;
  s.history.push({
    day: s.day,
    methodId,
    income: 0,
    heatGained: 0,
    events: [],
    launderCardId: null,
    launderSuccess: null,
    laundered: 0,
  });
  s.phase = 'invest';
}

// ---------- 2. ลงทุนรายวัน ----------
export function invest(s: GameState, c: GameContent, rng: Rng, itemId: string): void {
  const item = getShopItem(c, itemId);
  invariant(item.kind === 'daily' || item.kind === 'henchman', `${itemId} is not a daily item`);
  invariant(!item.minLevel || s.gangLevel >= item.minLevel, `${itemId} is locked`);
  const owned = s.dailyItems[itemId] ?? 0;
  if (item.kind === 'henchman') {
    invariant(s.henchmen.length < item.maxStack, 'henchman limit reached');
    spend(s, item.price);
    s.henchmen.push({
      id: `h${s.nextHenchmanId++}`,
      skill: rng.int(5, Math.max(5, item.incomePct ?? 15)),
      loyalty: rng.int(30, 80),
      wage: item.wage ?? 0,
    });
    return;
  }
  invariant(owned < item.maxStack, `${itemId} max per day reached`);
  spend(s, item.price);
  s.dailyItems[itemId] = owned + 1;
  if (item.heatNow) {
    s.heat -= item.heatNow;
    clampHeat(s);
  }
}

// ---------- 3. คำนวณผล ----------
function incomeBonusPct(s: GameState, c: GameContent, methodId: string): number {
  const ch = getCharacter(c, s.characterId);
  let pct = ch.bonus.methodId === methodId ? ch.bonus.pct : 0;
  pct += modifierPct(s, 'income', methodId);
  pct += s.henchmen.reduce((sum, h) => sum + h.skill, 0);
  for (const [id, n] of Object.entries(s.dailyItems))
    pct += (getShopItem(c, id).incomePct ?? 0) * n;
  for (const [id, n] of Object.entries(s.upgrades)) pct += (getShopItem(c, id).incomePct ?? 0) * n;
  return pct;
}

function heatBonusPct(s: GameState, c: GameContent, methodId: string): number {
  let pct = modifierPct(s, 'heat', methodId);
  for (const [id, n] of Object.entries(s.dailyItems)) pct += (getShopItem(c, id).heatPct ?? 0) * n;
  for (const [id, n] of Object.entries(s.upgrades)) pct += (getShopItem(c, id).heatPct ?? 0) * n;
  return Math.max(-90, pct);
}

/** กดยืนยันการลงทุน → จ่ายต้นทุน แล้วคำนวณผล หรือเข้ามินิเกมคอลเซ็นเตอร์ */
export function confirmInvest(s: GameState, c: GameContent, rng: Rng): void {
  const methodId = s.todayMethodId;
  if (methodId === null) {
    // วันพัก: Heat ลดเอง
    s.heat -= c.config.heatDecayQuietDay;
    clampHeat(s);
    tickRomanceIdle(s, c);
    afterResolve(s, c, rng);
    return;
  }
  const m = getMethod(c, methodId);
  spend(s, m.cost);
  if (!s.methodsUsed.includes(m.id)) s.methodsUsed.push(m.id);

  if (m.mechanic === 'callCenter') {
    const victim = rng.pick(c.victims);
    const match = rng.pick(c.pitches.filter((p) => p.weakness === victim.weakness));
    const others = rng.sample(
      c.pitches.filter((p) => p.weakness !== victim.weakness),
      2,
    );
    s.call = {
      victimId: victim.id,
      pitchIds: rng.sample([match, ...others], 3).map((p) => p.id),
    };
    s.phase = 'call';
    return;
  }

  let base = rng.range(m.income);
  if (m.mechanic === 'romance') {
    const { bondIncomePct, maxBond } = c.config.romance;
    base = Math.round(base * (1 + (s.romance.bond * bondIncomePct) / 100));
    s.romance.bond = Math.min(maxBond, s.romance.bond + 1);
    s.romance.idleDays = 0;
  } else {
    tickRomanceIdle(s, c);
  }
  applyIncome(s, c, m, base, rng.range(m.heat));
  afterResolve(s, c, rng);
}

/** มินิเกมคอลเซ็นเตอร์: เลือกมุก 1 ใน 3 */
export function callPitch(s: GameState, c: GameContent, rng: Rng, pitchId: string): void {
  invariant(s.call, 'no active call');
  invariant(s.call.pitchIds.includes(pitchId), `pitch ${pitchId} not offered`);
  const victim = getVictim(c, s.call.victimId);
  const pitch = getPitch(c, pitchId);
  const m = getMethod(c, s.todayMethodId ?? '');
  const { matchSuccessPct, missSuccessPct, failHeat } = c.config.callCenter;
  const matched = pitch.weakness === victim.weakness;
  const success = rng.chance(matched ? matchSuccessPct : missSuccessPct);
  const base = success ? Math.round(rng.range(m.income) * victim.wealth) : 0;
  const heat = rng.range(m.heat) + (success ? 0 : failHeat);
  s.lastResults.push({ kind: 'call', textKey: `${victim.id}:${pitch.id}`, success });
  s.call = null;
  tickRomanceIdle(s, c);
  applyIncome(s, c, m, base, heat);
  afterResolve(s, c, rng);
}

function applyIncome(
  s: GameState,
  c: GameContent,
  m: ScamMethod,
  baseIncome: number,
  baseHeat: number,
): void {
  const income = Math.max(0, Math.round(baseIncome * (1 + incomeBonusPct(s, c, m.id) / 100)));
  const heat = Math.max(0, Math.round(baseHeat * (1 + heatBonusPct(s, c, m.id) / 100)));
  const before = s.heat;
  s.dirtyCash += income;
  s.heat += heat;
  clampHeat(s);
  s.fame += m.fame ?? 0;
  s.karma += m.karma;
  const log = s.history.at(-1);
  if (log) {
    log.income = income;
    log.heatGained = s.heat - before;
  }
  s.lastResults.push({ kind: 'resolve', dirtyCash: income, heat: s.heat - before });
}

function tickRomanceIdle(s: GameState, c: GameContent): void {
  if (s.romance.bond <= 0) return;
  s.romance.idleDays++;
  if (s.romance.idleDays >= c.config.romance.fleeAfterIdleDays) {
    s.romance = { bond: 0, idleDays: 0 };
    s.lastResults.push({ kind: 'romanceFled' });
  }
}

/** หลังคำนวณผล: Heat เต็ม → หนี, ไม่งั้นสุ่มเหตุการณ์ */
function afterResolve(s: GameState, c: GameContent, rng: Rng): void {
  if (s.heat >= HEAT_MAX) {
    s.phase = 'escape';
    return;
  }
  rollDailyEvents(s, c, rng);
  if (s.pendingEvents.length > 0) s.phase = 'event';
  else goToLaunder(s, c, rng);
}

/** ไปขั้นฟอกเงิน (ข้ามไปร้านค้าถ้าไม่มีเงินสกปรก) */
export function goToLaunder(s: GameState, c: GameContent, rng: Rng): void {
  if (s.dirtyCash > 0) {
    dealLaunderOffer(s, c, rng);
    s.phase = 'launder';
  } else {
    s.phase = 'shop';
  }
}

// ---------- 6. ร้านค้าอัปเกรดถาวร ----------
export function buy(s: GameState, c: GameContent, itemId: string): void {
  const item = getShopItem(c, itemId);
  invariant(item.kind === 'permanent', `${itemId} is not a permanent upgrade`);
  invariant(!item.minLevel || s.gangLevel >= item.minLevel, `${itemId} is locked`);
  const owned = s.upgrades[itemId] ?? 0;
  invariant(owned < item.maxStack, `${itemId} max reached`);
  spend(s, item.price);
  s.upgrades[itemId] = owned + 1;
  if (item.heatNow) {
    s.heat -= item.heatNow;
    clampHeat(s);
  }
}

/** จบวัน: จ่ายค่าจ้าง ลด modifier ขึ้นวันใหม่ คืน true ถ้าครบจำนวนวัน */
export function endDay(s: GameState, c: GameContent): boolean {
  for (const h of [...s.henchmen]) {
    if (s.dirtyCash + s.cleanCash >= h.wage) {
      spend(s, h.wage);
      if (s.heat > 70) h.loyalty = Math.max(0, h.loyalty - 5);
    } else {
      // จ่ายไม่ไหว ลูกน้องเดินออก
      s.henchmen = s.henchmen.filter((x) => x.id !== h.id);
    }
  }
  s.modifiers = s.modifiers
    .map((m) => ({ ...m, daysLeft: m.daysLeft - 1 }))
    .filter((m) => m.daysLeft > 0);
  s.dailyItems = {};
  s.todayMethodId = null;
  updateLevel(s, c);
  if (s.day >= c.config.maxDays) return true;
  s.day++;
  s.phase = 'plan';
  return false;
}
