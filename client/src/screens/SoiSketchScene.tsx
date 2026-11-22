import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SoiSketch } from '@hts/shared/data';
import { sceneUrl } from '../assets/art';
import { audio } from '../audio/audio';
import './soi-sketch.css';

export function SketchCover({ sketch, onOpen }: { sketch: SoiSketch; onOpen: () => void }) {
  return <button type="button" className="sketch-cover" data-show={sketch.id} onClick={onOpen}>
    <img src={sceneUrl('ev_' + sketch.id)} alt="" />
    <span><small>{sketch.host}</small><strong>{sketch.title}</strong></span>
  </button>;
}

export function SoiSketchScene({ sketch, onFinish }: { sketch: SoiSketch; onFinish: (choice: number) => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const completed = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  const choice = chosen === null ? null : sketch.choices[chosen];

  useEffect(() => {
    audio.setScene(sketch.id === 'sketch_dinner' ? 'focus' : 'live');
    return () => audio.setScene('normal');
  }, [sketch.id]);
  useEffect(() => {
    if (chosen !== null) transcript.current?.focus({ preventScroll: true });
  }, [chosen]);

  function select(index: number) {
    setChosen(index);
    if (sketch.id === 'sketch_host' && index === 0) audio.play('phone');
    else audio.sfx('sfx_card_flip', 'paper');
  }
  function finish() {
    if (chosen === null || completed.current) return;
    completed.current = true;
    onFinish(chosen);
  }

  return <section className="soi-sketch" data-show={sketch.id} aria-labelledby="sketch-title">
    <header className="sketch-hero">
      <img className="sketch-photo" src={sceneUrl('ev_' + sketch.id)} alt="" />
      <span className="sketch-channel">{sketch.channel}</span>
      <div className="sketch-headline"><span>{sketch.host}</span><h2 id="sketch-title">{sketch.title}</h2></div>
    </header>
    <div className="sketch-page">
      {!choice ? <>
        <p className="sketch-setup">{sketch.setup}</p>
        <div className="sketch-quote"><small>{sketch.opening.speaker}</small><p>{sketch.opening.text}</p></div>
        <div className="sketch-controls">
          {sketch.choices.map((c, i) => <button key={c.label} type="button" onClick={() => select(i)}>
            {c.label}<span aria-hidden="true">↗</span>
          </button>)}
        </div>
      </> : <>
        <div className="sketch-thread" aria-label="บทสนทนาหลังเลือก" tabIndex={-1} ref={transcript}>
          {choice.replies.map((line, i) => {
            const beat = choice.replies[0]?.recall && i === 2 ? 2.6 : i * 0.46;
            return <div key={i} className="sketch-bubble" data-side={line.speaker === choice.replies[0]?.speaker ? 'lead' : 'reply'}
              style={{ '--beat': beat + 's' } as CSSProperties}>
              <small>{line.speaker}</small>
              {line.recall ? <div className="sketch-recall">
                <span>{line.text}</span><em>{line.speaker}ยกเลิกข้อความ</em>
              </div> : <p>{line.text}</p>}
            </div>;
          })}
        </div>
        <div className="sketch-finish"><span>{choice.stat === 'fame' ? 'ชื่อเสียง' : 'กรรมดี'} +{choice.gain}</span>
          <button type="button" onClick={finish}>เล่นต่อ <span aria-hidden="true">→</span></button>
        </div>
      </>}
    </div>
  </section>;
}
