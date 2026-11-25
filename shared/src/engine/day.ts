import type { GameContent, GangLevel, ScamMethod } from '../types/content';
import { openingFor } from './opening';
import { callerNameIndices, callerPortraits } from './callerIdentity';
import type { CallVictim, GameState } from '../types/state';
import { activeFestivals, currentNews } from './calendar';
import { addHenchman, clampHeat, HEAT_MAX, methodStateOf, modifierPct } from './effects';
import { invariant } from './errors';
import { rollDailyEvents } from './events';
import { dealLaunderOffer } from './launder';
import { offerBans, rollOffer, tickMission } from './offers';
import { getMethod, getPitch, getShopItem } from './lookup';
import { karmaDelta, perksOfKind, priceOf } from './perks';
import type { Rng } from './rng';
import { edgeIncomePct, isRush, methodLevel, restHeatDecay, riskRules, tallyEdgeDay } from './risk';
import { addEvidence, afterShift, endOfDaySoi, isAlly, placeBonus, quietDayBonus } from './soi';
import { applyNow, basePrice, contrabandWeight, dealDiscount, famePerShift, henchmanCap, hideoutPct, holdPrice, owns, placeUnlocked } from './shop';

import { carOf, homeOf, outfitOf, petOf, reformIncomePct, reformOf } from './loadout';

export const newsScout = { firstDay: 2, price: 350 } as const;

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
  if (methodLevel(s, c, m) > s.gangLevel && !perksOfKind(s, c, 'earlyMethod').some(p => p.methodId === m.id)) return 'level';
  if (perksOfKind(s, c, 'bannedMethod').some((p) => p.methodId === m.id)) return 'banned';
  if ((s.methodState[m.id]?.cooldownUntil ?? 0) >= s.day) return 'cooldown';
  return null;
}

export function unlockedMethods(s: GameState, c: GameContent): ScamMethod[] {
  return c.methods.filter((m) => methodBlock(s, c, m) === null);
}

export function levelFor(totalLaundered: number, c: GameContent, legacy = false): GangLevel {
  const [l2, l3, l4] = legacy ? [25_000, 110_000, 380_000] as const : c.config.levelThresholds;
  if (totalLaundered >= l4) return 4;
  if (totalLaundered >= l3) return 3;
  if (totalLaundered >= l2) return 2;
  return 1;
}

export function updateLevel(s: GameState, c: GameContent): void {
  const lvl = levelFor(s.totalLaundered, c, !s.seed.startsWith('v3:'));
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
export function choosePlan(s: GameState, c: GameContent, methodId: string | null, fromOpening = false, rush = false): void {
  const opening = fromOpening && s.day === 1 ? openingFor(s.seed, s.characterId) : null;
  if (fromOpening) invariant(!!opening && (methodId === null || methodId === 'fake_shop'), 'invalid opening choice');
  if (methodId !== null) {
    const block = methodBlock(s, c, getMethod(c, methodId));
    invariant(block === null, `method ${methodId} unavailable (${block})`);
  }
  invariant(!rush || (methodId !== null && riskRules(s.seed)), 'rush unavailable');
  s.todayMethodId = methodId;
  s.history.push({
    ...(opening && { opening }),
    ...(rush && { rush: true }),
    repeatableCost: methodId ? getMethod(c, methodId).cost : 0,
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
  invariant(!offerBans(s, c, item.id), `${itemId} is banned today`);
  const price = priceOf(s, c, item.id, item.price);
  if (item.kind === 'henchman') {
    invariant(s.henchmen.length < henchmanCap(s, c), 'henchman limit reached');
    const named = itemId === 'intern_nat' || itemId === 'host_tuk';
    invariant(!named || !s.henchmen.some((h) => h.recruit === itemId), 'already hired');
    spend(s, price);
    addHenchman(s, rng, item.wage ?? 0, item.incomePct ?? 15);
    const hire = s.henchmen.at(-1);
    const log = s.history.at(-1);
    if (named && hire) {
      hire.recruit = itemId;
      hire.skill = item.incomePct ?? 5;
      if (log) (log.recruits ??= []).push(itemId);
    }
    return;
  }
  const owned = s.dailyItems[itemId] ?? 0;
  invariant(owned < item.maxStack, `${itemId} max per day reached`);
  spend(s, price);
  s.dailyItems[itemId] = owned + 1;
  const log = s.history.at(-1);
  if (log?.repeatableCost !== undefined) log.repeatableCost += price;
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
    if (it.methodIds && !it.methodIds.includes(methodId)) continue;
    pct += (it[key] ?? 0) * n;
  }
  return pct;
}

export function incomeBonusPct(s: GameState, c: GameContent, methodId: string): number {
  let pct = perksOfKind(s, c, 'methodIncome')
    .filter((p) => p.methodId === methodId)
    .reduce((n, p) => n + p.pct, 0);
  pct += modifierPct(s, c, 'income', methodId);
  pct += placeBonus(s, methodId).income;
  if (s.careers?.[methodId]?.branch === 'face') pct += 15;
  if (s.careers?.[methodId]?.branch === 'boss') pct += Math.min(3, s.henchmen.length) * 8;
  pct += s.henchmen.reduce((sum, h) => sum + h.skill, 0);
  pct += itemPct(s, c, s.dailyItems, 'incomePct', methodId);
  pct += itemPct(s, c, s.upgrades, 'incomePct', methodId);
  pct += hideoutPct(s, 'incomePct');
  const fit = outfitOf(s).incomePct;
  if (fit?.methodIds.includes(methodId)) pct += fit.pct;
  if (reformOf(s)) pct += reformIncomePct;
  pct += edgeIncomePct(s, c);
  return pct;
}

export function heatBonusPct(s: GameState, c: GameContent, methodId: string): number {
  let pct = modifierPct(s, c, 'heat', methodId) + placeBonus(s, methodId).heat;
  if (s.careers?.[methodId]?.branch === 'face') pct += 10;
  if (s.careers?.[methodId]?.branch === 'boss') pct -= 10;
  pct += perksOfKind(s, c, 'methodHeat')
    .filter((p) => p.methodId === methodId)
    .reduce((n, p) => n + p.pct, 0);
  pct += perksOfKind(s, c, 'fameHeat').reduce(
    (n, p) => n + (p.pctPer10Fame * Math.max(0, s.fame)) / 10,
    0,
  );
  pct += itemPct(s, c, s.dailyItems, 'heatPct', methodId);
  pct += itemPct(s, c, s.upgrades, 'heatPct', methodId);
  pct += hideoutPct(s, 'heatPct');
  pct += outfitOf(s).heatPct ?? 0;
  pct += carOf(s).heatPct ?? 0;
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
  // One draw each for the portrait and the name preserves existing replay sequences.
  const portrait = rng.pick(callerPortraits(c, job, age)).id;
  const wealthPct =
    perksOfKind(s, c, 'victimWealth').reduce((n, p) => n + p.pct, 0) +
    (currentNews(s, c)?.victimWealthPct ?? 0);
  return {
    portrait,
    nameIdx: rng.pick(callerNameIndices(parts, portrait, age)),
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
  tickMission(s, c, rng, methodId);
  if (methodId === null) {
    // วันพัก: Heat ลดเอง
    s.heat -= restHeatDecay(s, c) + quietDayBonus(s) + homeOf(s).quietHeat;
    s.dirtyCash += petOf(s).quietCash ?? 0;
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
    rollCaller(s, c, rng, victim);
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
        addEvidence(s, 'exposed', 2, m.id);
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
        addEvidence(s, 'crash', 2, m.id);
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
/** ปลายสายเป็นใครกันแน่: เหยื่อธรรมดา / คนหลอกกลับ / ตำรวจไซเบอร์ปลอมตัว */
function rollCaller(s: GameState, c: GameContent, rng: Rng, v: CallVictim): void {
  const cfg = c.config.callCenter;
  const undercoverPct = cfg.undercoverBasePct + (cfg.undercoverPerHeat10 * s.heat) / 10;
  const roll = rng.next() * 100;
  v.kind =
    roll < undercoverPct
      ? 'undercover'
      : roll < undercoverPct + cfg.baiterPct
        ? 'baiter'
        : 'normal';
  const tells = c.victimParts.tells;
  if (v.kind !== 'normal') {
    v.tell = { kind: v.kind, idx: rng.int(0, tells[v.kind].length - 1) };
  } else if (rng.chance(cfg.herringPct)) {
    v.tell = { kind: 'herring', idx: rng.int(0, tells.herring.length - 1) };
  }
}

/** วางสายใส่ — ไม่ได้เงิน ไม่เพิ่ม Heat; วางสายเหยื่อธรรมดาได้กรรมดีนิดหน่อย */
export function callHangup(s: GameState, c: GameContent, rng: Rng): void {
  invariant(s.call, 'no active call');
  const kind = s.call.victim.kind ?? 'normal';
  if (kind !== 'normal' && !s.flags.includes('sharp_ears')) s.flags.push('sharp_ears');
  if (kind === 'normal') s.karma += 1;
  s.lastResults.push({ kind: 'hangup', textKey: kind, success: kind !== 'normal' });
  s.call = null;
  afterResolve(s, c, rng);
}

export function callPitch(s: GameState, c: GameContent, rng: Rng, pitchId: string): void {
  invariant(s.call, 'no active call');
  invariant(s.call.pitchIds.includes(pitchId), `pitch ${pitchId} not offered`);
  const { victim } = s.call;
  const pitch = getPitch(c, pitchId);
  const m = getMethod(c, s.todayMethodId ?? '');
  const { matchSuccessPct, missSuccessPct, failHeat } = c.config.callCenter;
  if (victim.kind === 'baiter' || victim.kind === 'undercover') {
    trapCall(s, c, rng, victim.kind);
    return;
  }
  const matched = pitch.weakness === victim.weakness;
  const parrot = matched ? 0 : (petOf(s).missCallPct ?? 0);
  const success = rng.chance(
    Math.min(95, (matched ? matchSuccessPct : missSuccessPct) + (outfitOf(s).callPct ?? 0) + parrot),
  );
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

/** โดนหลอกกลับ หรือโดนล่อซื้อ (มุกล้วนๆ) */
function trapCall(s: GameState, c: GameContent, rng: Rng, kind: 'baiter' | 'undercover'): void {
  const cfg = c.config.callCenter;
  s.call = null;
  if (kind === 'baiter') {
    const loss = Math.min(
      s.dirtyCash,
      Math.max(cfg.baiterLossMin, Math.round((s.dirtyCash * cfg.baiterLossPct) / 100)),
    );
    s.dirtyCash -= loss;
    s.fame += 5;
    if (!s.flags.includes('met_baiter')) s.flags.push('met_baiter');
    s.lastResults.push({ kind: 'baited', dirtyCash: -loss, success: false });
    addEvidence(s, 'clip', 1, 'call_center');
  } else {
    s.heat += cfg.undercoverHeat;
    clampHeat(s);
    if (!s.flags.includes('stung')) s.flags.push('stung');
    s.lastResults.push({ kind: 'sting', heat: cfg.undercoverHeat, success: false });
    addEvidence(s, 'sting', 3, 'call_center');
  }
  afterShift(s, 'call_center', 0);
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
  if (isRush(s)) {
    baseIncome *= c.config.risk.rushIncomeMul;
    baseHeat *= c.config.risk.rushHeatMul;
  }
  if (s.henchmen.some((h) => h.recruit === 'host_tuk')) {
    s.fame += 2;
    baseHeat += 1;
  }
  for (const p of perksOfKind(s, c, 'chaos')) mul *= p.min + rng.next() * (p.max - p.min);
  const income = Math.max(0, Math.round(baseIncome * mul));
  const heat = Math.max(0, Math.round(baseHeat * (1 + heatBonusPct(s, c, m.id) / 100)));
  const before = s.heat;
  const wallet = m.cleanIncome ? 'cleanCash' : 'dirtyCash';
  s[wallet] += income;
  s.heat += heat;
  clampHeat(s);
  s.fame += m.fame ?? 0;
  s.karma += karmaDelta(s, c, m.karma);
  const log = s.history.at(-1);
  if (log) {
    log.income = income;
    log.heatGained = s.heat - before;
  }
  s.lastResults.push({ kind: 'resolve', [wallet]: income, heat: s.heat - before });
  afterShift(s, m.id, s.heat - before);
  s.fame += famePerShift(s, c, m.id);
  for (const h of s.henchmen) if (h.recruit === 'intern_nat') h.skill = Math.min(15, h.skill + 1);
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
  if (item.line) {
    // ของรุ่น 1.0 มีเฉพาะรอบซอยมีชีวิต
    invariant(s.soi && s.market?.day === s.day, `${itemId} is not on sale`);
    if (item.line === 'market') invariant(s.market.offers.includes(itemId) && !s.market.bought.includes(itemId), `${itemId} is not on tonight's market`);
    if (item.line === 'place') invariant(placeUnlocked(s, item), `${itemId} is not unlocked yet`);
  }
  spend(s, priceOf(s, c, item.id, basePrice(s, item)));
  takeItem(s, item);
}

function takeItem(s: GameState, item: GameContent['shopItems'][number]): void {
  const owned = s.upgrades[item.id] ?? 0;
  s.upgrades[item.id] = owned + 1;
  if (item.heatNow) {
    s.heat -= item.heatNow;
    clampHeat(s);
  }
  applyNow(s, item);
  if (item.id === 'hideout' && owned + 1 === 2) s.fame += 3;
  s.market?.bought.push(item.id);
}

/** ดีลเถื่อนของเฮียโต้ง: ลดครึ่งราคา แต่ทิ้งใบเสร็จไว้บนบอร์ดคดี (ถ้าเฮียไม่ใช่พวกเรา) */
export function buyDeal(s: GameState, c: GameContent): void {
  const m = s.market;
  invariant(s.soi && m?.day === s.day && m.deal && !m.dealBought, 'no deal tonight');
  const item = getShopItem(c, m.deal);
  invariant((s.upgrades[item.id] ?? 0) < item.maxStack, `${item.id} max reached`);
  spend(s, Math.round((basePrice(s, item) * (100 - dealDiscount)) / 100));
  takeItem(s, item);
  m.dealBought = true;
  if (!isAlly(s, 'hia')) addEvidence(s, 'contraband', contrabandWeight);
}

/** จองของในตลาดมืดให้วางอีกคืน */
export function holdMarket(s: GameState, itemId: string): void {
  const m = s.market;
  invariant(s.soi && m?.day === s.day, 'market is closed');
  invariant(m.offers.includes(itemId) && !m.bought.includes(itemId), `${itemId} is not on tonight's market`);
  invariant(!m.hold, 'already holding an item');
  spend(s, holdPrice);
  m.hold = itemId;
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
      if (h.recruit === 'intern_nat' && !s.history.some(day => day.natFirstPay)) {
        const today = s.history.at(-1);
        if (today) today.natFirstPay = true;
      }
      if (s.heat > 70 && !isAlly(s, 'coach')) h.loyalty = Math.max(0, h.loyalty - (owns(s, 'app_chat') ? 2 : 5));
    } else {
      // จ่ายไม่ไหว ลูกน้องเดินออก
      s.henchmen = s.henchmen.filter((x) => x.id !== h.id);
    }
  }
  s.modifiers = s.modifiers
    .map((m) => ({ ...m, daysLeft: m.daysLeft - 1 }))
    .filter((m) => m.daysLeft > 0);
  tallyEdgeDay(s, c);
  s.dailyItems = {};
  s.todayMethodId = null;
  updateLevel(s, c);
  endOfDaySoi(s, rng);
  if (s.day >= s.maxDays) return true;
  s.day++;
  if ((s.day - 1) % c.config.newsEveryDays === 0) rollNews(s, c, rng);
  rollOffer(s, c, rng);
  s.phase = 'plan';
  return false;
}
