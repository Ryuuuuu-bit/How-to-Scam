import { useState } from 'react';
import type { Action, GameState, ScamMethod } from '@hts/shared';
import {
  activeFestivals,
  choiceAvailable,
  currentNews,
  launderSuccessPct,
  methodBlock,
  perksOfKind,
  ponziCrashPct,
  priceOf,
} from '@hts/shared';
import { content } from '@hts/shared/data';
import { lt, t } from '../i18n';
import { Art, Button, Chip, Panel, ScreenTitle } from '../components/ui';
import { ConfirmPopup } from '../components/PopupControls';

interface PhaseProps {
  state: GameState;
  dispatch: (a: Action) => void;
}

const money = (s: GameState) => s.dirtyCash + s.cleanCash;

/** ข่าวประจำสัปดาห์ แสดงบนหน้าวางแผน */
export function NewsCard({ state, compact = false }: { state: GameState; compact?: boolean }) {
  const n = currentNews(state, content);
  if (!n) return null;
  if (compact) {
    const signed = (pct: number) => `${pct > 0 ? '+' : ''}${pct}%`;
    const effects = n.modifiers.map(({ target, methodId, pct }) => {
      const method = content.methods.find(({ id }) => id === methodId);
      return `${target === 'income' ? 'รายได้' : 'Heat'} ${signed(pct)}${method ? ` · ${lt(method.name)}` : ''}`;
    });
    if (n.launderSuccessPct) {
      const change = n.launderSuccessPct;
      effects.push(`โอกาสฟอกสำเร็จ ${change > 0 ? '+' : ''}${change} จุดเปอร์เซ็นต์`);
    }
    if (n.victimWealthPct) effects.push(`เงินของคนรับสาย ${signed(n.victimWealthPct)}`);
    if (!effects.length) return null;
    return (
      <div className="play-feedback mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
        <Art id="icon:news" size={24} className="shrink-0" />
        <div>
          <span className="block text-[#d6d4dd]">
            ผลจากข่าวประจำสัปดาห์ · {t('news.until', { n: state.news?.untilDay ?? 0 })}
          </span>
          <strong>{effects.join(' / ')}</strong>
        </div>
      </div>
    );
  }
  return (
    <div className="anim-rise-in mb-3 flex items-start gap-2 rounded-2xl border-[3px] border-ink bg-white p-2.5 text-ink shadow-pop-sm">
      <Art id="icon:news" size={40} className="shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-ink-soft">
          {t('news.label')} · {t('news.until', { n: state.news?.untilDay ?? 0 })}
        </div>
        <div className="font-display leading-tight font-semibold">{lt(n.title)}</div>
        <div className="text-xs text-ink-soft">{lt(n.body)}</div>
      </div>
    </div>
  );
}

/** ป้ายสถานะเฉพาะของแต่ละวิธีโกง */
export function MethodChips({ state, m }: { state: GameState; m: ScamMethod }) {
  const ms = state.methodState[m.id];
  const chips: { text: string; cls: string }[] = [];
  if (m.mechanic === 'romance' && state.romance.bond > 0) {
    chips.push({ text: t('hud.romance', { n: state.romance.bond }), cls: 'text-pink' });
  }
  if (m.mechanic === 'ponzi') {
    if (ms?.streak)
      chips.push({ text: t('plan.ponziStreak', { n: ms.streak }), cls: 'text-clean' });
    chips.push({
      text: t('plan.ponziRisk', { n: ponziCrashPct(state, content) }),
      cls: 'text-danger',
    });
  }
  if (m.mechanic === 'foundation' && ms?.exposure) {
    chips.push({ text: t('plan.exposure', { n: Math.min(99, ms.exposure) }), cls: 'text-danger' });
  }
  if (m.mechanic === 'merit' && activeFestivals(state, content).length > 0) {
    chips.push({ text: t('plan.festivalBoost'), cls: 'text-clean' });
  }
  return (
    <>
      {chips.map((c) => (
        <Chip key={c.text} className={c.cls}>
          {c.text}
        </Chip>
      ))}
    </>
  );
}

// ---------- 1. วางแผน ----------
export function PlanPhase({ state, dispatch }: PhaseProps) {
  return (
    <>
      <ScreenTitle title={t('phase.plan')} hint={t('plan.hint')} />
      <NewsCard state={state} />
      <div className="flex flex-col gap-3">
        {content.methods.map((m, i) => {
          const block = methodBlock(state, content, m);
          const broke = money(state) < m.cost;
          const hidden = block === 'level';
          return (
            <button
              key={m.id}
              type="button"
              disabled={block !== null || broke}
              onClick={() => dispatch({ t: 'choosePlan', methodId: m.id })}
              className="anim-rise-in flex items-start gap-3 rounded-3xl border-[3px] border-ink bg-paper p-3 text-left shadow-pop transition active:translate-y-1 active:shadow-none disabled:opacity-55 disabled:shadow-none"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <Art
                id={
                  hidden ? 'icon:lock' : block === 'cooldown' ? 'icon:cooldown' : `method:${m.id}`
                }
                size={52}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-semibold">{lt(m.name)}</div>
                {hidden ? (
                  <div className="text-sm text-ink-soft">
                    {t('plan.locked', { level: m.level })}
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-ink-soft">{lt(m.desc)}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Chip>{t('plan.cost', { n: m.cost })}</Chip>
                      <Chip className="text-clean">
                        {t('plan.income', { min: m.income[0], max: m.income[1] })}
                      </Chip>
                      <Chip className="text-danger">
                        {t('plan.heat', { min: m.heat[0], max: m.heat[1] })}
                      </Chip>
                      <MethodChips state={state} m={m} />
                      {block === 'banned' && (
                        <Chip className="text-danger">{t('plan.banned')}</Chip>
                      )}
                      {block === 'cooldown' && (
                        <Chip className="text-danger">
                          {t('plan.cooldown', { n: state.methodState[m.id]?.cooldownUntil ?? 0 })}
                        </Chip>
                      )}
                      {broke && <Chip className="text-danger">{t('plan.noMoney')}</Chip>}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button tone="mint" onClick={() => dispatch({ t: 'choosePlan', methodId: null })}>
          {t('plan.rest', { n: content.config.heatDecayQuietDay })}
        </Button>
        <RetireButton dispatch={dispatch} />
      </div>
    </>
  );
}

export function RetireButton({ dispatch }: { dispatch: PhaseProps['dispatch'] }) {
  const [confirmRetire, setConfirmRetire] = useState(false);
  return (
    <>
      <Button tone="paper" onClick={() => setConfirmRetire(true)}>
        {t('plan.retire')}
      </Button>
      {confirmRetire && (
        <ConfirmPopup
          title={t('plan.retire')}
          description={t('plan.retireConfirm')}
          confirmLabel="ยืนยันเกษียณ"
          icon="icon:medal"
          onCancel={() => setConfirmRetire(false)}
          onConfirm={() => {
            setConfirmRetire(false);
            dispatch({ t: 'retire' });
          }}
        />
      )}
    </>
  );
}

function ItemRow({
  state,
  itemId,
  owned,
  label,
  onBuy,
}: {
  state: GameState;
  itemId: string;
  owned: number;
  label: (price: number) => string;
  onBuy: () => void;
}) {
  const it = content.shopItems.find((x) => x.id === itemId);
  if (!it) return null;
  const price = priceOf(state, content, it.id, it.price);
  const maxed =
    owned >= it.maxStack ||
    (it.kind === 'henchman' &&
      state.henchmen.length >= (content.shopItems.find((x) => x.id === 'henchman')?.maxStack ?? 3));
  const only = it.methodId ? content.methods.find((m) => m.id === it.methodId) : undefined;
  return (
    <Panel className="flex items-center gap-3 p-3">
      <Art id={`shop:${it.id}`} size={44} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-display font-semibold">{lt(it.name)}</div>
        <div className="text-xs text-ink-soft">{lt(it.desc)}</div>
        <div className="mt-1 flex flex-wrap gap-1 text-xs font-semibold">
          <span>{t('invest.owned', { n: owned, max: it.maxStack })}</span>
          {only && (
            <span className="text-grape">· {t('invest.onlyFor', { name: lt(only.name) })}</span>
          )}
          {price < it.price && (
            <span className="text-clean line-through decoration-2">฿{it.price}</span>
          )}
        </div>
      </div>
      <Button
        tone="sun"
        className="shrink-0 px-3 py-2 text-sm"
        disabled={maxed || money(state) < price}
        onClick={onBuy}
      >
        {maxed ? t('shop.maxed') : label(price)}
      </Button>
    </Panel>
  );
}

// ---------- 2. ลงทุน ----------
export function InvestPhase({ state, dispatch }: PhaseProps) {
  const resting = state.todayMethodId === null;
  const items = content.shopItems.filter(
    (it) =>
      (it.kind === 'daily' || it.kind === 'henchman') &&
      (!it.minLevel || it.minLevel <= state.gangLevel) &&
      (!it.methodId || it.methodId === state.todayMethodId),
  );
  return (
    <>
      <ScreenTitle title={t('phase.invest')} hint={t('invest.hint')} />
      {!resting && (
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <ItemRow
              key={it.id}
              state={state}
              itemId={it.id}
              owned={
                it.kind === 'henchman'
                  ? it.id === 'henchman'
                    ? state.henchmen.length
                    : state.henchmen.filter((h) => h.recruit === it.id).length
                  : (state.dailyItems[it.id] ?? 0)
              }
              label={(n) =>
                it.kind === 'henchman' ? t('invest.hire', { n }) : t('invest.buy', { n })
              }
              onBuy={() => dispatch({ t: 'invest', itemId: it.id })}
            />
          ))}
        </div>
      )}
      <Button
        tone="pink"
        block
        className="mt-4 text-lg"
        onClick={() => dispatch({ t: 'confirmInvest' })}
      >
        {resting ? t('invest.restGo') : t('invest.go')}
      </Button>
    </>
  );
}

// ---------- มินิเกมคอลเซ็นเตอร์ ----------
export function CallPhase({ state, dispatch }: PhaseProps) {
  const call = state.call;
  if (!call) return null;
  const v = call.victim;
  const parts = content.victimParts;
  const name = parts.names[v.nameIdx];
  const job = parts.jobs[v.jobIdx];
  const trait = parts.traits[v.weakness][v.traitIdx];
  const reveal = perksOfKind(state, content, 'revealWeakness').some((p) =>
    p.weaknesses.includes(v.weakness),
  );
  const tell = v.tell ? parts.tells[v.tell.kind][v.tell.idx] : undefined;
  return (
    <>
      <ScreenTitle title={t('phase.call')} hint={t('call.hint')} />
      <Panel tone="sun" className="anim-rise-in flex items-center gap-3">
        <Art id={`victim:${v.portrait}`} size={76} className="shrink-0" />
        <div>
          <div className="font-display text-lg font-semibold">{name ? lt(name) : ''}</div>
          <div className="text-sm">
            {t('call.age', { n: v.age })} · {job ? lt(job.text) : ''}
          </div>
          <div className="mt-1 text-sm italic">“{trait ? lt(trait) : ''}”</div>
          {reveal && (
            <div className="mt-1 inline-block rounded-full border-2 border-ink bg-grape px-2 text-xs font-semibold text-white">
              🔮 {t('call.reveal', { w: t(`weakness.${v.weakness}`) })}
            </div>
          )}
          {tell && (
            <div className="mt-2 rounded-xl border-2 border-dashed border-ink bg-paper px-2 py-1 text-xs">
              <span className="font-semibold text-danger">👂 {t('call.tell')}:</span> {lt(tell)}
            </div>
          )}
        </div>
      </Panel>
      <div className="mt-4 flex flex-col gap-3">
        {call.pitchIds.map((id, i) => {
          const p = content.pitches.find((x) => x.id === id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ t: 'callPitch', pitchId: id })}
              className="anim-rise-in rounded-2xl border-[3px] border-ink bg-paper p-3 text-left shadow-pop transition active:translate-y-1 active:shadow-none"
              style={{ animationDelay: `${0.1 + i * 0.07}s` }}
            >
              <span className="font-display mr-2 text-pink">☎️</span>
              {p ? lt(p.text) : id}
            </button>
          );
        })}
        <Button tone="paper" block onClick={() => dispatch({ t: 'callHangup' })}>
          📵 {t('call.hangup')}
        </Button>
      </div>
    </>
  );
}

// ---------- เหตุการณ์ ----------
export function EventPhase({ state, dispatch }: PhaseProps) {
  const ev = content.events.find((e) => e.id === state.pendingEvents[0]);
  if (!ev) return null;
  const tones = ['pink', 'mint', 'grape'] as const;
  return (
    <>
      <ScreenTitle title={t('phase.event')} />
      <Panel tone="paper" className="anim-rise-in" key={ev.id}>
        <div className="flex items-center gap-3">
          <Art id={`event:${ev.category}`} size={52} className="shrink-0" />
          <h3 className="text-xl leading-snug font-semibold">{lt(ev.title)}</h3>
        </div>
        <p className="mt-2">{lt(ev.body)}</p>
      </Panel>
      <div className="mt-4 flex flex-col gap-3">
        {ev.choices.map((c, i) => {
          if (!choiceAvailable(state, c.requires)) return null;
          const special = Boolean(c.requires);
          return (
            <Button
              key={i}
              tone={special ? 'sun' : (tones[i % 3] ?? 'pink')}
              block
              className={`text-left ${special ? 'ring-4 ring-grape/40' : ''}`}
              onClick={() => dispatch({ t: 'eventChoice', choiceIdx: i })}
            >
              {special && (
                <span className="mr-1 rounded-full bg-grape px-2 py-0.5 text-xs text-white">
                  ✨ {t('event.special')}
                </span>
              )}
              {lt(c.text)}
            </Button>
          );
        })}
      </div>
    </>
  );
}

// ---------- ฟอกเงิน ----------
export function LaunderPhase({ state, dispatch }: PhaseProps) {
  return (
    <>
      <ScreenTitle title={t('phase.launder')} hint={t('launder.hint')} />
      <div className="flex flex-col gap-3">
        {state.launderOffer.map((id, i) => {
          const c = content.launderCards.find((x) => x.id === id);
          if (!c) return null;
          const amount = Math.min(state.dirtyCash, c.capacity);
          return (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ t: 'launder', cardId: id })}
              className="anim-rise-in rounded-3xl border-[3px] border-ink bg-sun p-3 text-left shadow-pop transition active:translate-y-1 active:shadow-none"
              style={{ animationDelay: `${i * 0.08}s`, transform: `rotate(${(i - 1) * 0.6}deg)` }}
            >
              <div className="flex items-start gap-3">
                <Art
                  id={`card:${c.id}`}
                  size={56}
                  className="shrink-0 rounded-2xl border-2 border-ink bg-white"
                />
                <div className="min-w-0">
                  <div className="font-display text-lg leading-snug font-semibold">
                    {lt(c.name)}
                  </div>
                  <div className="text-sm">{lt(c.desc)}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Chip className="text-clean">
                  {t('launder.success', { n: launderSuccessPct(state, content, c.id) })}
                </Chip>
                <Chip>{t('launder.loss', { n: c.lossPct })}</Chip>
                <Chip className="text-danger">{t('launder.heat', { n: c.heat })}</Chip>
                <Chip>{t('launder.capacity', { n: amount })}</Chip>
              </div>
            </button>
          );
        })}
      </div>
      <Button
        tone="paper"
        block
        className="mt-4"
        onClick={() => dispatch({ t: 'launder', cardId: null })}
      >
        {t('launder.skip')}
      </Button>
    </>
  );
}

// ---------- ร้านอัปเกรด ----------
export function ShopPhase({ state, dispatch }: PhaseProps) {
  const items = content.shopItems.filter(
    (it) => it.kind === 'permanent' && (!it.minLevel || it.minLevel <= state.gangLevel),
  );
  const last = state.day >= content.config.maxDays;
  return (
    <>
      <ScreenTitle title={t('phase.shop')} hint={t('shop.hint')} />
      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <ItemRow
            key={it.id}
            state={state}
            itemId={it.id}
            owned={state.upgrades[it.id] ?? 0}
            label={(n) => t('shop.buy', { n })}
            onBuy={() => dispatch({ t: 'buy', itemId: it.id })}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <Button tone="pink" onClick={() => dispatch({ t: 'endDay' })}>
          {last ? t('shop.lastDay') : t('shop.endDay')}
        </Button>
        <RetireButton dispatch={dispatch} />
      </div>
    </>
  );
}
