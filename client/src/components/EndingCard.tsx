import { useEffect } from 'react';
import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { sceneUrl } from '../assets/art';
import { audio } from '../audio/audio';
import { lt } from '../i18n';
import { Art, Panel } from './ui';

export function EndingCard({ state }: { state: GameState }) {
  const ending = content.endings.find(e => e.id === state.end?.endingId);
  const life = ending?.when.retirementLife;
  useEffect(() => {
    if (!life) return;
    audio.setScene('focus');
    audio.play(life === 'radio' || life === 'arcade' ? 'news' : 'hire');
    return () => audio.setScene('normal');
  }, [life]);
  if (!ending) return null;
  const scene = sceneUrl('end_' + ending.id);
  return <Panel tone="sun" className="anim-rise-in text-center">
    <div className="relative">
      {scene ? <img src={scene} alt="" className="anim-scene-in aspect-[4/3] w-full rounded-2xl border-[3px] border-ink object-cover object-top" />
        : <Art id={'ending:' + ending.id} size={96} className="mx-auto" />}
      {life && <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full border-2 border-ink bg-paper py-1 pl-1 pr-3 text-sm font-bold text-ink">
        <Art id={'char:' + state.characterId} size={32} /> หลังวางมือ
      </div>}
    </div>
    <h2 className="mt-3 text-2xl font-semibold">{lt(ending.title)}</h2>
    <p className="mt-2 text-left leading-relaxed">{lt(ending.body)}</p>
  </Panel>;
}
