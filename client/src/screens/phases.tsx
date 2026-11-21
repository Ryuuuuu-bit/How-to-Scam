import type { Action, GameState } from '@hts/shared';
import { unlockedMethods } from '@hts/shared';
import { content } from '@hts/shared/data';
import { lt, t } from '../i18n';
import { Art, Button, Chip, Panel, ScreenTitle } from '../components/ui';

interface PhaseProps {
  state: GameState;
  dispatch: (a: Action) => void;
}

const money = (s: GameState) => s.dirtyCash + s.cleanCash;

// ---------- 1. วางแผน ----------
export function PlanPhase({ state, dispatch }: PhaseProps) {
  const unlocked = new Set(unlockedMethods(state, content).map((m) => m.id));
  return (
    <>
      <ScreenTitle title={t('phase.plan')} hint={t('plan.hint')} />
      <div className="flex flex-col gap-3">
        {content.methods.map((m, i) => {
          const locked = !unlocked.has(m.id);
          const broke = money(state) < m.cost;
          const bond = m.mechanic === 'romance' && state.romance.bond > 0;
          return (
            <button
              key={m.id}
              type="button"
              disabled={locked || broke}
              onClick={() => dispatch({ t: 'choosePlan', methodId: m.id })}
              className="anim-rise-in flex items-start gap-3 rounded-3xl border-[3px] border-ink bg-paper p-3 text-left shadow-pop transition active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Art id={locked ? 'icon:lock' : `method:${m.id}`} size={52} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-semibold">{lt(m.name)}</div>
                {locked ? (
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
                      {bond && (
                        <Chip className="text-pink">
                          {t('hud.romance', { n: state.romance.bond })}
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

function RetireButton({ dispatch }: { dispatch: PhaseProps['dispatch'] }) {
  return (
    <Button
      tone="paper"
      onClick={() => {
        if (window.confirm(t('plan.retireConfirm'))) dispatch({ t: 'retire' });
      }}
    >
      {t('plan.retire')}
    </Button>
  );
}

// ---------- 2. ลงทุน ----------
export function InvestPhase({ state, dispatch }: PhaseProps) {
  const resting = state.todayMethodId === null;
  const items = content.shopItems.filter(
    (it) =>
      (it.kind === 'daily' || it.kind === 'henchman') &&
      (!it.minLevel || it.minLevel <= state.gangLevel),
  );
  return (
    <>
      <ScreenTitle title={t('phase.invest')} hint={t('invest.hint')} />
      {!resting && (
        <div className="flex flex-col gap-3">
          {items.map((it) => {
            const owned =
              it.kind === 'henchman' ? state.henchmen.length : (state.dailyItems[it.id] ?? 0);
            const maxed = owned >= it.maxStack;
            return (
              <Panel key={it.id} className="flex items-center gap-3 p-3">
                <Art id={`shop:${it.id}`} size={44} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold">{lt(it.name)}</div>
                  <div className="text-xs text-ink-soft">{lt(it.desc)}</div>
                  <div className="mt-1 text-xs font-semibold">
                    {t('invest.owned', { n: owned, max: it.maxStack })}
                  </div>
                </div>
                <Button
                  tone="sun"
                  className="shrink-0 px-3 py-2 text-sm"
                  disabled={maxed || money(state) < it.price}
                  onClick={() => dispatch({ t: 'invest', itemId: it.id })}
                >
                  {it.kind === 'henchman'
                    ? t('invest.hire', { n: it.price })
                    : t('invest.buy', { n: it.price })}
                </Button>
              </Panel>
            );
          })}
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
  const victim = content.victims.find((v) => v.id === call?.victimId);
  if (!call || !victim) return null;
  return (
    <>
      <ScreenTitle title={t('phase.call')} hint={t('call.hint')} />
      <Panel tone="sun" className="anim-rise-in flex items-center gap-3">
        <Art id={`victim:${victim.id}`} size={72} className="shrink-0" />
        <div>
          <div className="font-display text-lg font-semibold">{lt(victim.name)}</div>
          <div className="text-sm">
            {t('call.age', { n: victim.age })} · {lt(victim.job)}
          </div>
          <div className="mt-1 text-sm italic">“{lt(victim.trait)}”</div>
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
      </div>
    </>
  );
}

// ---------- เหตุการณ์ ----------
export function EventPhase({ state, dispatch }: PhaseProps) {
  const ev = content.events.find((e) => e.id === state.pendingEvents[0]);
  if (!ev) return null;
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
        {ev.choices.map((c, i) => (
          <Button
            key={i}
            tone={i === 0 ? 'pink' : i === 1 ? 'mint' : 'grape'}
            block
            className="text-left"
            onClick={() => dispatch({ t: 'eventChoice', choiceIdx: i })}
          >
            {lt(c.text)}
          </Button>
        ))}
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
                <Chip className="text-clean">{t('launder.success', { n: c.successPct })}</Chip>
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
        {items.map((it) => {
          const owned = state.upgrades[it.id] ?? 0;
          const maxed = owned >= it.maxStack;
          return (
            <Panel key={it.id} className="flex items-center gap-3 p-3">
              <Art id={`shop:${it.id}`} size={44} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold">{lt(it.name)}</div>
                <div className="text-xs text-ink-soft">{lt(it.desc)}</div>
                <div className="mt-1 text-xs font-semibold">
                  {t('invest.owned', { n: owned, max: it.maxStack })}
                </div>
              </div>
              <Button
                tone="sun"
                className="shrink-0 px-3 py-2 text-sm"
                disabled={maxed || money(state) < it.price}
                onClick={() => dispatch({ t: 'buy', itemId: it.id })}
              >
                {maxed ? t('shop.maxed') : t('shop.buy', { n: it.price })}
              </Button>
            </Panel>
          );
        })}
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

// ---------- หนีตำรวจ (ตัวแทนชั่วคราว) ----------
export function EscapePhase({ dispatch }: PhaseProps) {
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <Art id="icon:police" size={110} className="anim-shake" />
      <h2 className="text-3xl font-semibold text-danger">{t('phase.escape')}</h2>
      <p>{t('escape.body')}</p>
      <Button
        tone="danger"
        block
        className="text-xl"
        onClick={() => dispatch({ t: 'escapeAttempt' })}
      >
        {t('escape.run')}
      </Button>
    </div>
  );
}
