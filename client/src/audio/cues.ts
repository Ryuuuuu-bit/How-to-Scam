import type { GameState } from '@hts/shared';
import { audio } from './audio';

/** เลือกเสียงประกอบจากผลของ action ล่าสุด (ไม่มีเสียงพากย์ ตามที่ผู้เล่นขอ) */
export function playCues(state: GameState): void {
  const r = state.lastResults;
  const has = (k: string) => r.some((x) => x.kind === k);
  const income = r.reduce((n, x) => n + (x.kind === 'resolve' ? (x.dirtyCash ?? 0) : 0), 0);

  if (state.phase === 'escape') return audio.sfx('sfx_siren', 'bad');
  if (has('levelUp')) return audio.sfx('sfx_level_up', 'level');
  if (has('missionDone')) return audio.sfx('sfx_achievement', 'level');

  const esc = r.find((x) => x.kind === 'escape');
  if (esc?.success) return audio.sfx('sfx_escape', 'cash');

  const wash = r.find((x) => x.kind === 'launder');
  if (wash) {
    return wash.success
      ? audio.sfx('sfx_launder_ok', 'cash')
      : audio.sfx('sfx_launder_fail', 'bad');
  }
  const call = r.find((x) => x.kind === 'call');
  if (call && !call.success) return audio.sfx('sfx_hangup', 'bad');

  if (has('news')) audio.sfx('sfx_news');
  if (state.phase === 'event') audio.sfx('sfx_event');

  if (income >= 20_000) audio.sfx('sfx_coins', 'cash');
  else if (income > 0) audio.sfx('sfx_cash', 'cash');
  else if (r.some((x) => x.success === false)) audio.play('bad');
}
