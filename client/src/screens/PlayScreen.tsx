import { useEffect, useRef, useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { Hud } from '../components/Hud';
import { DayPlanner, lastPlanFrom } from './DayPlanner';
import { ResultSheet } from '../components/ResultSheet';
import { SceneBackdrop } from '../components/SceneBackdrop';
import { describeResult } from '../game/results';
import type { ResultLine } from '../game/results';
import { audio } from '../audio/audio';
import { playCues } from '../audio/cues';
import { lt, t } from '../i18n';
import { content } from '@hts/shared/data';
import { CallPhase, EscapePhase, EventPhase, InvestPhase, LaunderPhase, ShopPhase } from './phases';

export function PlayScreen({
  state,
  tick,
  dispatch,
  actions = [],
}: {
  state: GameState;
  tick: number;
  dispatch: (a: Action) => void;
  actions?: Action[];
}) {
  const [sheet, setSheet] = useState<ResultLine[] | null>(null);
  const soundedTick = useRef(tick);
  const prevHeat = useRef(state.heat);
  useEffect(() => {
    audio.setDanger(state.heat >= 75 || state.phase === 'escape');
    if (soundedTick.current === tick) return;
    soundedTick.current = tick;
    playCues(state, prevHeat.current);
    prevHeat.current = state.heat;
  }, [tick, state]);
  useEffect(() => () => audio.setDanger(false), []);

  // ทุกครั้งที่มี action ใหม่ ถ้ามีผลลัพธ์ก็เด้งแผ่นสรุปขึ้นมา
  useEffect(() => {
    const lines = state.lastResults
      .map((r) => describeResult(r, state))
      .filter((l): l is ResultLine => l !== null);
    setSheet(lines.length > 0 ? lines : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tick]);

  const props = { state, dispatch };
  const scene =
    state.phase === 'event' && state.pendingEvents[0]
      ? `ev_${state.pendingEvents[0]}`
      : state.phase;
  // ฉากเหตุการณ์/คอลเซ็นเตอร์/หนีตำรวจ เปิดภาพให้เห็นเยอะ หน้าที่เป็นรายการให้เห็นน้อยลง
  const tall = ['event', 'call', 'escape'].includes(state.phase);
  return (
    <div className="play-shell relative min-h-dvh">
      <SceneBackdrop id={scene} />
      <Hud state={state} />
      <aside className="scene-caption">
        <span className="eyebrow">HOW TO SCAM / แฟ้มประจำวันที่ {state.day}</span>
        <h1>{state.phase === 'ended' ? '' : t(`phase.${state.phase}`)}</h1>
        <p>
          {lt(content.characters.find((c) => c.id === state.characterId)?.name ?? { th: '' })} ·
          ทุกทางเลือกมีราคา
        </p>
        <div className="phase-track" aria-label="ลำดับของวัน">
          {(['plan', 'invest', 'event', 'launder', 'shop'] as const).map((phase, i) => (
            <span key={phase} aria-current={state.phase === phase ? 'step' : undefined}>
              <b>0{i + 1}</b>
              {t(`phase.${phase}`)}
            </span>
          ))}
        </div>
      </aside>
      <main
        className="decision-panel relative z-10"
        key={`${state.day}-${state.phase}-${state.pendingEvents[0] ?? ''}`}
      >
        <div className={tall ? 'scene-spacer scene-spacer-tall' : 'scene-spacer'} />
        {state.phase === 'plan' && (
          <DayPlanner {...props} lastPlan={lastPlanFrom(actions)} key={state.day} />
        )}
        {state.phase === 'invest' && <InvestPhase {...props} />}
        {state.phase === 'call' && <CallPhase {...props} />}
        {state.phase === 'event' && <EventPhase {...props} />}
        {state.phase === 'launder' && <LaunderPhase {...props} />}
        {state.phase === 'shop' && <ShopPhase {...props} />}
        {state.phase === 'escape' && <EscapePhase {...props} />}
      </main>
      {sheet && <ResultSheet lines={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
