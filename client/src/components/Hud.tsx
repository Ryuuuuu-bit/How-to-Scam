import { useCallback, useEffect, useRef, useState } from 'react';
import { activeFestivals, caseStrength, dateOf, carOf, homeOf, loadoutOf, outfitOf, petOf, raidThreshold, soiBlocker } from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { PhoneSheet } from './PhoneSheet';
import { SoiMap } from './SoiMap';
import { CaseBoard } from './CaseBoard';
import './phone.css';
import './shop.css';
import { content } from '../game/content';
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

/** แถบสถานะมือถือ: สัญญาณตก Heat ขึ้น แบตลดตามวันที่เหลือ */
function PhoneStatus({ state }: { state: GameState }) {
  const date = dateOf(state, state.day);
  const bars = Math.max(0, 4 - Math.floor(state.heat / 25));
  const battery = Math.max(0, Math.round(((state.maxDays - state.day + 1) / state.maxDays) * 100));
  return (
    <div className="phone-status" aria-label={`มือถือ · สัญญาณ ${bars}/4 · แบต ${battery}%`}>
      <span className="phone-clock">{String(date.date).padStart(2, '0')} {monthName(date.month)}</span>
      <span className="phone-carrier">ซอยเน็ต</span>
      <span className="phone-signal" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <i key={n} data-on={n <= bars || undefined} style={{ height: `${n * 3 + 2}px` }} />)}
      </span>
      <span className="phone-battery" data-low={battery <= 15 || undefined} aria-hidden="true">
        <i style={{ width: `${battery}%` }} />
      </span>
      <small>{battery}%</small>
    </div>
  );
}

type App = 'soi' | 'case' | 'gear';

const appIds = content.shopItems.filter((it) => it.line === 'app').map((it) => it.id);

function PhoneDock({ state, open }: { state: GameState; open: (app: App) => void }) {
  if (!state.soi || !state.case) return null;
  const strength = caseStrength(state);
  const threshold = raidThreshold(state);
  const waiting = soiBlocker(state);
  const installed = appIds.filter((id) => (state.upgrades[id] ?? 0) > 0);
  return (
    <nav className="phone-dock" aria-label="แอปในมือถือ">
      <button type="button" onClick={() => open('soi')} data-alert={waiting || undefined}>
        <span className="phone-app-icon app-soi" aria-hidden="true">🗺️</span>
        <span>แผนที่ซอย</span>
        {waiting && <b className="phone-badge">!</b>}
      </button>
      <button type="button" onClick={() => open('case')} data-alert={strength >= threshold - 2 || undefined}>
        <span className="phone-app-icon app-case" aria-hidden="true">📌</span>
        <span>บอร์ดคดี</span>
        <b className="phone-badge" data-hot={strength >= threshold - 2 || undefined}>{strength}</b>
      </button>
      {installed.length > 0 && (
        <button type="button" className="phone-dock-gear" onClick={() => open('gear')} aria-label={`แอปที่ติดตั้ง ${installed.length} แอป`}>
          <span className="phone-gear-stack" aria-hidden="true">
            {installed.slice(0, 3).map((id) => (
              <Art key={id} id={`shop:${id}`} size={26} />
            ))}
          </span>
        </button>
      )}
    </nav>
  );
}

/** บ้าน ชุด สัตว์เลี้ยง รถ ที่ติดมาจากนอกรอบ (โชว์เฉพาะเมื่อมีของ) */
function LoadoutChip({ state }: { state: GameState }) {
  const l = loadoutOf(state.seed);
  if (l.home === 'room' && l.outfit === 'casual' && l.pet === 'none' && l.car === 'none' && !l.reform) return null;
  const fit = outfitOf(state);
  const parts = [
    homeOf(state).name,
    `${fit.name}: ${fit.effect}`,
    l.pet !== 'none' ? `${petOf(state).name}: ${petOf(state).effect}` : '',
    l.car !== 'none' ? `${carOf(state).name}: ${carOf(state).effect}` : '',
    l.reform ? 'ตั้งใจกลับใจ: รายได้ −10%' : '',
  ].filter(Boolean);
  return (
    <span className="loadout-chip ml-auto" title={parts.join(' · ')}>
      <Art id={`home:${l.home}`} size={20} />
      <Art id={`outfit:${l.outfit}`} size={20} />
      {l.pet !== 'none' && <Art id={`pet:${l.pet}`} size={20} />}
      {l.car !== 'none' && <Art id={`car:${l.car}`} size={20} />}
      {l.reform && <Art id="icon:reform" size={20} />}
      <span className="hidden sm:inline">{fit.name}</span>
    </span>
  );
}

export function Hud({ state, dispatch }: { state: GameState; dispatch?: (a: Action) => void }) {
  const date = dateOf(state, state.day);
  const fests = activeFestivals(state, content);
  const [app, setApp] = useState<App | null>(null);
  const close = useCallback(() => setApp(null), []);
  return (
    <header className="game-hud phone-hud sticky top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3" data-cracked={state.heat >= 75 || undefined}>
      <div className="hud-inner mx-auto flex flex-col gap-2">
        <div className="phone-top flex items-center gap-2">
          <OnlineCount />
          {state.soi && <PhoneStatus state={state} />}
          <LoadoutChip state={state} />
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
        <PhoneDock state={state} open={setApp} />
      </div>
      {app === 'soi' && (
        <PhoneSheet title="แผนที่ซอย" app="soi" onClose={close}>
          <SoiMap state={state} />
        </PhoneSheet>
      )}
      {app === 'case' && (
        <PhoneSheet title="บอร์ดคดีของสารวัตรหมูกระทะ" app="case" onClose={close}>
          <CaseBoard state={state} {...(dispatch ? { dispatch } : {})} />
        </PhoneSheet>
      )}
      {app === 'gear' && (
        <PhoneSheet title="แอปที่ติดตั้ง" app="gear" onClose={close}>
          <ul className="gear-list">
            {appIds
              .filter((id) => (state.upgrades[id] ?? 0) > 0)
              .map((id) => {
                const it = content.shopItems.find((x) => x.id === id);
                return (
                  <li key={id}>
                    <Art id={`shop:${id}`} size={52} />
                    <div>
                      <strong>{it ? lt(it.name) : id}</strong>
                      <span>{it ? lt(it.desc) : ''}</span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </PhoneSheet>
      )}
    </header>
  );
}
