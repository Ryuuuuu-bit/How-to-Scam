import { useEffect } from 'react';
import { careerTracks } from '@hts/shared';
import type { GameState } from '@hts/shared';
import { day30Ending } from '@hts/shared/data';
import { content } from '../game/content';
import { sceneUrl } from '../assets/art';
import { audio } from '../audio/audio';
import { lt } from '../i18n';
import { Art, Panel } from './ui';

export function EndingCard({ state, portrait = 'char:' + state.characterId }: { state: GameState; portrait?: string }) {
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
  const character = content.characters.find(c => c.id === state.characterId);
  const future = state.end?.reason === 'survived' ? day30Ending(state.cleanCash) : undefined;
  return <Panel tone="sun" className="anim-rise-in text-center">
    <div className="relative">
      {scene ? <img src={scene} alt="" className="anim-scene-in aspect-[4/3] w-full rounded-2xl border-[3px] border-ink object-cover object-top" />
        : <Art id={'ending:' + ending.id} size={96} className="mx-auto" />}
    </div>
    {character && <div className="mx-auto mt-2 inline-flex max-w-full items-center gap-2 rounded-2xl border-2 border-ink bg-paper py-1 pl-2 pr-3 text-left text-sm font-bold text-ink">
      <Art id={portrait} size={42} className="h-11 w-11 shrink-0" />
      <span><small className="block text-ink-soft">ตัวละครของคุณ</small>{lt(character.name)}</span>
    </div>}
    <h2 className="mt-3 text-2xl font-semibold">{lt(ending.title)}</h2>
    <p className="mt-2 text-left leading-relaxed">{lt(ending.body)}</p>
    {Object.entries(state.careers ?? {}).map(([id, career]) => {
      const path = careerTracks[id]?.[career.branch];
      return path && <div key={id} className="mt-3 rounded-xl bg-white p-3 text-left text-ink">
        <strong>{path.title}</strong><p>{career.finale ? path.finale : path.commission}</p>
        {career.finale && <small>{career.finale === 'credit' ? 'ยกเครดิตให้คนในซอย' : 'รับค่าตัวปิดงาน'}</small>}
      </div>;
    })}
    {future && <div className="mt-4 rounded-2xl bg-paper p-3 text-left text-ink">
      <strong>รอดครบ {state.maxDays} วัน · เงินสะอาด ฿{state.cleanCash.toLocaleString('th-TH')}</strong>
      {future.id !== ending.id && <><h3 className="mt-2 font-bold">{lt(future.title)}</h3><p>{lt(future.body)}</p></>}
    </div>}
  </Panel>;
}
