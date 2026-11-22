import type { EndReason, GameContent } from '../types/content';
import type { Action, GameState } from '../types/state';
import {
  buy,
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
import { resolveEventChoice } from './events';
import {
  applyCaught,
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

/** เริ่มรอบใหม่ — seed มาจาก server (หรือสุ่มเองตอนเล่น offline) */
export function newGame(seed: string, characterId: string, c: GameContent): GameState {
  const ch = getCharacter(c, characterId);
  const rng = new Rng(hashSeed(seed));
  const perk = <K extends 'startFame' | 'startCash'>(k: K) =>
    ch.perks.filter((p) => p.kind === k).reduce((n, p) => n + ('value' in p ? p.value : 0), 0);
  const s: GameState = {
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
  rollNews(s, c, rng);
  rollOffer(s, c, rng);
  s.rng = rng.state;
  return s;
}

function finish(s: GameState, c: GameContent, rng: Rng, reason: EndReason): void {
  if (reason === 'caught') applyCaught(s, c);
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
    case 'scoutNews':
      expectPhase(s, 'plan');
      invariant(s.day >= newsScout.firstDay && s.scoutedDay !== s.day, 'news scout unavailable');
      spend(s, newsScout.price);
      s.scoutedDay = s.day;
      break;
    case 'choosePlan':
      expectPhase(s, 'plan');
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
      if (escapeQte(s, c, rng, action.hits)) finish(s, c, rng, 'caught');
      break;
    case 'escapeSurrender':
      expectPhase(s, 'escape');
      escapeSurrender(s, c);
      finish(s, c, rng, 'caught');
      break;
    case 'retire':
      expectPhase(s, 'plan', 'shop');
      finish(s, c, rng, 'retired');
      break;
    default: {
      const never: never = action;
      invariant(false, `unknown action ${JSON.stringify(never)}`);
    }
  }

  if (s.phase === 'escape' && !s.escape) s.escape = { step: 'disguise', bonus: 0 };
  s.rng = rng.state;
  return s;
}
