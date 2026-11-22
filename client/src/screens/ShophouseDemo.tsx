import { useEffect, useRef, useState } from 'react';
import { sceneUrl } from '../assets/art';
import { Art, Button } from '../components/ui';
import './shophouse.css';

type Stage = 'desk' | 'plan' | 'door' | 'rooster' | 'news' | 'ending';
type Point = { x: number; y: number };
const stops = {
  desk: { x: 23, y: 62, label: 'เปิดแฟ้มบนโต๊ะ', symbol: '📁' },
  door: { x: 80, y: 48, label: 'ตามไก่ไปหน้าร้าน', symbol: '🐓' },
  news: { x: 61, y: 83, label: 'อ่านข่าวปากซอย', symbol: '📰' },
};
const next = { desk: 'plan', door: 'rooster', news: 'ending' } as const;
const directions: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const start = { x: 44, y: 78 };
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));

export function ShophouseDemo({ avatar, onBack }: { avatar: string; onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('desk');
  const [caught, setCaught] = useState(false);
  const [point, setPoint] = useState<Point>(start);
  const position = useRef<Point>(start);
  const target = useRef<(Point & { act?: boolean }) | null>(null);
  const floor = useRef<HTMLDivElement>(null);
  const stop = stage === 'desk' || stage === 'door' || stage === 'news' ? stops[stage] : null;
  const go = () => {
    if (stop) {
      target.current = { ...stop, act: true };
      floor.current?.focus({ preventScroll: true });
    }
  };
  useEffect(() => {
    target.current = null;
    if (stage !== 'desk' && stage !== 'door' && stage !== 'news') return;
    const keys = new Set<string>();
    const destination = stops[stage];
    const board = floor.current;
    if (!board) return;
    board.focus({ preventScroll: true });
    const keydown = (e: KeyboardEvent) => {
      if (directions[e.code]) {
        e.preventDefault();
        keys.add(e.code);
        target.current = null;
      }
      if (
        e.code === 'KeyE' &&
        Math.hypot(position.current.x - destination.x, position.current.y - destination.y) < 13
      )
        setStage(next[stage]);
    };
    const keyup = (e: KeyboardEvent) => {
      keys.delete(e.code);
    };
    const clear = () => keys.clear();
    let frame = 0,
      previous = 0;
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      let dx = 0,
        dy = 0;
      const p = position.current,
        goal = target.current;
      const width = board.clientWidth,
        height = board.clientHeight;
      if (goal) {
        dx = ((goal.x - p.x) * width) / 100;
        dy = ((goal.y - p.y) * height) / 100;
      } else
        for (const key of keys) {
          const v = directions[key];
          if (!v) continue;
          dx += v[0];
          dy += v[1];
        }
      const length = Math.hypot(dx, dy);
      const speed = Math.max(155, width * 0.54) * dt;
      if (goal && length <= speed) {
        position.current = { x: goal.x, y: goal.y };
        setPoint(position.current);
        target.current = null;
        if (goal.act) {
          setStage(next[stage]);
          return;
        }
      } else if (length && width && height) {
        position.current = {
          x: clamp(p.x + ((dx / length) * speed * 100) / width, 6, 94),
          y: clamp(p.y + ((dy / length) * speed * 100) / height, 42, 89),
        };
        setPoint(position.current);
      }
      frame = requestAnimationFrame(tick);
    };
    board.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    board.addEventListener('blur', clear);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      board.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      board.removeEventListener('blur', clear);
    };
  }, [stage]);
  const title =
    stage === 'plan'
      ? 'แฟ้มงานเช้านี้'
      : stage === 'rooster'
        ? 'ใครปล่อยไก่หน้าร้าน?'
        : stage === 'ending'
          ? 'ข่าวปากซอย ฉบับเช้า'
          : 'ตึกแถวปากซอย';
  return (
    <main className="shophouse">
      <div className="house-wrap">
        <button className="house-back" onClick={onBack}>
          ← กลับเมนู
        </button>
        <header>
          <small>
            เดโมเดินสำรวจ · {stage === 'news' || stage === 'ending' ? 'เช้าวันถัดไป' : 'วันแรก'}
          </small>
          <h1>{title}</h1>
        </header>
        <div
          ref={floor}
          className="house-floor"
          tabIndex={0}
          role="group"
          aria-label="พื้นที่เดินในตึกแถว"
          onPointerDown={(e) => {
            if (!stop || (e.target as Element).closest('button')) return;
            const r = e.currentTarget.getBoundingClientRect();
            floor.current?.focus({ preventScroll: true });
            target.current = {
              x: clamp(((e.clientX - r.left) * 100) / r.width, 6, 94),
              y: clamp(((e.clientY - r.top) * 100) / r.height, 42, 89),
            };
          }}
        >
          <div
            className="house-window"
            style={{ backgroundImage: 'url(' + sceneUrl('menu') + ')' }}
          />
          <div className="house-shutters" aria-hidden>
            ฐานแก๊ง
          </div>
          {Object.entries(stops).map(([id, s]) => (
            <button
              key={id}
              disabled={stop !== s}
              className="house-stop"
              style={{ left: s.x + '%', top: s.y + '%' }}
              onClick={go}
              aria-label={s.label}
            >
              <span aria-hidden>{id === 'door' && stage !== 'door' ? '🚪' : s.symbol}</span>
              {stop === s && <b>{s.label}</b>}
            </button>
          ))}
          <div className="house-avatar" style={{ left: point.x + '%', top: point.y + '%' }}>
            <Art id={avatar} size={64} />
          </div>
        </div>
        <section className="house-card" aria-live="polite">
          {stop && (
            <>
              <div>
                <strong>
                  {stage === 'desk'
                    ? 'ลูกทีมวางแฟ้มไว้ให้แล้ว'
                    : stage === 'door'
                      ? 'เอ้กอีเอ้ก! ไก่วิ่งออกหน้าร้านไปแล้ว'
                      : 'หนังสือพิมพ์มาส่งแล้ว'}
                </strong>
                <p>แตะพื้นเพื่อเดิน หรือใช้ WASD / ลูกศร แล้วกด E ใกล้จุดหมาย</p>
              </div>
              <Button tone="sun" onClick={go}>
                {stop.label}
              </Button>
            </>
          )}
          {stage === 'plan' && (
            <>
              <div>
                <strong>งานแรก · เปิดร้านรับลูกค้า</strong>
                <p>ที่โต๊ะมีใบสั่งของกับตะกร้าไก่หนึ่งใบ ฝาตะกร้าเหมือนจะปิดไม่สนิท…</p>
              </div>
              <Button tone="sun" onClick={() => setStage('door')}>
                เปิดร้าน
              </Button>
            </>
          )}
          {stage === 'rooster' && (
            <>
              <img src={sceneUrl('ev_runaway_rooster')} alt="เหตุการณ์ไก่หลุดหน้าร้าน" />
              <div>
                <strong>ไก่เลี้ยวเข้าร้านข้าวแกง คนทั้งซอยหันมามอง</strong>
                <p>จะพามันกลับยังไงดี?</p>
              </div>
              <Button
                tone="sun"
                onClick={() => {
                  setCaught(true);
                  setStage('news');
                }}
              >
                โปรยข้าวล่อกลับ
              </Button>
              <Button
                tone="paper"
                onClick={() => {
                  setCaught(false);
                  setStage('news');
                }}
              >
                วิ่งไล่จับ
              </Button>
            </>
          )}
          {stage === 'ending' && (
            <>
              <div>
                <strong>
                  {caught ? 'ไก่คืนรัง ข้าวหน้าร้านหมดหม้อ' : 'ตัวตึงประจำซอย ไก่หนึ่งตัวทำคนทั้งแก๊งวิ่ง'}
                </strong>
                <p>
                  {caught
                    ? 'เจ้าของร้านฝากบิลค่าข้าวมาให้พร้อมหนังสือพิมพ์'
                    : 'ช่างภาพหน้าปากซอยได้ภาพเด็ด ส่วนไก่เดินกลับเอง'}{' '}
                  · จบเดโม
                </p>
              </div>
              <Button
                tone="sun"
                onClick={() => {
                  position.current = start;
                  setPoint(start);
                  setStage('desk');
                }}
              >
                ลองอีกครั้ง
              </Button>
              <Button tone="paper" onClick={onBack}>
                กลับหน้าเมนู
              </Button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
