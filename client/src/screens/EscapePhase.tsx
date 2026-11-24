import { carOf, homeOf } from '@hts/shared';
import { useEffect, useRef, useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { bribeCost, escapeChance, escapeOf } from '@hts/shared';
import { content } from '@hts/shared/data';
import { lt, t } from '../i18n';
import { Art, Button, Chip, Panel } from '../components/ui';
import { CustodyScene } from './CustodyScene';
import { audio } from '../audio/audio';

interface Props {
  state: GameState;
  dispatch: (a: Action) => void;
  portrait?: string | undefined;
}

const money = (s: GameState) => s.dirtyCash + s.cleanCash;
const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

/** โหมดหนีตำรวจ: ปลอมตัว → ที่หนี → เหตุการณ์ → ส่วย → QTE */
export function EscapePhase({ state, dispatch, portrait }: Props) {
  const e = escapeOf(state);
  const steps = ['disguise', 'route', 'event', 'bribe', 'qte'] as const;
  if (e.step === 'custody') return <CustodyScene state={state} dispatch={dispatch} portrait={portrait} />;
  const activeStep = steps.indexOf(e.step);
  return (
    <div className="flex flex-col gap-3 text-ink">
      <div className="flex items-center gap-2 rounded-2xl border-[3px] border-ink bg-paper p-2 shadow-pop-sm">
        <Art id="icon:police" size={48} className="anim-shake shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight font-semibold text-danger">
            {t('escape.title')}
          </div>
          <div className="text-xs text-ink-soft">{t(`escape.step.${e.step}`)}</div>
        </div>
        <Chip className="shrink-0">
          {t('escape.chance', { n: e.routeId ? escapeChance(state, content) : '?' })}
        </Chip>
      </div>
      <div className="flex gap-1" aria-label={t('escape.title')}>
        {steps.map((st, i) => (
          <div
            key={st}
            className={`h-2 flex-1 rounded-full border border-ink ${
              activeStep >= i ? 'bg-danger' : 'bg-paper'
            }`}
          />
        ))}
      </div>
      {e.step === 'disguise' && <DisguiseStep state={state} dispatch={dispatch} />}
      {e.step === 'route' && <RouteStep state={state} dispatch={dispatch} />}
      {e.step === 'event' && <EventStep state={state} dispatch={dispatch} />}
      {e.step === 'bribe' && <BribeStep state={state} dispatch={dispatch} />}
      {e.step === 'qte' && <QteStep state={state} dispatch={dispatch} />}
      <button
        type="button"
        className="mx-auto mt-1 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-semibold text-ink shadow-pop-sm"
        onClick={() => {
          if (window.confirm(t('escape.surrenderConfirm'))) dispatch({ t: 'escapeSurrender', custody: true });
        }}
      >
        🙇 {t('escape.surrender')}
      </button>
    </div>
  );
}

function DisguiseStep({ state, dispatch }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {content.disguises.map((d) => {
        const can = money(state) >= d.cost;
        return (
          <button
            key={d.id}
            type="button"
            disabled={!can}
            onClick={() => dispatch({ t: 'escapeDisguise', id: d.id })}
            className="anim-rise-in flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-3 text-left shadow-pop-sm transition active:translate-y-0.5 disabled:opacity-45"
          >
            <Art id={`disguise:${d.id}`} size={56} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display leading-tight font-semibold">{lt(d.name)}</div>
              <div className="text-xs text-ink-soft">{lt(d.desc)}</div>
              <div className="mt-1 text-xs font-semibold text-clean">
                +{d.bonus}%
                {d.goodFor.length > 0 &&
                  ` · ${t('escape.goodFor', {
                    n: d.goodBonus,
                    where: d.goodFor
                      .map((r) => lt(content.routes.find((x) => x.id === r)?.name ?? { th: r }))
                      .join(', '),
                  })}`}
              </div>
            </div>
            <Chip className="shrink-0">{d.cost ? baht(d.cost) : t('escape.free')}</Chip>
          </button>
        );
      })}
    </div>
  );
}

function RouteStep({ state, dispatch }: Props) {
  const e = escapeOf(state);
  const d = content.disguises.find((x) => x.id === e.disguiseId);
  return (
    <div className="flex flex-col gap-2">
      {content.routes.map((r) => {
        const can = money(state) >= r.cost;
        const match = d?.goodFor.includes(r.id);
        return (
          <button
            key={r.id}
            type="button"
            disabled={!can}
            onClick={() => dispatch({ t: 'escapeRoute', id: r.id })}
            className={`anim-rise-in flex items-center gap-3 rounded-2xl border-2 border-ink p-3 text-left shadow-pop-sm transition active:translate-y-0.5 disabled:opacity-45 ${match ? 'bg-sun' : 'bg-paper'}`}
          >
            <Art id={`route:${r.id}`} size={56} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display leading-tight font-semibold">{lt(r.name)}</div>
              <div className="text-xs text-ink-soft">{lt(r.desc)}</div>
              <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-semibold">
                <span>{t('escape.base', { n: r.baseChance })}</span>
                <span className="text-danger">{t('escape.heatAfter', { n: Math.max(0, r.heatAfter - homeOf(state).escapeHeat - (carOf(state).escapeHeat ?? 0)) })}</span>
                <span>{r.hideDays ? t('escape.hide', { n: r.hideDays }) : t('escape.noHide')}</span>
                {match && (
                  <span className="text-clean">{t('escape.match', { n: d?.goodBonus ?? 0 })}</span>
                )}
              </div>
            </div>
            <Chip className="shrink-0">{r.cost ? baht(r.cost) : t('escape.free')}</Chip>
          </button>
        );
      })}
    </div>
  );
}

function EventStep({ state, dispatch }: Props) {
  const e = escapeOf(state);
  const ev = content.routes.find((r) => r.id === e.routeId)?.events.find((x) => x.id === e.eventId);
  if (!ev) return null;
  return (
    <Panel className="anim-rise-in">
      <p className="font-display mb-3 text-lg leading-snug">{lt(ev.text)}</p>
      <div className="flex flex-col gap-2">
        {ev.choices.map((ch, i) => (
          <Button
            key={i}
            tone="paper"
            block
            disabled={!!ch.cost && money(state) < ch.cost}
            onClick={() => dispatch({ t: 'escapeEvent', choiceIdx: i })}
            className="text-left"
          >
            {lt(ch.text)}
            {ch.cost ? ` (${baht(ch.cost)})` : ''}
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function BribeStep({ state, dispatch }: Props) {
  const e = escapeOf(state);
  const ev = content.routes.find((r) => r.id === e.routeId)?.events.find((x) => x.id === e.eventId);
  const ch = ev?.choices[e.eventChoice ?? -1];
  const cost = bribeCost(state, content);
  return (
    <>
      {ch && (
        <Panel className="anim-pop">
          <div className="text-sm">{lt(ch.result)}</div>
          <div
            className={`mt-1 text-sm font-semibold ${ch.chance >= 0 ? 'text-clean' : 'text-danger'}`}
          >
            {t('escape.delta', { n: ch.chance >= 0 ? `+${ch.chance}` : ch.chance })}
          </div>
        </Panel>
      )}
      <Panel className="anim-rise-in">
        <div className="mb-2 flex items-center gap-2">
          <Art id="icon:bribe" size={52} className="shrink-0" />
          <p className="font-display leading-snug">{t('escape.bribeBody')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            tone="sun"
            block
            disabled={money(state) < cost}
            onClick={() => dispatch({ t: 'escapeBribe', pay: true })}
          >
            {t('escape.bribePay', { n: baht(cost) })}
          </Button>
          <Button tone="paper" block onClick={() => dispatch({ t: 'escapeBribe', pay: false })}>
            {t('escape.bribeSkip')}
          </Button>
        </div>
      </Panel>
    </>
  );
}

const QTE_MS = 850;

function QteStep({ state, dispatch }: Props) {
  useEffect(() => {
    audio.setScene('chase');
    return () => audio.setScene('normal');
  }, []);
  const e = escapeOf(state);
  const total = content.config.escape.qteTargets;
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready');
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const hitRef = useRef(false);

  useEffect(() => {
    if (phase !== 'run') return;
    if (idx >= total) {
      setPhase('done');
      return;
    }
    hitRef.current = false;
    setPos({ x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 });
    const id = window.setTimeout(() => setIdx((i) => i + 1), QTE_MS);
    return () => window.clearTimeout(id);
  }, [phase, idx, total]);

  const tap = () => {
    if (hitRef.current) return;
    hitRef.current = true;
    setHits((h) => h + 1);
    setIdx((i) => i + 1);
  };

  return (
    <>
      {e.bribe && e.bribe !== 'none' && (
        <Panel className="anim-pop">
          <div
            className={`text-sm font-semibold ${e.bribe === 'good' ? 'text-clean' : 'text-danger'}`}
          >
            {t(`escape.bribe_${e.bribe}`)}
          </div>
        </Panel>
      )}
      <Panel className="anim-rise-in">
        <h2 className="font-display mb-1 text-xl font-bold">วิ่งตามส้ม!</h2>
        <p className="mb-2 text-sm">ไซเรนดังลั่นซอย แต่ส้มยังแวะทุกแผง! แตะตัวแมวให้ทัน {total} จังหวะ ยิ่งเจอหลายครั้ง โอกาสหนีสำเร็จยิ่งสูง</p>
        <div className="chase-stage relative h-64 overflow-hidden rounded-2xl border-2 border-ink">
          {phase === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button tone="danger" onClick={() => { audio.sfx('sfx_chase', 'siren'); setPhase('run'); }}>
                {t('escape.qteStart')}
              </Button>
            </div>
          )}
          {phase === 'run' && idx < total && (
            <button
              autoFocus
              type="button"
              aria-label={t('escape.qteTap')}
              onPointerDown={tap}
              onClick={(event) => { if (event.detail === 0) tap(); }}
              className="anim-pop absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-danger text-2xl shadow-pop-sm"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <Art id="char:orange_cat" size={48} />
            </button>
          )}
          {phase === 'done' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/80">
              <div className="font-display text-2xl font-semibold">
                {t('escape.qteResult', { n: hits, total })}
              </div>
              <div className="text-sm">
                {t('escape.chance', { n: escapeChance(state, content, hits) })}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 rounded-full border border-ink bg-paper px-2 text-xs font-semibold">
            {Math.min(idx, total)}/{total} · ✓{hits}
          </div>
        </div>
        <Button
          tone="danger"
          block
          className="mt-3 text-xl"
          disabled={phase !== 'done'}
          onClick={() => dispatch({ t: 'escapeQte', hits, custody: true })}
        >
          {t('escape.run')}
        </Button>
      </Panel>
    </>
  );
}
