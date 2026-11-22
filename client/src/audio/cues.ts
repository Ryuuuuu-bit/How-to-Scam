import type { GameState } from '@hts/shared';
import { audio } from './audio';

/** เลือกเสียงประกอบ + เสียงพากย์จากผลของ action ล่าสุด */
export function playCues(state: GameState, prevHeat: number): void {
  const r = state.lastResults;
  const has = (k: string) => r.some((x) => x.kind === k);
  const income = r.reduce((n, x) => n + (x.kind === 'resolve' ? (x.dirtyCash ?? 0) : 0), 0);

  if (state.phase === 'escape') {
    audio.sfx('sfx_siren', 'bad');
    audio.voice('vo_police', 0.3);
    return;
  }
  if (has('levelUp')) {
    audio.sfx('sfx_level_up', 'level');
    audio.voice('vo_level_up', 0.5);
    return;
  }
  if (has('missionDone')) {
    audio.sfx('sfx_achievement', 'level');
    audio.voice('vo_mission', 0.4);
    return;
  }
  const esc = r.find((x) => x.kind === 'escape');
  if (esc?.success) {
    audio.sfx('sfx_escape', 'cash');
    audio.voice('vo_escaped', 0.3);
    return;
  }
  const wash = r.find((x) => x.kind === 'launder');
  if (wash) {
    if (wash.success) {
      audio.sfx('sfx_launder_ok', 'cash');
      if (state.day % 3 === 0) audio.voice('vo_launder_ok', 0.4);
    } else {
      audio.sfx('sfx_launder_fail', 'bad');
      audio.voice('vo_launder_fail', 0.4);
    }
    return;
  }
  const call = r.find((x) => x.kind === 'call');
  if (call && !call.success) {
    audio.sfx('sfx_hangup', 'bad');
    return;
  }
  if (has('news')) audio.sfx('sfx_news');
  if (state.phase === 'event') audio.sfx('sfx_event');

  if (income >= 20_000) {
    audio.sfx('sfx_coins', 'cash');
    audio.voice('vo_cash', 0.3);
  } else if (income > 0) {
    audio.sfx('sfx_cash', 'cash');
  } else if (r.some((x) => x.success === false)) {
    audio.play('bad');
  }

  if (prevHeat < 75 && state.heat >= 75) audio.voice('vo_heat', 0.8);
  else if (state.phase === 'plan' && state.day > 1 && state.day % 5 === 1)
    audio.voice('vo_new_day');
}
