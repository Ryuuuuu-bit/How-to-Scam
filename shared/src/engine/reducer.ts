import { campaignDays } from './campaign';
import { reformFlag, reformOf, reformStartKarma } from './loadout';
import { careerFee, careerSignatures, careerStatus, minimumJobCost } from './careerPaths';
import type { EndReason, GameContent } from '../types/content';
import type { Action, GameState } from '../types/state';
import {
  buy,
  buyDeal,
  holdMarket,
  callHangup,
  callPitch,
  choosePlan,
  confirmInvest,
  endDay,
  goToLaunder,
  invest,
  newsScout,
  rollNews,
  spend,
} from './day';
import { invariant } from './errors';
import { originRewards, originStage } from './opening';
import { resolveEventChoice } from './events';
import {
  applyCaught,
  dreamSequence,
  escapeBribe,
  escapeDisguise,
  escapeEvent,
  escapeQte,
  escapeRoute,
  escapeSurrender,
} from './escape';
import { HEAT_MAX } from './effects';
import { launder } from './launder';
import { acceptOffer, rollOffer } from './offers';
import { getCharacter } from './lookup';
import { hashSeed, Rng } from './rng';
import { computeScore, pickDangerSigns, pickEnding } from './score';
import { openShop, owns } from './shop';
import { caseAction, caseEscapePenalty, finishSoi, isLivingSoi, keepAppointment, newCase, newSoi, shapePlace, soiBlocker } from './soi';

/** เริ่มรอบใหม่ — seed มาจาก server (หรือสุ่มเองตอนเล่น offline) */
export function newGame(seed: string, characterId: string, c: GameContent): GameState {
  const ch = getCharacter(c, characterId);
  const rng = new Rng(hashSeed(seed));
  const perk = <K extends 'startFame' | 'startCash'>(k: K) =>
    ch.perks.filter((p) => p.kind === k).reduce((n, p) => n + ('value' in p ? p.value : 0), 0);
  const s: GameState = {
    maxDays: campaignDays(seed) ?? c.config.maxDays,
    version: 2,
    seed,
    rng: 0,
    day: 1,
    startMonth: rng.int(1, 12),
    startDate: rng.int(1, 28),
    phase: 'plan',
    characterId,
    gangLevel: 1,
    dirtyCash: c.config.startDirtyCash + perk('startCash'),
    cleanCash: 0,
    totalLaundered: 0,
    heat: 0,
    fame: perk('startFame'),
    karma: 0,
    henchmen: [],
    nextHenchmanId: 1,
    modifiers: [],
    dailyItems: {},
    upgrades: {},
    todayMethodId: null,
    workStreak: 0,
    romance: { bond: 0, idleDays: 0 },
    methodState: {},
    call: null,
    news: null,
    offer: null,
    mission: null,
    escape: null,
    scheduled: [],
    pendingEvents: [],
    seenEvents: [],
    launderOffer: [],
    flags: [],
    escapes: 0,
    methodsUsed: [],
    stats: { specialChoices: 0, maxPonziStreak: 0, launderOk: 0 },
    history: [],
    lastResults: [],
    end: null,
  };
  if (isLivingSoi(seed)) {
    s.soi = newSoi();
    s.case = newCase();
  }
  if (reformOf(s)) {
    s.flags.push(reformFlag);
    s.karma += reformStartKarma;
  }
  rollNews(s, c, rng);
  rollOffer(s, c, rng);
  s.rng = rng.state;
  return s;
}

function finish(s: GameState, c: GameContent, rng: Rng, reason: EndReason): void {
  if (reason === 'caught') applyCaught(s, c);
  finishSoi(s);
  s.phase = 'ended';
  s.end = {
    reason,
    endingId: pickEnding(s, c, reason),
    dangerSignIds: pickDangerSigns(s, c, rng),
    score: computeScore(s, c, reason),
  };
}

function expectPhase(s: GameState, ...phases: GameState['phase'][]): void {
  invariant(phases.includes(s.phase), `action not allowed in phase "${s.phase}"`);
}

/**
 * pure function: คืน state ใหม่ ไม่แก้ของเดิม
 * action ผิดกติกา → โยน InvalidActionError
 */
export function step(prev: GameState, action: Action, c: GameContent): GameState {
  invariant(prev.phase !== 'ended', 'game already ended');
  const s = structuredClone(prev);
  s.lastResults = [];
  const rng = new Rng(s.rng);

  switch (action.t) {
    case 'shapePlace':
      expectPhase(s, 'plan');
      shapePlace(s, action.place, action.form);
      break;
    case 'appointment':
      expectPhase(s, 'plan');
      invariant(s.soi?.pendingShape === undefined, 'decide the place first');
      keepAppointment(s, action.npc);
      break;
    case 'caseMove':
      expectPhase(s, 'plan');
      caseAction(s, rng, action.kind, action.evidenceId);
      if (s.heat >= HEAT_MAX) s.phase = 'escape';
      break;
    case 'specialize': {
      expectPhase(s, 'plan');
      const status = careerStatus(s, action.methodId);
      invariant(!status.branch && status.shifts >= status.needed, 'career branch unavailable');
      invariant(action.branch === 'face' || action.branch === 'boss', 'unknown career branch');
      (s.careers ??= {})[action.methodId] = { branch: action.branch, since: s.day };
      break;
    }
    case 'careerDecision': {
      expectPhase(s, 'plan');
      const status = careerStatus(s, action.methodId);
      const selected = s.careers?.[action.methodId];
      invariant(selected && !selected.decision && status.commissions >= 1, 'career decision unavailable');
      invariant(['patron', 'local', 'talent'].includes(action.choice), 'unknown decision');
      if (action.choice === 'talent') invariant(!Object.values(s.careers ?? {}).some(r => r.decision === 'talent'), 'signature already used');
      selected.decision = action.choice;
      if (action.choice === 'patron') {
        s.dirtyCash += 350;
        s.heat = Math.min(100, s.heat + 4);
      } else if (action.choice === 'talent') {
        const talent = careerSignatures[s.characterId];
        invariant(talent, 'missing career signature');
        s.heat = Math.max(0, Math.min(HEAT_MAX, s.heat + talent.heat));
        s.dirtyCash += talent.cash;
        s.fame += talent.fame;
      } else {
        s.karma += 2;
        s.fame += 2;
      }
      if (s.heat >= HEAT_MAX) s.phase = 'escape';
      break;
    }
    case 'careerFinale': {
      expectPhase(s, 'plan');
      const status = careerStatus(s, action.methodId);
      const selected = s.careers?.[action.methodId];
      invariant(selected?.decision && !selected.finale && status.commissions >= 3, 'career finale unavailable');
      invariant(action.choice === 'fee' || action.choice === 'credit', 'unknown finale');
      selected.finale = action.choice;
      if (action.choice === 'fee') s.dirtyCash += careerFee(c, action.methodId);
      else { s.fame += 4; s.heat = Math.max(0, s.heat - 6); }
      break;
    }
    case 'relief': {
      expectPhase(s, 'plan');
      invariant(action.job === 'advance' || soiBlocker(s) === null, 'the neighbourhood is waiting for you');
      const cost = minimumJobCost(s, c);
      const favorDue = s.favorDay !== undefined && s.day >= s.favorDay;
      if (action.job === 'favor') invariant(favorDue, 'no favor due');
      else invariant(!favorDue && cost !== null && s.dirtyCash + s.cleanCash < cost, 'relief unavailable');
      if (action.job === 'advance') {
        invariant(s.favorDay === undefined && s.advanceDay !== s.day && s.day + 2 <= s.maxDays, 'advance unavailable');
        s.dirtyCash += cost ?? 0;
        s.advanceDay = s.day;
        s.favorDay = s.day + 2;
        break;
      }
      invariant(action.job === 'mascot' || action.job === 'stage' || action.job === 'favor', 'unknown relief job');
      choosePlan(s, c, null);
      const log = s.history.at(-1);
      invariant(log, 'missing relief shift');
      log.relief = action.job;
      if (action.job === 'favor') delete s.favorDay;
      const extra = action.job === 'stage' ? 250 : 0;
      if (extra) { s.fame += 1; s.heat = Math.min(100, s.heat + 5); }
      s.workStreak = 0;
      if (action.job !== 'favor') s.dirtyCash += s.henchmen.reduce((total, h) => total + h.wage, 0);
      if (s.heat >= HEAT_MAX && extra) {
        log.income = (cost ?? 0) + extra;
        s.dirtyCash += log.income;
        s.phase = 'escape';
        break;
      }
      const lastDay = endDay(s, c, rng);
      if (action.job !== 'favor') {
        log.income = (minimumJobCost(s, c) ?? cost ?? 0) + extra;
        s.dirtyCash += log.income;
      }
      if (lastDay) finish(s, c, rng, 'survived');
      break;
    }
    case 'replyOrigin':
      invariant(originStage(s) === 'opening' && (action.reply === 'help' || action.reply === 'later'), 'invalid origin reply');
      s.originStory = { reply: action.reply };
      break;
    case 'readOrigin':
      invariant(originStage(s) === 'followup' && s.originStory, 'no origin message due');
      if (s.originStory.reply === 'help') s.fame += originRewards.help.fame;
      else s.cleanCash += originRewards.later.cleanCash;
      s.originStory.followedUpOn = s.day;
      break;
    case 'scoutNews':
      expectPhase(s, 'plan');
      invariant(s.day >= newsScout.firstDay && s.scoutedDay !== s.day, 'news scout unavailable');
      spend(s, newsScout.price);
      s.scoutedDay = s.day;
      break;
    case 'choosePlan':
      expectPhase(s, 'plan');
      invariant(s.favorDay === undefined || s.day < s.favorDay, 'return the market favor first');
      invariant(soiBlocker(s) === null, 'the neighbourhood is waiting for you');
      choosePlan(s, c, action.methodId, action.opening);
      break;
    case 'invest':
      expectPhase(s, 'invest');
      invest(s, c, rng, action.itemId);
      break;
    case 'acceptOffer':
      expectPhase(s, 'plan', 'invest');
      acceptOffer(s, c, rng, spend);
      break;
    case 'confirmInvest':
      expectPhase(s, 'invest');
      confirmInvest(s, c, rng);
      break;
    case 'callPitch':
      expectPhase(s, 'call');
      callPitch(s, c, rng, action.pitchId);
      break;
    case 'callHangup':
      expectPhase(s, 'call');
      callHangup(s, c, rng);
      break;
    case 'eventChoice':
      expectPhase(s, 'event');
      resolveEventChoice(s, c, rng, action.choiceIdx);
      if (s.heat >= HEAT_MAX) s.phase = 'escape';
      else if (s.pendingEvents.length === 0) goToLaunder(s, c, rng);
      break;
    case 'launder':
      expectPhase(s, 'launder');
      launder(s, c, rng, action.cardId);
      s.phase = s.heat >= HEAT_MAX ? 'escape' : 'shop';
      break;
    case 'buy':
      expectPhase(s, 'shop');
      buy(s, c, action.itemId);
      break;
    case 'shopDeal':
      expectPhase(s, 'shop');
      buyDeal(s, c);
      break;
    case 'shopHold':
      expectPhase(s, 'shop');
      holdMarket(s, action.itemId);
      break;
    case 'endDay':
      expectPhase(s, 'shop');
      if (endDay(s, c, rng)) finish(s, c, rng, 'survived');
      break;
    case 'escapeDisguise':
      expectPhase(s, 'escape');
      escapeDisguise(s, c, action.id);
      break;
    case 'escapeRoute':
      expectPhase(s, 'escape');
      escapeRoute(s, c, rng, action.id);
      break;
    case 'escapeEvent':
      expectPhase(s, 'escape');
      escapeEvent(s, c, action.choiceIdx);
      break;
    case 'escapeBribe':
      expectPhase(s, 'escape');
      escapeBribe(s, c, rng, action.pay);
      break;
    case 'escapeQte':
      expectPhase(s, 'escape');
      if (escapeQte(s, c, rng, action.hits)) {
        if (action.custody) s.escape = { step: 'custody', bonus: 0 };
        else finish(s, c, rng, 'caught');
      }
      break;
    case 'escapeSurrender':
      expectPhase(s, 'escape');
      invariant(s.escape?.step !== 'custody', 'already in custody');
      escapeSurrender(s, c);
      if (action.custody) s.escape = { step: 'custody', bonus: 0 };
      else finish(s, c, rng, 'caught');
      break;
    case 'custodyVerdict': {
      expectPhase(s, 'escape');
      invariant(s.escape?.step === 'custody', 'not in custody');
      const answer = action.answer;
      if (answer !== null) {
        invariant(!s.flags.includes('dream_escape') && !s.flags.includes('surrendered'), 'dream unavailable');
        invariant(answer.length === 3 && answer.every(n => Number.isInteger(n) && n >= 0 && n < 3), 'invalid dream');
      }
      if (!answer || !dreamSequence(s).every((n, i) => n === answer[i])) {
        if (answer) s.flags.push('missed_custody_cards');
        finish(s, c, rng, 'caught');
        break;
      }
      applyCaught(s, c);
      s.flags.push('dream_escape');
      s.escapes++;
      s.heat = 45;
      s.day = Math.min(s.maxDays, s.day + 1);
      s.pendingEvents = [];
      s.lastResults.push({ kind: 'escape', success: true, textKey: 'dream_escape' });
      goToLaunder(s, c, rng);
      break;
    }
    case 'retire':
      expectPhase(s, 'plan', 'shop');
      finish(s, c, rng, 'retired');
      break;
    default: {
      const never: never = action;
      invariant(false, `unknown action ${JSON.stringify(never)}`);
    }
  }

  if (s.phase === 'escape' && !s.escape) s.escape = { step: 'disguise', bonus: -caseEscapePenalty(s) + (owns(s, 'app_case') ? 10 : 0) };
  if (s.phase === 'shop') openShop(s, c);
  s.rng = rng.state;
  return s;
}
