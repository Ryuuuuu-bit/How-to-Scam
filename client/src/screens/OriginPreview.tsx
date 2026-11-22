import { useState } from 'react';
import { newGame, originSeedPrefix, origins, step, type Action, type GameState, type Origin } from '@hts/shared';
import { content } from '@hts/shared/data';
import { Button } from '../components/ui';
import { ClosingEdition } from '../components/ClosingEdition';
import { originStories } from '../game/origins';
import { OriginChat } from './OriginChat';

const previewSeed: Record<Origin, string> = { curry: 'preview-4', arcade: 'preview-2', dorm: 'preview-1' };

export function OriginPreview() {
  const [state, setState] = useState<GameState | null>(null);
  function play(action: Action) {
    if (!state) return;
    const next = step(state, action, content);
    if (action.t === 'replyOrigin') setState({ ...next, day: 3 });
    else setState(step(next, { t: 'retire' }, content));
  }
  return <main className="mx-auto grid max-w-lg gap-4 px-4 pb-8 pt-16">
    <h1 className="font-display text-2xl font-bold text-white">เรื่องประจำซอย</h1>
    {!state ? <>
      <p className="text-white">เลือกภูมิหลังแล้วลองตอบแชต เดโมจะข้ามไปวันที่ 3 ให้เห็นว่าใครทักกลับ</p>
      {origins.map(id => <Button key={id} tone="sun" onClick={() => setState(newGame(originSeedPrefix + previewSeed[id], 'ex_insurance', content))}>{originStories[id].title}</Button>)}
    </> : <>
      {state.end ? <ClosingEdition state={state} /> : <OriginChat state={state} dispatch={play} />}
      <Button tone="paper" onClick={() => setState(null)}>กลับไปเลือกภูมิหลัง</Button>
    </>}
  </main>;
}
