import type { GameContent, GangLevel, ScamMethod } from '../types/content';
import type { CallVictim, GameState } from '../types/state';
import { activeFestivals, currentNews } from './calendar';
import { addHenchman, clampHeat, HEAT_MAX, methodStateOf, modifierPct } from './effects';
import { invariant } from './errors';
import { rollDailyEvents } from './events';
import { dealLaunderOffer } from './launder';
import { getMethod, getPitch, getShopItem } from './lookup';
import { karmaDelta, perksOfKind, priceOf } from './perks';
import type { Rng } from './rng';

/** จ่ายเงิน: ใช้เงินสกปรกก่อน ไม่พอค่อยใช้เงินสะอาด */
export function spend(s: GameState, amount: number): void {
  invariant(s.dirtyCash + s.cleanCash >= amount, `not enough money for ${amount}`);
  const fromDirty = Math.min(s.dirtyCash, amount);
  s.dirtyCash -= fromDirty;
  s.cleanCash -= amount - fromDirty;
}

/** เหตุผลที่ใช้วิธีนี้วันนี้ไม่ได้ (null = ใช้ได้) */
export function methodBlock(
  s: GameState,
  c: GameContent,
  m: ScamMethod,
): 'level' | 'banned' | 'cooldown' | null {
  if (m.level > s.gangLevel) return 'level';
  if (perksOfKind(s, c, 'bannedMethod').some((p) => p.methodId === m.id)) return 'banned';
  if ((s.methodState[m.id]?.cooldownUntil ?? 0) >= s.day) return 'cooldown';
  return null;
}

export function unlockedMethods(s: GameState, c: GameContent): ScamMethod[] {
  return c.methods.filter((m) => methodBlock(s, c, m) === null);
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

/** โอกาสแชร์ลูกโซ่ล่มวันนี้ (UI แสดงให้เห็น) */
export function ponziCrashPct(s: GameState, c: GameContent): number {
  const { baseCrashPct, crashPctPerDay } = c.config.ponzi;
  const mul = perksOfKind(s, c, 'ponziRisk').reduce((x, p) => x * p.mul, 1);
  const streak = s.methodState['ponzi']?.streak ?? 0;
  return Math.min(90, Math.round((baseCrashPct + crashPctPerDay * streak) * mul));
}

// ---------- 1. เลือกแผน ----------
export function choosePlan(s: GameState, c: GameContent, methodId: string | null): void {
  if (methodId !== null) {
    const block = methodBlock(s, c, getMethod(c, methodId));
    invariant(block === null, `method ${methodId} unavailable (${block})`);
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
  const price = priceOf(s, c, item.id, item.price);
  if (item.kind === 'henchman') {
    invariant(s.henchmen.length < item.maxStack, 'henchman limit reached');
    spend(s, price);
    addHenchman(s, rng, item.wage ?? 0, item.incomePct ?? 15);
    return;
  }
  const owned = s.dailyItems[itemId] ?? 0;
  invariant(owned < item.maxStack, `${itemId} max per day reached`);
  spend(s, price);
  s.dailyItems[itemId] = owned + 1;
  if (item.heatNow) {
    s.heat -= item.heatNow;
    clampHeat(s);
  }
}

// ---------- 3. คำนวณผล ----------
function itemPct(
  s: GameState,
  c: GameContent,
  owned: Record<string, number>,
  key: 'incomePct' | 'heatPct',
  methodId: string,
): number {
  let pct = 0;
  for (const [id, n] of Object.entries(owned)) {
    const it = getShopItem(c, id);
    if (it.methodId && it.methodId !== methodId) continue;
    pct += (it[key] ?? 0) * n;
  }
  return pct;
}

export function incomeBonusPct(s: GameState, c: GameContent, methodId: string): number {
  let pct = perksOfKind(s, c, 'methodIncome')
    .filter((p) => p.methodId === methodId)
    .reduce((n, p) => n + p.pct, 0);
  pct += modifierPct(s, c, 'income', methodId);
  pct += s.henchmen.reduce((sum, h) => sum + h.skill, 0);
  pct += itemPct(s, c, s.dailyItems, 'incomePct', methodId);
  pct += itemPct(s, c, s.upgrades, 'incomePct', methodId);
  return pct;
}

export function heatBonusPct(s: GameState, c: GameContent, methodId: string): number {
  let pct = modifierPct(s, c, 'heat', methodId);
  pct += perksOfKind(s, c, 'methodHeat')
    .filter((p) => p.methodId === methodId)
    .reduce((n, p) => n + p.pct, 0);
  pct += perksOfKind(s, c, 'fameHeat').reduce(
    (n, p) => n + (p.pctPer10Fame * Math.max(0, s.fame)) / 10,
    0,
  );
  pct += itemPct(s, c, s.dailyItems, 'heatPct', methodId);
  pct += itemPct(s, c, s.upgrades, 'heatPct', methodId);
  return Math.max(-90, pct);
}

/** สุ่มประกอบเหยื่อจากชิ้นส่วน (ชื่อ + อาชีพ + นิสัยตามจุดอ่อน) */
function makeVictim(s: GameState, c: GameContent, rng: Rng): CallVictim {
  const parts = c.victimParts;
  const weakness = rng.pick(['greed', 'fear', 'faith', 'lonely'] as const);
  const jobIdx = rng.int(0, parts.jobs.length - 1);
  const job = parts.jobs[jobIdx];
  invariant(job, 'no victim jobs');
  const age = rng.range(job.age);
  const portraits = c.victims.filter((v) => Math.abs(v.age - age) <= 20);
  const portrait = rng.pick(portraits.length > 0 ? portraits : c.victims).id;
  const wealthPct =
    perksOfKind(s, c, 'victimWealth').reduce((n, p) => n + p.pct, 0) +
    (currentNews(s, c)?.victimWealthPct ?? 0);
  return {
    portrait,
    nameIdx: rng.int(0, parts.names.length - 1),
    jobIdx,
    traitIdx: rng.int(0, parts.traits[weakness].length - 1),
    age,
    weakness,
    wealth: Math.round(job.wealth * (100 + wealthPct)) / 100,
  };
}

/** กดยืนยันการลงทุน → จ่ายต้นทุน แล้วคำนวณผล หรือเข้ามินิเกมคอลเซ็นเตอร์ */
export function confirmInvest(s: GameState, c: GameContent, rng: Rng): void {
  const methodId = s.todayMethodId;
  if (methodId === null) {
    // วันพัก: Heat ลดเอง
    s.heat -= c.config.heatDecayQuietDay;
    clampHeat(s);
    s.workStreak = 0;
    tickIdle(s, c, null);
    afterResolve(s, c, rng);
    return;
  }
  const m = getMethod(c, methodId);
  spend(s, m.cost);
  s.workStreak++;
  if (!s.methodsUsed.includes(m.id)) s.methodsUsed.push(m.id);
  tickIdle(s, c, m.id);

  if (m.mechanic === 'callCenter') {
    const victim = makeVictim(s, c, rng);
    const match = rng.pick(c.pitches.filter((p) => p.weakness === victim.weakness));
    const others = rng.sample(
      c.pitches.filter((p) => p.weakness !== victim.weakness),
      2,
    );
    s.call = { victim, pitchIds: rng.sample([match, ...others], 3).map((p) => p.id) };
    s.phase = 'call';
    return;
  }

  let base = rng.range(m.income);
  let heat = rng.range(m.heat);
  const ms = methodStateOf(s, m.id);
  switch (m.mechanic) {
    case 'romance': {
      const { bondIncomePct, maxBond } = c.config.romance;
      base = Math.round(base * (1 + (s.romance.bond * bondIncomePct) / 100));
      s.romance.bond = Math.min(maxBond, s.romance.bond + 1);
      s.romance.idleDays = 0;
      break;
    }
    case 'foundation': {
      const f = c.config.foundation;
      if (rng.chance(f.viralPct + Math.min(20, s.fame / 5))) {
        base *= f.viralMul;
        s.lastResults.push({ kind: 'viral' });
      }
      ms.exposure += rng.range(f.exposurePerUse);
      if (ms.exposure >= 100) {
        // ชาวเน็ตขุดเจอ: Heat พุ่ง ปิดมูลนิธิชั่วคราว
        heat += f.exposedHeat;
        ms.exposure = 0;
        ms.cooldownUntil = s.day + f.exposedCooldown;
        s.lastResults.push({ kind: 'exposed' });
      }
      break;
    }
    case 'merit':
      if (activeFestivals(s, c).length > 0) base *= 2;
      break;
    case 'ponzi': {
      const p = c.config.ponzi;
      if (rng.chance(ponziCrashPct(s, c))) {
        base = 0;
        heat += p.crashHeat;
        ms.streak = 0;
        s.dirtyCash = Math.round(s.dirtyCash * 0.7);
        s.lastResults.push({ kind: 'ponziCrash' });
      } else {
        base = Math.round(base * Math.pow(1 + p.growthPct / 100, ms.streak));
        ms.streak++;
        s.stats.maxPonziStreak = Math.max(s.stats.maxPonziStreak, ms.streak);
      }
      break;
    }
    default:
      break;
  }
  applyIncome(s, c, m, base, heat, rng);
  afterResolve(s, c, rng);
}

/** มินิเกมคอลเซ็นเตอร์: เลือกมุก 1 ใน 3 */
export function callPitch(s: GameState, c: GameContent, rng: Rng, pitchId: string): void {
  invariant(s.call, 'no active call');
  invariant(s.call.pitchIds.includes(pitchId), `pitch ${pitchId} not offered`);
  const { victim } = s.call;
  const pitch = getPitch(c, pitchId);
  const m = getMethod(c, s.todayMethodId ?? '');
  const { matchSuccessPct, missSuccessPct, failHeat } = c.config.callCenter;
  const matched = pitch.weakness === victim.weakness;
  const success = rng.chance(matched ? matchSuccessPct : missSuccessPct);
  const base = success ? Math.round(rng.range(m.income) * victim.wealth) : 0;
  const heat = rng.range(m.heat) + (success ? 0 : failHeat);
  s.lastResults.push({
    kind: 'call',
    textKey: `${victim.portrait}:${pitch.id}:${victim.nameIdx}`,
    success,
  });
  s.call = null;
  applyIncome(s, c, m, base, heat, rng);
  afterResolve(s, c, rng);
}

function applyIncome(
  s: GameState,
  c: GameContent,
  m: ScamMethod,
  baseIncome: number,
  baseHeat: number,
  rng: Rng,
): void {
  let mul = 1 + incomeBonusPct(s, c, m.id) / 100;
  for (const p of perksOfKind(s, c, 'chaos')) mul *= p.min + rng.next() * (p.max - p.min);
  const income = Math.max(0, Math.round(baseIncome * mul));
  const heat = Math.max(0, Math.round(baseHeat * (1 + heatBonusPct(s, c, m.id) / 100)));
  const before = s.heat;
  s.dirtyCash += income;
  s.heat += heat;
  clampHeat(s);
  s.fame += m.fame ?? 0;
  s.karma += karmaDelta(s, c, m.karma);
  const log = s.history.at(-1);
  if (log) {
    log.income = income;
    log.heatGained = s.heat - before;
  }
  s.lastResults.push({ kind: 'resolve', dirtyCash: income, heat: s.heat - before });
}

/** วิธีที่ไม่ได้ทำวันนี้: เหยื่อหลอกรักเริ่มห่าง แชร์ลูกโซ่ขาดตอน มูลนิธิเงียบลง */
function tickIdle(s: GameState, c: GameContent, todayMethod: string | null): void {
  if (todayMethod !== 'romance' && s.romance.bond > 0) {
    s.romance.idleDays++;
    if (s.romance.idleDays >= c.config.romance.fleeAfterIdleDays) {
      s.romance = { bond: 0, idleDays: 0 };
      s.lastResults.push({ kind: 'romanceFled' });
    }
  }
  for (const m of c.methods) {
    if (m.id === todayMethod) continue;
    const ms = s.methodState[m.id];
    if (!ms) continue;
    if (m.mechanic === 'ponzi') ms.streak = 0;
    if (m.mechanic === 'foundation') {
      ms.exposure = Math.max(0, ms.exposure - c.config.foundation.exposureDecay);
    }
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
  spend(s, priceOf(s, c, item.id, item.price));
  s.upgrades[itemId] = owned + 1;
  if (item.heatNow) {
    s.heat -= item.heatNow;
    clampHeat(s);
  }
}

/** สุ่มข่าวประจำสัปดาห์ */
export function rollNews(s: GameState, c: GameContent, rng: Rng): void {
  const pool = c.news.filter((n) => !n.minLevel || s.gangLevel >= n.minLevel);
  const i = rng.weightedIndex(pool.map((n) => n.weight));
  const n = pool[i];
  if (!n) return;
  s.news = { id: n.id, untilDay: s.day + c.config.newsEveryDays - 1 };
  s.lastResults.push({ kind: 'news', textKey: n.id });
}

/** จบวัน: จ่ายค่าจ้าง ลด modifier ขึ้นวันใหม่ คืน true ถ้าครบจำนวนวัน */
export function endDay(s: GameState, c: GameContent, rng: Rng): boolean {
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
  if ((s.day - 1) % c.config.newsEveryDays === 0) rollNews(s, c, rng);
  s.phase = 'plan';
  return false;
}
