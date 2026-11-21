import { useEffect, useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { Hud } from '../components/Hud';
import { ResultSheet } from '../components/ResultSheet';
import { SceneBackdrop } from '../components/SceneBackdrop';
import { describeResult } from '../game/results';
import type { ResultLine } from '../game/results';
import {
  CallPhase,
  EscapePhase,
  EventPhase,
  InvestPhase,
  LaunderPhase,
  PlanPhase,
  ShopPhase,
} from './phases';

export function PlayScreen({
  state,
  tick,
  dispatch,
}: {
  state: GameState;
  tick: number;
  dispatch: (a: Action) => void;
}) {
  const [sheet, setSheet] = useState<ResultLine[] | null>(null);

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
    <div className="relative min-h-dvh">
      <SceneBackdrop id={scene} />
      <Hud state={state} />
      <main
        className="relative z-10 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),24px)]"
        key={`${state.day}-${state.phase}-${state.pendingEvents[0] ?? ''}`}
      >
        <div className={tall ? 'h-[30vh]' : 'h-[12vh]'} />
        {state.phase === 'plan' && <PlanPhase {...props} />}
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
