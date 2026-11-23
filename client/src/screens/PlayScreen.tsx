import { useEffect, useRef, useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { Hud } from '../components/Hud';
import { DayPlanner, lastPlanFrom } from './DayPlanner';
import { ResultSheet } from '../components/ResultSheet';
import { SceneBackdrop } from '../components/SceneBackdrop';
import { careerOrigins } from '@hts/shared';
import { originStories } from '../game/origins';
import { sceneUrl } from '../assets/art';
import { describeResult } from '../game/results';
import type { ResultLine } from '../game/results';
import { audio } from '../audio/audio';
import { playCues } from '../audio/cues';
import { fmt, lt, t } from '../i18n';
import { content, soiSketches } from '@hts/shared/data';
import { CallPhase, EventPhase, InvestPhase, LaunderPhase, ShopPhase } from './phases';
import { EscapePhase } from './EscapePhase';
import { DailyNewspaper } from '../components/DailyNewspaper';
import { Art } from '../components/ui';
import { usePlayerPortrait } from '../game/usePlayerPortrait';
import { MemeSticker } from '../components/MemeSticker';
import { reactionMeme } from '../game/memes';

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
  const portrait = usePlayerPortrait(state.characterId);
  const [dismissedTick, setDismissedTick] = useState<number>();
  const [beforeDecision, setBeforeDecision] = useState<{ cash: number; actionCount: number }>();
  const results = state.lastResults.filter(result =>
    result.kind !== 'news' && !(result.kind === 'event' && soiSketches.some(s => result.textKey?.startsWith(s.id + ':'))));
  const resultLines = results
    .map((result) => describeResult(result, state))
    .filter((line): line is ResultLine => line !== null);
  const bigResult = results.some(({ kind }) =>
    [
      'escape',
      'levelUp',
      'missionDone',
      'missionFail',
      'sting',
      'baited',
      'exposed',
      'ponziCrash',
      'romanceFled',
      'raid',
      'soiShaped',
    ].includes(kind),
  );
  const showResults = bigResult && dismissedTick !== tick && resultLines.length > 0;
  const net =
    beforeDecision &&
    actions.length > beforeDecision.actionCount &&
    results.some(({ kind }) => kind === 'resolve')
      ? state.dirtyCash + state.cleanCash - beforeDecision.cash
      : null;
  const meme = reactionMeme(state, net);
  const sounded = useRef({ tick, state });
  useEffect(() => {
    audio.setDanger(state.heat >= 75 || state.phase === 'escape');
    if (sounded.current.tick === tick) return;
    playCues(state, sounded.current.state);
    sounded.current = { tick, state };
  }, [tick, state]);
  useEffect(() => () => audio.setDanger(false), []);

  const phaseKey = `${state.day}-${state.phase}-${state.pendingEvents[0] ?? ''}-${state.escape?.step ?? ''}`;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phaseKey]);

  const props = {
    state,
    dispatch: (action: Action) => {
      setBeforeDecision({ cash: state.dirtyCash + state.cleanCash, actionCount: actions.length });
      dispatch(action);
    },
  };
  const careerScene = state.pendingEvents[0]?.startsWith('side_') &&
    careerOrigins[state.characterId as keyof typeof careerOrigins];
  const lifeScene = state.phase === 'event' ? content.events.find(ev => ev.id === state.pendingEvents[0])?.illustration?.scene : undefined;
  const scene =
    state.phase === 'event' && state.pendingEvents[0]
      ? (careerScene ? originStories[careerScene].scene : lifeScene ?? `ev_${state.pendingEvents[0]}`)
      : state.phase === 'escape' &&
          state.escape?.routeId &&
          sceneUrl(`escape_${state.escape.routeId}`)
        ? `escape_${state.escape.routeId}`
        : state.phase;
  // ฉากเหตุการณ์/คอลเซ็นเตอร์/หนีตำรวจ เปิดภาพให้เห็นเยอะ หน้าที่เป็นรายการให้เห็นน้อยลง
  const tall = ['event', 'call', 'escape'].includes(state.phase);
  const hasOwnScene = state.phase === 'event' && (Boolean(lifeScene) || state.pendingEvents[0] === 'counter_live' || soiSketches.some(s => s.id === state.pendingEvents[0]));
  return (
    <div className="play-shell relative min-h-dvh">
      <SceneBackdrop id={scene} />
      <Hud state={state} dispatch={props.dispatch} />
      <aside className="scene-caption">
        <span className="eyebrow">HOW TO SCAM / แฟ้มประจำวันที่ {state.day}</span>
        <h1>{state.phase === 'ended' ? '' : t(`phase.${state.phase}`)}</h1>
        <p>
          {lt(content.characters.find((c) => c.id === state.characterId)?.name ?? { th: '' })} ·
          วันนี้จะเอายังไงดี?
        </p>
        <div className="phase-track" aria-label="ลำดับของวัน">
          {(['plan', state.phase === 'call' ? 'call' : 'invest', 'event', 'launder', 'shop',
            ...(state.phase === 'escape' ? ['escape'] as const : [])] as const).map((phase, i) => (
            <span key={phase} aria-current={state.phase === phase ? 'step' : undefined}>
              <b>0{i + 1}</b>
              {t(`phase.${phase}`)}
            </span>
          ))}
        </div>
      </aside>
      <main
        className={`decision-panel relative z-10 ${state.phase === 'plan' ? 'is-planning' : ''}`}
      >
        {!hasOwnScene && !(state.phase === 'escape' && (state.escape?.step === 'custody' || state.escape?.step === 'qte')) && <div className={tall ? 'scene-spacer scene-spacer-tall' : 'scene-spacer'} />}
        <div className="play-heading mb-3 flex items-center gap-3">
          <Art
            id={portrait}
            size={60}
            className="play-portrait shrink-0"
          />
          <DailyNewspaper
            key={`${state.seed}-${state.day}`}
            state={state}
            preview={state.phase === 'plan'}
          />
        </div>
        <div role="status" aria-atomic="true">
          {!bigResult && resultLines.length > 0 && (
            <ul className="play-feedback mb-3 grid gap-2 rounded-xl px-3 py-2 text-sm">
              {resultLines.map((line, i) => (
                <li key={`${i}-${line.title}`} className="flex items-center gap-2">
                  {line.art && <Art id={line.art} size={26} className="shrink-0" />}
                  <div>
                    <strong>{line.title}</strong>
                    {line.body && <p className="text-xs text-[#d6d4dd]">{line.body}</p>}
                  </div>
                </li>
              ))}
              {net !== null && (
                <li className="text-xs text-[#d6d4dd]">
                  เงินเปลี่ยนสุทธิจากจังหวะนี้ {net > 0 ? '+' : net < 0 ? '−' : ''}฿{fmt(Math.abs(net))}
                </li>
              )}
            </ul>
          )}
        </div>
        {meme && !showResults && <MemeSticker meme={meme} />}
        <div key={phaseKey}>
          {state.phase === 'plan' && <DayPlanner {...props} lastPlan={lastPlanFrom(actions)} />}
          {state.phase === 'invest' && <InvestPhase {...props} />}
          {state.phase === 'call' && <CallPhase {...props} />}
          {state.phase === 'event' && <EventPhase {...props} />}
          {state.phase === 'launder' && <LaunderPhase {...props} />}
          {state.phase === 'shop' && <ShopPhase {...props} />}
          {state.phase === 'escape' && <EscapePhase {...props} portrait={portrait} />}
        </div>
      </main>
      {showResults && <ResultSheet lines={resultLines} onClose={() => setDismissedTick(tick)} />}
    </div>
  );
}
