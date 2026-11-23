import { content } from '../data';
import { currentOffer, escapeOf, newGame, step, unlockedMethods } from '../src';
import type { Action, GameState } from '../src';

/** ตอบเรื่องในซอยที่ต้องตัดสินใจก่อนเริ่มงาน (รุ่น 1.0) */
export function soiAction(s: GameState): Action | null {
  if (s.phase !== 'plan') return null;
  if (s.soi?.pendingShape) return { t: 'shapePlace', place: s.soi.pendingShape, form: s.day % 2 ? 'patron' : 'show' };
  if (s.soi?.appointment?.day === s.day) return { t: 'appointment', npc: s.soi.appointment.npcs[0] };
  return null;
}

/** บอทเล่นอัตโนมัติแบบตายตัว (ไม่มีสุ่มของตัวเอง) ใช้ทดสอบทั้งรอบ */
export function botAction(s: GameState): Action {
  const money = s.dirtyCash + s.cleanCash;
  switch (s.phase) {
    case 'plan': {
      const soi = soiAction(s);
      if (soi) return soi;
      if (s.day === s.maxDays && s.cleanCash > 0 && s.heat > 90) return { t: 'retire' };
      if (s.heat > 85) return { t: 'choosePlan', methodId: null };
      const options = unlockedMethods(s, content).filter((m) => m.cost <= money);
      if (options.length === 0) return { t: 'choosePlan', methodId: null };
      // สลับวิธีตามวัน เพื่อให้ทดสอบหลายกลไก
      const m = options[s.day % options.length];
      return { t: 'choosePlan', methodId: m?.id ?? null };
    }
    case 'invest': {
      const bought = s.dailyItems['ads'] ?? 0;
      const banned = currentOffer(s, content)?.ban?.includes('ads') ?? false;
      if (bought === 0 && money > 10_000 && s.todayMethodId && !banned)
        return { t: 'invest', itemId: 'ads' };
      return { t: 'confirmInvest' };
    }
    case 'call':
      return { t: 'callPitch', pitchId: s.call?.pitchIds[0] ?? '' };
    case 'event':
      return { t: 'eventChoice', choiceIdx: 0 };
    case 'launder':
      return { t: 'launder', cardId: s.launderOffer[0] ?? null };
    case 'shop':
      return { t: 'endDay' };
    case 'escape': {
      const e = escapeOf(s);
      if (e.step === 'disguise') return { t: 'escapeDisguise', id: 'none' };
      if (e.step === 'route') return { t: 'escapeRoute', id: 'market' };
      if (e.step === 'event') return { t: 'escapeEvent', choiceIdx: 1 };
      if (e.step === 'bribe') return { t: 'escapeBribe', pay: false };
      return { t: 'escapeQte', hits: 3 };
    }
    case 'ended':
      throw new Error('game ended');
  }
}

export function autoPlay(seed: string, characterId = 'ex_insurance') {
  let s = newGame(seed, characterId, content);
  const actions: Action[] = [];
  for (let i = 0; i < 5_000 && s.phase !== 'ended'; i++) {
    const a = botAction(s);
    actions.push(a);
    s = step(s, a, content);
  }
  return { state: s, actions };
}
