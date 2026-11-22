import { useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { currentOffer, methodBlock, priceOf } from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt, t } from '../i18n';
import { Art, Button, Chip, ScreenTitle } from '../components/ui';
import { MethodChips, NewsCard, RetireButton } from './phases';

/** แผนของเมื่อวาน (ดึงจาก action log) ใช้กับปุ่ม "ทำแบบเมื่อวาน" */
export interface LastPlan {
  methodId: string | null;
  items: string[];
}

export function lastPlanFrom(actions: Action[]): LastPlan | null {
  let i = actions.length - 1;
  while (i >= 0 && actions[i]?.t !== 'choosePlan') i--;
  const plan = actions[i];
  if (!plan || plan.t !== 'choosePlan') return null;
  const items: string[] = [];
  for (let j = i + 1; j < actions.length; j++) {
    const a = actions[j];
    if (!a || a.t === 'confirmInvest') break;
    if (a.t === 'invest') {
      // ลูกน้องจ้างครั้งเดียวอยู่ถาวร ไม่ต้องจ้างซ้ำทุกวัน
      if (content.shopItems.find((x) => x.id === a.itemId)?.kind === 'daily') items.push(a.itemId);
    }
  }
  return { methodId: plan.methodId, items };
}

const money = (s: GameState) => s.dirtyCash + s.cleanCash;

/** การ์ดข้อเสนอ/ภารกิจของวันนี้ */
function OfferCard({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const o = currentOffer(state, content);
  const mission = state.mission
    ? content.offers.find((x) => x.id === state.mission?.offerId)
    : undefined;
  return (
    <>
      {mission?.mission && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border-2 border-ink bg-grape p-2 text-sm text-white">
          <span className="text-xl">🎯</span>
          <span className="min-w-0 flex-1">
            <b>{lt(mission.name)}</b>
            <br />
            {t('offer.progress', { n: state.mission?.progress ?? 0, m: mission.mission.days })}
          </span>
        </div>
      )}
      {o && !(o.kind !== 'twist' && state.offer?.accepted) && (
        <div className="anim-rise-in mb-3 rounded-2xl border-[3px] border-ink bg-sun p-2.5 text-ink shadow-pop-sm">
          <div className="text-[11px] font-semibold">
            {o.kind === 'mission' ? t('offer.missionLabel') : t('offer.label')}
          </div>
          <div className="font-display leading-tight font-semibold">{lt(o.name)}</div>
          <div className="text-xs">{lt(o.desc)}</div>
          {o.kind !== 'twist' && (
            <Button
              tone="pink"
              className="mt-2 px-3 py-1.5 text-sm"
              disabled={o.kind === 'deal' && money(state) < (o.price ?? 0)}
              onClick={() => dispatch({ t: 'acceptOffer' })}
            >
              {o.kind === 'deal'
                ? t('offer.buy', { n: fmt(o.price ?? 0) })
                : t('offer.acceptMission')}
            </Button>
          )}
        </div>
      )}
    </>
  );
}

/**
 * วางแผน + ลงทุนในหน้าเดียว: เลือกวิธี ใส่ของที่จะซื้อ แล้วกดเริ่มงานครั้งเดียว
 * (ยังส่ง action ทีละขั้นเหมือนเดิม คะแนนและการตรวจที่ server จึงไม่เปลี่ยน)
 */
export function DayPlanner({
  state,
  dispatch,
  lastPlan,
}: {
  state: GameState;
  dispatch: (a: Action) => void;
  lastPlan: LastPlan | null;
}) {
  const [methodId, setMethodId] = useState<string | null>(
    lastPlan?.methodId && !methodBlockFor(state, lastPlan.methodId) ? lastPlan.methodId : null,
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const offer = currentOffer(state, content);
  const banned = (id: string) => offer?.kind === 'twist' && (offer.ban?.includes(id) ?? false);

  const method = content.methods.find((m) => m.id === methodId);
  const items = content.shopItems.filter(
    (it) =>
      (it.kind === 'daily' || it.kind === 'henchman') &&
      (!it.minLevel || it.minLevel <= state.gangLevel) &&
      (!it.methodId || it.methodId === methodId),
  );
  const cartCost = Object.entries(cart).reduce((sum, [id, n]) => {
    const it = content.shopItems.find((x) => x.id === id);
    return sum + (it ? priceOf(state, content, id, it.price) * n : 0);
  }, 0);
  const total = (method?.cost ?? 0) + cartCost;
  const canAfford = total <= money(state);

  const run = (mId: string | null, buy: string[]) => {
    dispatch({ t: 'choosePlan', methodId: mId });
    if (mId !== null) for (const id of buy) dispatch({ t: 'invest', itemId: id });
    dispatch({ t: 'confirmInvest' });
  };
  const cartList = Object.entries(cart).flatMap(([id, n]) => Array<string>(n).fill(id));

  const repeatOk =
    lastPlan !== null && (lastPlan.methodId === null || !methodBlockFor(state, lastPlan.methodId));
  const repeatCost =
    (lastPlan?.methodId
      ? (content.methods.find((m) => m.id === lastPlan.methodId)?.cost ?? 0)
      : 0) +
    (lastPlan?.items ?? []).reduce((sum, id) => {
      const it = content.shopItems.find((x) => x.id === id);
      return sum + (it && !banned(id) ? priceOf(state, content, id, it.price) : 0);
    }, 0);

  return (
    <>
      <ScreenTitle title={t('phase.plan')} hint={t('planner.hint')} />
      <NewsCard state={state} />
      <OfferCard state={state} dispatch={dispatch} />

      {repeatOk && lastPlan && (
        <Button
          tone="mint"
          block
          className="mb-3 text-left"
          disabled={repeatCost > money(state)}
          onClick={() =>
            run(
              lastPlan.methodId,
              lastPlan.items.filter((id) => !banned(id)),
            )
          }
        >
          🔁 {t('planner.repeat')}{' '}
          <span className="text-sm opacity-90">
            (
            {lastPlan.methodId
              ? lt(content.methods.find((m) => m.id === lastPlan.methodId)?.name ?? { th: '' })
              : t('planner.rest')}
            {lastPlan.items.length > 0
              ? ` + ${t('planner.items', { n: lastPlan.items.length })}`
              : ''}
            {repeatCost > 0 ? ` · ฿${fmt(repeatCost)}` : ''})
          </span>
        </Button>
      )}

      <div className="flex flex-col gap-2">
        {content.methods.map((m) => {
          const block = methodBlock(state, content, m);
          if (block === 'level') {
            return (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-2xl border-2 border-ink/40 bg-paper/70 p-2 text-sm text-ink-soft"
              >
                <Art id="icon:lock" size={28} />
                {lt(m.name)} · {t('plan.locked', { level: m.level })}
              </div>
            );
          }
          const picked = methodId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={block !== null}
              onClick={() => {
                setMethodId(m.id);
                setCart({});
              }}
              className={`flex items-start gap-3 rounded-2xl border-[3px] border-ink p-2.5 text-left text-ink transition disabled:opacity-50 ${picked ? 'bg-sun shadow-pop' : 'bg-paper'}`}
            >
              <Art
                id={block === 'cooldown' ? 'icon:cooldown' : `method:${m.id}`}
                size={44}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold">{lt(m.name)}</div>
                {picked && <div className="text-xs text-ink-soft">{lt(m.desc)}</div>}
                <div className="mt-1 flex flex-wrap gap-1">
                  <Chip>{t('plan.cost', { n: m.cost })}</Chip>
                  <Chip className="text-clean">
                    {t('plan.income', { min: m.income[0], max: m.income[1] })}
                  </Chip>
                  <Chip className="text-danger">
                    {t('plan.heat', { min: m.heat[0], max: m.heat[1] })}
                  </Chip>
                  <MethodChips state={state} m={m} />
                  {block === 'banned' && <Chip className="text-danger">{t('plan.banned')}</Chip>}
                  {block === 'cooldown' && (
                    <Chip className="text-danger">
                      {t('plan.cooldown', { n: state.methodState[m.id]?.cooldownUntil ?? 0 })}
                    </Chip>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {method && (
        <div className="mt-3 rounded-2xl border-2 border-ink bg-white p-2.5 text-ink">
          <div className="mb-1.5 text-xs font-semibold">{t('planner.addons')}</div>
          <div className="flex flex-col gap-1.5">
            {items.map((it) => {
              const owned = it.kind === 'henchman' ? state.henchmen.length : 0;
              const n = cart[it.id] ?? 0;
              const price = priceOf(state, content, it.id, it.price);
              const max = it.kind === 'henchman' ? it.maxStack - owned : it.maxStack;
              const isBanned = banned(it.id);
              return (
                <div
                  key={it.id}
                  className={`flex items-center gap-2 ${isBanned ? 'opacity-50' : ''}`}
                >
                  <Art id={`shop:${it.id}`} size={30} className="shrink-0" />
                  <div className="min-w-0 flex-1 text-sm leading-tight">
                    {lt(it.name)}
                    <div className="text-[11px] text-ink-soft">
                      {isBanned ? t('planner.banned') : `฿${fmt(price)}`}
                      {price < it.price && !isBanned && (
                        <span className="ml-1 text-clean line-through">฿{fmt(it.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="-"
                      disabled={n === 0}
                      onClick={() => setCart({ ...cart, [it.id]: n - 1 })}
                      className="h-8 w-8 rounded-full border-2 border-ink bg-paper font-bold disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="font-display w-5 text-center">{n}</span>
                    <button
                      type="button"
                      aria-label="+"
                      disabled={isBanned || n >= max}
                      onClick={() => setCart({ ...cart, [it.id]: n + 1 })}
                      className="h-8 w-8 rounded-full border-2 border-ink bg-sun font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        tone="pink"
        block
        className="mt-3 text-lg"
        disabled={!method || !canAfford}
        onClick={() => run(methodId, cartList)}
      >
        {method ? `${t('invest.go')} · ฿${fmt(total)}` : t('planner.pick')}
      </Button>
      {method && !canAfford && (
        <p className="mt-1 text-center text-xs text-danger">{t('plan.noMoney')}</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button tone="mint" onClick={() => run(null, [])}>
          {t('plan.rest', { n: content.config.heatDecayQuietDay })}
        </Button>
        <RetireButton dispatch={dispatch} />
      </div>
    </>
  );
}

function methodBlockFor(state: GameState, id: string) {
  const m = content.methods.find((x) => x.id === id);
  return !m || methodBlock(state, content, m) !== null || m.cost > money(state);
}
