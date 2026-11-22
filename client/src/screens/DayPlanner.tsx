import { useState } from 'react';
import type { Action, GameState } from '@hts/shared';
import { currentOffer, methodBlock, newsScout, openingFor, priceOf } from '@hts/shared';
import { openingStories } from '../game/openingStories';
import { itemEffect, planEstimate, scoutHint } from '../game/plannerPreview';
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
  const skipKey = 'hts.opening.skipped';
  const [skipped, setSkipped] = useState(() => {
    try { return localStorage.getItem(skipKey) === state.seed; } catch { return false; }
  });
  const offer = currentOffer(state, content);
  const banned = (id: string) => offer?.kind === 'twist' && (offer.ban?.includes(id) ?? false);
  const methods = content.methods.map((method) => ({
    method,
    block: methodBlock(state, content, method),
  }));
  const locked = methods.filter(({ block }) => block === 'level');

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

  const run = (mId: string | null, buy: string[], opening = false) => {
    dispatch({ t: 'choosePlan', methodId: mId, ...(opening && { opening: true as const }) });
    if (mId !== null) for (const id of buy) dispatch({ t: 'invest', itemId: id });
    dispatch({ t: 'confirmInvest' });
  };
  const cartList = Object.entries(cart).flatMap(([id, n]) => Array<string>(n).fill(id));
  const crewLimit = content.shopItems.find((it) => it.id === 'henchman')?.maxStack ?? 3;
  const crewCount =
    state.henchmen.length +
    items.reduce((n, it) => n + (it.kind === 'henchman' ? (cart[it.id] ?? 0) : 0), 0);

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
  const priorCost = state.history.at(-1)?.repeatableCost;
  const difference = priorCost === undefined ? 0 : repeatCost - priorCost;
  const omitted = lastPlan?.items.filter(banned) ?? [];

  const opening = state.day === 1 && !skipped && openingFor(state.seed, state.characterId);
  const shop = methods.find(({ method }) => method.id === 'fake_shop');
  if (opening && shop) {
    const story = openingStories[opening];
    const estimate = planEstimate(state, shop.method, {});
    return (
      <section className="grid gap-3 rounded-3xl border-2 border-ink bg-paper p-4 text-ink shadow-pop">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">ข้อความเข้า · วันที่ 1</span>
          <button type="button" className="min-h-11 px-2 underline" onClick={() => {
            setSkipped(true);
            try { localStorage.setItem(skipKey, state.seed); } catch { /* still skip in this session */ }
          }}>ข้ามไปวางแผน</button>
        </div>
        <h2 className="font-display text-2xl">{story.sender}</h2>
        <p className="rounded-2xl rounded-tl-none border border-ink bg-white p-3">{story.message}</p>
        <Button tone="sun" block disabled={shop.block !== null || money(state) < shop.method.cost}
          onClick={() => run(shop.method.id, [], true)}>
          <span>{story.work}<small className="block font-normal">ทุน ฿{fmt(shop.method.cost)} · รายได้ ฿{fmt(estimate.income[0])}–{fmt(estimate.income[1])} · Heat +{estimate.heat.join('–')}</small></span>
        </Button>
        <Button tone="paper" block onClick={() => run(null, [], true)}>
          <span>{story.rest}<small className="block font-normal">พักงานวันนี้ · Heat ลดได้สูงสุด {Math.min(state.heat, content.config.heatDecayQuietDay)}</small></span>
        </Button>
      </section>
    );
  }
  const yesterday = state.day === 2 ? state.history.find(log => log.day === 1) : undefined;

  return (
    <>
      <ScreenTitle title={t('phase.plan')} hint={t('planner.hint')} />
      {yesterday?.opening && <aside className="mb-3 rounded-xl border-2 border-ink bg-sun p-3 text-ink">
        <small>ข่าวหน้าหนึ่งเช้านี้</small>
        <p className="font-display">{openingStories[yesterday.opening][yesterday.methodId ? 'workNews' : 'quietNews']}</p>
      </aside>}
      <NewsCard state={state} compact />
      <div className="flex flex-col gap-2">
        {methods
          .filter(({ block }) => block !== 'level')
          .map(({ method: m, block }) => {
            const picked = methodId === m.id;
            const estimate = planEstimate(state, m, picked ? cart : {});
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={picked}
                disabled={block !== null}
                onClick={() => {
                  if (picked) return;
                  setMethodId(m.id);
                  setCart({});
                }}
                className={`flex items-start gap-3 rounded-2xl border-[3px] border-ink p-2.5 text-left text-ink transition disabled:opacity-50 ${picked ? 'bg-sun shadow-pop' : 'bg-paper'}`}
              >
                <Art
                  id={block === 'cooldown' ? 'icon:cooldown' : `method:${m.id}`}
                  size={40}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold">{lt(m.name)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Chip>{t('plan.cost', { n: picked ? total : m.cost })}</Chip>
                    <Chip className="text-clean">
                      {t('plan.income', { min: estimate.income[0], max: estimate.income[1] })}
                    </Chip>
                    <Chip className="text-danger">
                      {t('plan.heat', { min: estimate.heat[0], max: estimate.heat[1] })}
                    </Chip>
                    <MethodChips state={state} m={m} />
                    {block === 'banned' && <Chip className="text-danger">{t('plan.banned')}</Chip>}
                    {block === 'cooldown' && (
                      <Chip className="text-danger">
                        {t('plan.cooldown', { n: state.methodState[m.id]?.cooldownUntil ?? 0 })}
                      </Chip>
                    )}
                  </div>
                  {picked && <div className="mt-1 text-xs text-ink-soft">{lt(m.desc)}</div>}
                  {picked && (
                    <p className="mt-1 text-xs text-ink-soft">
                      ประมาณการจากฐานงานและโบนัส ก่อนผลมินิเกม กลไกเฉพาะแผน และเหตุการณ์
                    </p>
                  )}
                </div>
              </button>
            );
          })}
      </div>

      {repeatOk && lastPlan && (
        <Button
          tone="mint"
          block
          className="mt-3 text-left"
          disabled={repeatCost > money(state)}
          onClick={() =>
            run(
              lastPlan.methodId,
              lastPlan.items.filter((id) => !banned(id)),
            )
          }
        >
          🔁 {t('planner.repeat')}{' '}
          <span className="block text-sm opacity-90">
            (
            {lastPlan.methodId
              ? lt(content.methods.find((m) => m.id === lastPlan.methodId)?.name ?? { th: '' })
              : t('planner.rest')}
            {lastPlan.items.length > omitted.length
              ? ` + ${t('planner.items', { n: lastPlan.items.length - omitted.length })}`
              : ''}
            {repeatCost > 0 ? ` · ฿${fmt(repeatCost)}` : ''})
          </span>
          {difference !== 0 && (
            <span className="block text-sm">
              {difference > 0 ? 'แพงขึ้น' : 'ถูกลง'} ฿{fmt(Math.abs(difference))} จากแผนเมื่อวาน
            </span>
          )}
          {omitted.length > 0 && (
            <span className="block text-sm">
              วันนี้งดใช้{' '}
              {Array.from(new Set(omitted))
                .map((id) => lt(content.shopItems.find((it) => it.id === id)?.name ?? { th: id }))
                .join(' · ')}
            </span>
          )}
        </Button>
      )}

      {method && (
        <div className="mt-3 rounded-2xl border-2 border-ink bg-white p-2.5 text-ink">
          <div className="mb-1.5 text-xs font-semibold">{t('planner.addons')}</div>
          <div className="flex flex-col gap-1.5">
            {items.map((it) => {
              const owned =
                it.kind === 'henchman'
                  ? state.henchmen.filter((h) => h.recruit === it.id).length
                  : 0;
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
                    <p className="my-1 text-xs leading-snug">{itemEffect(it)}</p>
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
                      aria-label={`ลด ${lt(it.name)}`}
                      disabled={n === 0}
                      onClick={() => setCart({ ...cart, [it.id]: n - 1 })}
                      className="h-11 w-11 rounded-full border-2 border-ink bg-paper font-bold disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="font-display w-5 text-center">{n}</span>
                    <button
                      type="button"
                      aria-label={`เพิ่ม ${lt(it.name)}`}
                      disabled={
                        isBanned || n >= max || (it.kind === 'henchman' && crewCount >= crewLimit)
                      }
                      onClick={() => setCart({ ...cart, [it.id]: n + 1 })}
                      className="h-11 w-11 rounded-full border-2 border-ink bg-sun font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {state.day >= newsScout.firstDay && (
            <div className="mt-3 border-t border-ink/20 pt-2 text-sm">
              <b>ทีมตรวจข่าว</b>
              {state.scoutedDay === state.day ? (
                <p role="status">
                  {canAfford
                    ? scoutHint(state, method.id, cartList)
                    : 'ลดของในแผนให้พอกับงบเพื่ออ่านเบาะแส'}
                </p>
              ) : (
                <>
                  <p className="mb-2 text-xs">อ่านเบาะแสก่อนเริ่มงาน เปลี่ยนแผนแล้วตรวจใหม่ได้ตลอดวันนี้</p>
                  <Button
                    tone="paper"
                    disabled={money(state) < newsScout.price}
                    onClick={() => dispatch({ t: 'scoutNews' })}
                  >
                    จ่ายทันที ฿{fmt(newsScout.price)} · ดูเบาะแส
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <OfferCard state={state} dispatch={dispatch} />
      </div>
      {locked.length > 0 && (
        <details className="mb-3 rounded-xl bg-paper px-3 text-sm text-ink">
          <summary className="cursor-pointer py-2.5 font-semibold">
            ปลดล็อกถัดไป · {locked.length} แผน
          </summary>
          <ul className="space-y-2 pb-3">
            {locked.map(({ method: m }) => (
              <li key={m.id} className="flex items-center gap-2">
                <Art id="icon:lock" size={20} />
                {lt(m.name)} · {t('plan.locked', { level: m.level })}
              </li>
            ))}
          </ul>
        </details>
      )}
      <RetireButton dispatch={dispatch} />
      <div className="planner-actions" role="group" aria-label="ยืนยันแผนวันนี้">
        {method && !canAfford && (
          <p role="status" className="planner-budget text-sm text-[#ffabb3]">
            {t('plan.noMoney')}
          </p>
        )}
        <div className="planner-actions-inner">
          <Button
            tone="pink"
            block
            disabled={!method || !canAfford}
            onClick={() => run(methodId, cartList)}
          >
            {method ? `${t('invest.go')} · ต้นทุน ฿${fmt(total)}` : t('planner.pick')}
          </Button>
          <Button tone="mint" onClick={() => run(null, [])}>
            {t('plan.rest', { n: content.config.heatDecayQuietDay })}
          </Button>
        </div>
      </div>
    </>
  );
}

function methodBlockFor(state: GameState, id: string) {
  const m = content.methods.find((x) => x.id === id);
  return !m || methodBlock(state, content, m) !== null || m.cost > money(state);
}
