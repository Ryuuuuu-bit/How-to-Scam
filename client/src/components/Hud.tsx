import { useEffect, useRef, useState } from 'react';
import { activeFestivals, dateOf } from '@hts/shared';
import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt, monthName, t } from '../i18n';
import { Art } from './ui';
import { OnlineCount } from './OnlineCount';

/** ตัวเลขไหลขึ้น/ลงแบบนับ + ตัวเลขลอยบอกส่วนต่าง */
function useAnimatedValue(target: number, duration = 650) {
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const t0 = performance.now();
    let raf = 0;
    const tickFn = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tickFn);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tickFn);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration]);
  return shown;
}

interface Float {
  id: number;
  delta: number;
}

function useDeltas(value: number) {
  const prev = useRef(value);
  const [floats, setFloats] = useState<Float[]>([]);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const delta = value - prev.current;
    prev.current = value;
    if (delta === 0) return;
    const id = performance.now() + Math.random();
    setFloats((f) => [...f, { id, delta }]);
    setBump((b) => b + 1);
    const timer = setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
    return () => clearTimeout(timer);
  }, [value]);
  return { floats, bump };
}

function MoneyStat({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: string;
  label: string;
  value: number;
  colorClass: string;
}) {
  const shown = useAnimatedValue(value);
  const { floats, bump } = useDeltas(value);
  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border-2 border-ink bg-white px-2 py-1">
      <Art id={icon} size={28} className={bump ? 'anim-pop' : ''} key={bump} />
      <div className="min-w-0">
        <div className="text-[10px] leading-tight text-ink-soft">{label}</div>
        <div
          className={`font-display truncate text-base leading-tight font-semibold ${colorClass}`}
        >
          ฿{fmt(shown)}
        </div>
      </div>
      {floats.map((f) => (
        <span
          key={f.id}
          className={`anim-float-up font-display pointer-events-none absolute top-0 left-1/2 text-sm font-bold whitespace-nowrap ${f.delta > 0 ? 'text-clean' : 'text-danger'}`}
        >
          {f.delta > 0 ? '+' : '−'}฿{fmt(Math.abs(f.delta))}
        </span>
      ))}
    </div>
  );
}

export function HeatBar({ heat }: { heat: number }) {
  const shown = useAnimatedValue(heat, 500);
  const { floats, bump } = useDeltas(heat);
  const rising = floats.some((f) => f.delta > 0);
  const hot = heat >= 75;
  return (
    <div className={`relative ${rising ? 'anim-shake' : ''}`} key={rising ? bump : 'still'}>
      <div className="flex items-start gap-1.5">
        <Art id="icon:heat" size={26} className={hot ? 'anim-pop' : ''} />
        <div
          role="meter" aria-label="ระดับการถูกจับตา" aria-valuemin={0} aria-valuemax={100} aria-valuenow={heat}
          className={`relative mt-0.5 h-5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white ${hot ? 'anim-heat-glow' : ''}`}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${shown}%`,
              background:
                'linear-gradient(90deg, #22c3a6 0%, #ffd23f 45%, #ff8c42 70%, #e63946 100%)',
              backgroundSize: `${10000 / Math.max(shown, 1)}% 100%`,
            }}
          />
          <span className="font-display absolute inset-0 flex items-center justify-center text-xs font-semibold">
            {t('hud.heat')} {Math.round(shown)}/100{hot ? ' · เสี่ยงสูง' : ''}
          </span>
        </div>
        <details className="heat-help shrink-0">
          <summary className="cursor-pointer text-xs text-[#f7f4eb]" aria-label="Heat คืออะไร?">
            ?
          </summary>
          <p className="mt-1 max-w-44 rounded-lg bg-paper p-2 text-xs text-ink">
            Heat คือระดับการถูกจับตา เมื่อถึง 100 จะเข้าสู่ฉากหนีตำรวจ วันนี้พักได้เพื่อลด Heat
          </p>
        </details>
      </div>
      {floats
        .filter((f) => f.delta > 0)
        .map((f) => (
          <span
            key={f.id}
            className="anim-float-up font-display pointer-events-none absolute top-0 left-1/2 text-sm font-bold text-danger"
          >
            +{f.delta} 🔥
          </span>
        ))}
    </div>
  );
}

export function Hud({ state }: { state: GameState }) {
  const date = dateOf(state, state.day);
  const fests = activeFestivals(state, content);
  return (
    <header className="game-hud sticky top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3">
      <div className="hud-inner mx-auto flex flex-col gap-2">
        <div className="flex">
          <OnlineCount />
        </div>
        <div className="hud-meta font-display flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1">
            <Art id="icon:day" size={20} />
            {t('hud.day', { day: state.day, max: state.maxDays })}
            <span className="hud-date text-ink-soft">
              · {date.date} {monthName(date.month)}
            </span>
          </span>
          <span className="flex items-center gap-2 text-ink-soft">
            <span>{t('hud.level', { level: state.gangLevel })}</span>
            <span className="flex items-center gap-0.5">
              <Art id="icon:fame" size={18} />
              {state.fame}
            </span>
            {state.henchmen.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Art id="icon:henchman" size={18} />
                {state.henchmen.length}
              </span>
            )}
          </span>
        </div>
        <div className="hud-money flex gap-1.5">
          <MoneyStat
            icon="icon:dirty"
            label={t('hud.dirty')}
            value={state.dirtyCash}
            colorClass="text-dirty"
          />
          <MoneyStat
            icon="icon:clean"
            label={t('hud.clean')}
            value={state.cleanCash}
            colorClass="text-clean"
          />
        </div>
        <HeatBar heat={state.heat} />
        {fests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fests.map((f) => (
              <span
                key={f.id}
                className="font-display flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-2 text-xs"
              >
                <Art id="icon:festival" size={16} />
                {lt(f.name)}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
