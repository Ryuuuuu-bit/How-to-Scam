import { useMemo, useRef, useState } from 'react';
import type { GameState } from '@hts/shared';
import { buildDocumentary } from '../game/documentary';
import './documentary.css';

/** สารคดีชีวิตหลังจบรอบ: ตัดต่อจากสิ่งที่เกิดขึ้นจริงในรอบนี้ */
export function LifeDocumentary({ state }: { state: GameState }) {
  const slides = useMemo(() => buildDocumentary(state), [state]);
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const slide = slides[i];
  if (!slide) return null;
  const go = (n: number) => setI(Math.max(0, Math.min(slides.length - 1, n)));
  return (
    <section
      className="life-doc anim-rise-in"
      aria-roledescription="สไลด์สารคดี"
      aria-label="สารคดีชีวิตรอบนี้"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        if (e.key === 'ArrowLeft') go(i - 1);
      }}
      onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const start = touch.current;
        const end = e.changedTouches[0]?.clientX;
        if (start === null || end === undefined) return;
        if (end - start < -40) go(i + 1);
        if (end - start > 40) go(i - 1);
        touch.current = null;
      }}
    >
      <div className="life-doc-progress" aria-hidden="true">
        {slides.map((s, n) => <span key={s.id} data-done={n < i || undefined} data-now={n === i || undefined} />)}
      </div>
      <article key={slide.id} className="life-doc-slide" data-tone={slide.tone} aria-live="polite">
        {slide.image && <img src={slide.image} alt="" className="life-doc-image" />}
        <div className="life-doc-shade" />
        <div className="life-doc-copy">
          <span className="life-doc-kicker">{slide.kicker}</span>
          <h2>{slide.headline}</h2>
          <p>{slide.body}</p>
        </div>
      </article>
      <div className="life-doc-nav">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="ตอนก่อนหน้า">‹</button>
        <span>ตอน {i + 1}/{slides.length}</span>
        <button type="button" onClick={() => go(i + 1)} disabled={i === slides.length - 1} aria-label="ตอนถัดไป">›</button>
      </div>
    </section>
  );
}
