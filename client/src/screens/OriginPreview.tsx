import { useState } from 'react';
import { careerSeedPrefix, newGame, step, type Action, type GameState } from '@hts/shared';
import { soiSketches } from '@hts/shared/data';
import { content } from '../game/content';
import { sceneUrl } from '../assets/art';
import { audio } from '../audio/audio';
import { ClosingEdition } from '../components/ClosingEdition';
import { EndingCard } from '../components/EndingCard';
import { MemeSticker } from '../components/MemeSticker';
import { Art, Button, Panel } from '../components/ui';
import { reactionMeme } from '../game/memes';
import { describeResult } from '../game/results';
import { OriginChat } from './OriginChat';
import { EventPhase } from './phases';
import { SketchCover } from './SoiSketchScene';

const tabs = { origins: 'ภูมิหลังอาชีพ', retirement: 'ฉากเกษียณ', soinews: 'มีมข่าวปากซอย' };
const seed = careerSeedPrefix + 'preview-0';
const retireExamples = [
  ['เปิดไมค์หลังเลิกไลฟ์', 'live_seller'], ['วางมือพร้อมลูกน้องสองคน', 'ex_insurance', 'crew'],
  ['ช่วยตักกะเพราที่ครัวชุมชน', 'ex_banker', 'kitchen'], ['กลับไปเปิดโต๊ะซ่อม', 'phone_tech'],
  ['รับช่วงร้านเกมท้ายซอย', 'gamer_kid'], ['หาที่นอนให้ส้มซ่า', 'orange_cat'],
  ['เริ่มต้นใหม่ตอนสาย ๆ', 'ex_insurance'],
] as const;

export function OriginPreview({ page }: { page: keyof typeof tabs }) {
  const [state, setState] = useState<GameState | null>(null);
  function retire(id: string, example?: 'crew' | 'kitchen') {
    const s = newGame(seed, id, content);
    if (example === 'crew') {
      s.henchmen = ['a', 'b'].map(id => ({ id, skill: 1, loyalty: 80, wage: 100 }));
    }
    if (example === 'kitchen') s.flags.push('soi_served_meals');
    setState(step(s, { t: 'retire' }, content));
  }
  function startNews(id: string) {
    const s = newGame(seed, 'ex_insurance', content);
    setState({ ...s, day: 4, phase: 'event', pendingEvents: [id] });
    audio.play('news');
  }
  function play(action: Action) {
    if (!state) return;
    const next = step(state, action, content);
    if (action.t === 'eventChoice' && soiSketches.some(s => s.id === state.pendingEvents[0])) setState(null);
    else if (action.t === 'replyOrigin') setState({ ...next, day: 3 });
    else if (action.t === 'readOrigin') setState(step(next, { t: 'retire' }, content));
    else setState(next);
  }
  const meme = state && reactionMeme(state, null);
  const report = state?.lastResults.find(r => r.kind === 'event');
  const event = state?.pendingEvents[0];
  return <main className="mx-auto grid max-w-lg gap-4 px-4 pb-8 pt-16">
    <nav aria-label="เลือกเดโม" className="flex flex-wrap gap-2">{Object.entries(tabs).map(([key, label]) =>
      <a href={'?preview=' + key} key={key} aria-current={key === page ? 'page' : undefined}
        className={`rounded-xl border border-white/30 px-3 py-2 text-sm font-bold ${key === page ? 'bg-sun text-ink' : 'text-white'}`}>{label}</a>)}</nav>
    <h1 className="font-display text-2xl font-bold text-white">{tabs[page]}</h1>
    {!state && page === 'origins' && <>
      <p className="text-white">เลือกอาชีพแล้วลองตอบแชต เดโมจะข้ามไปวันที่ 3 ให้เห็นว่าใครทักกลับ</p>
      {content.characters.map(ch => <Button key={ch.id} tone="paper" className="flex items-center gap-3" onClick={() => setState(newGame(seed, ch.id, content))}>
        <Art id={'char:' + ch.id} size={38} />{ch.name.th}</Button>)}
    </>}
    {!state && page === 'retirement' && retireExamples.map(([label, id, example]) =>
      <Button key={label} tone="sun" onClick={() => retire(id, example)}>{label}</Button>)}
    {!state && page === 'soinews' && <div className="sketch-covers">
      {soiSketches.map(sketch => <SketchCover key={sketch.id} sketch={sketch} onOpen={() => startNews(sketch.id)} />)}
    </div>}
    {!state && page === 'soinews' && content.events.filter(e => e.when.careerEdition).map(e =>
      <Button key={e.id} tone="paper" onClick={() => startNews(e.id)}>{e.title.th}</Button>)}
    {state && <>
      {state.end ? <><EndingCard state={state} />{page === 'origins' && <ClosingEdition state={state} />}</>
        : page === 'origins' ? <OriginChat state={state} dispatch={play} />
        : event ? <>{!soiSketches.some(s => s.id === event) && <img src={sceneUrl('ev_' + event)} alt="" className="aspect-video w-full rounded-2xl object-cover" />}<EventPhase state={state} dispatch={play} /></>
        : report && <><Panel>{describeResult(report, state)?.title}</Panel>{meme && <MemeSticker meme={meme} />}</>}
      <Button tone="paper" onClick={() => setState(null)}>กลับไปเลือกใหม่</Button>
    </>}
  </main>;
}
