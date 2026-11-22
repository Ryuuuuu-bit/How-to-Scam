import type { GameState } from '@hts/shared';
import { audio } from './audio';

/** เลือกเสียงประกอบจากผลของ action ล่าสุด (ไม่มีเสียงพากย์ ตามที่ผู้เล่นขอ) */
export function playCues(state: GameState, previous: GameState): void {
  const r = state.lastResults;
  const has = (k: string) => r.some((x) => x.kind === k);
  const income = r.reduce((n, x) => n + (x.kind === 'resolve' ? (x.dirtyCash ?? 0) : 0), 0);

  if (state.phase === 'escape' && previous.phase !== 'escape')
    return audio.sfx('sfx_siren', 'siren');
  if (state.phase === 'call' && previous.phase !== 'call')
    return audio.sfx('sfx_phone_ring', 'phone');
  if (has('levelUp')) return audio.sfx('sfx_level_up', 'level');
  if (has('missionDone')) return audio.sfx('sfx_achievement', 'level');
  if (state.nextHenchmanId > previous.nextHenchmanId) return audio.play('hire');

  const esc = r.find((x) => x.kind === 'escape');
  if (esc?.success) return audio.sfx('sfx_escape', 'escape');

  const wash = r.find((x) => x.kind === 'launder');
  if (wash) {
    return wash.success
      ? audio.sfx('sfx_launder_ok', 'wash')
      : audio.sfx('sfx_launder_fail', 'bad');
  }
  const call = r.find((x) => x.kind === 'call');
  if (call && !call.success) return audio.sfx('sfx_hangup', 'hangup');

  if (has('news')) audio.sfx('sfx_news', 'news');
  else if (
    state.phase === 'event' &&
    (previous.phase !== 'event' || state.pendingEvents[0] !== previous.pendingEvents[0])
  )
    audio.sfx('sfx_event', 'event');

  if (income >= 20_000) audio.sfx('sfx_coins', 'cash');
  else if (income > 0) audio.sfx('sfx_cash', 'cash');
  else if (r.some((x) => x.success === false)) audio.play('bad');
}
