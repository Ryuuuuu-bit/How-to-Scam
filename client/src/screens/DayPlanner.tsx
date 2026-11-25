import { homeOf, petOf } from '@hts/shared';
import { useState } from 'react';
import { careerStatus, henchmanCap, soiBlocker } from '@hts/shared';
import { SoiDecision } from '../components/SoiMap';
import { CareerDesk, CareerDirectory, ReliefDesk } from '../components/CareerDesk';
import type { Action, GameState } from '@hts/shared';
import { currentOffer, methodBlock, newsScout, openingFor, originStage, priceOf, questSeedPrefix } from '@hts/shared';
import { openingStories } from '../game/openingStories';
import { OriginChat } from './OriginChat';
import { itemEffect, planEstimate, scoutHint } from '../game/plannerPreview';
import { content } from '../game/content';
import { fmt, lt, t } from '../i18n';
import { Art, Button, ScreenTitle } from '../components/ui';
import { jobSceneUrl } from '../assets/art';
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

function CareerJournal({ state }: { state: GameState }) {
  if (!state.seed.startsWith(questSeedPrefix)) return null;
  const quests = content.events.filter(e => e.careerQuest && e.when.characters?.includes(state.characterId));
  const done = quests.filter(e => state.flags.includes(e.id + '_done')).length;
  return <details className="mb-3 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm text-ink">
    <summary className="cursor-pointer font-bold">สมุดงานประจำอาชีพ · ทำแล้ว {done}/{quests.length}</summary>
    <ul className="mt-2 space-y-2">{quests.map(e => <li key={e.id}>
      <strong>{lt(e.title)}</strong><br />
      {state.flags.includes(e.id + '_done') ? 'ทำแล้ว' : state.seenEvents.includes(e.id) ? 'ผ่านงานนี้'
        : `เริ่มเสนอได้ตั้งแต่วันที่ ${e.careerQuest?.fromDay}`}
    </li>)}</ul>
  </details>;
}

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
  const [order, setOrder] = useState('featured');
  const [itemGroup, setItemGroup] = useState<'daily' | 'henchman'>('daily');
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
  const recent = new Map(state.history.map(h => [h.methodId, h.day]));
  const available = methods.filter(({ block }) => block !== 'level').sort((a, b) => {
    if (order === 'cost') return a.method.cost - b.method.cost;
    if (order === 'heat') return planEstimate(state, a.method, {}).heat[1] - planEstimate(state, b.method, {}).heat[1];
    const playable = (job: typeof a) => Number(!job.block && job.method.cost <= money(state));
    const lastWorked = (job: typeof a) => recent.get(job.method.id) ?? 0;
    const rotated = (job: typeof a) => (content.methods.indexOf(job.method) + content.methods.length - state.day % content.methods.length) % content.methods.length;
    return playable(b) - playable(a) || lastWorked(a) - lastWorked(b) || rotated(a) - rotated(b);
  });

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
  const preview = method && planEstimate(state, method, cart);

  const run = (mId: string | null, buy: string[], opening = false) => {
    dispatch({ t: 'choosePlan', methodId: mId, ...(opening && { opening: true as const }) });
    if (mId !== null) for (const id of buy) dispatch({ t: 'invest', itemId: id });
    dispatch({ t: 'confirmInvest' });
  };
  const cartList = Object.entries(cart).flatMap(([id, n]) => Array<string>(n).fill(id));
  const crewLimit = henchmanCap(state, content);
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
  if (originStage(state)) return <OriginChat state={state} dispatch={dispatch} />;
  if (soiBlocker(state)) return <SoiDecision state={state} dispatch={dispatch} />;
  if (state.favorDay !== undefined && state.day >= state.favorDay) return <ReliefDesk state={state} dispatch={dispatch} />;
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
          <span>{story.rest}<small className="block font-normal">พักงานวันนี้ · Heat ลดได้สูงสุด {Math.min(state.heat, content.config.heatDecayQuietDay + homeOf(state).quietHeat)}{petOf(state).quietCash ? ` · ${petOf(state).name} คาบของมาขายได้ ฿${petOf(state).quietCash}` : ''}</small></span>
        </Button>
      </section>
    );
  }
  const yesterday = state.day === 2 ? state.history.find(log => log.day === 1) : undefined;
  const previousShift = state.history.at(-1);

  return (
    <>
      <ScreenTitle title={t('phase.plan')} hint="เลือกงานที่อยากลอง แล้วดูว่าเสี่ยงแค่ไหนก่อนลงมือ" />
      <CareerJournal state={state} />
      <CareerDirectory state={state} />
      <ReliefDesk state={state} dispatch={dispatch} />
      {previousShift?.relief && previousShift.day === state.day - 1 && <p role="status" className="mb-3 rounded-xl bg-paper p-3 text-ink">
        {previousShift.relief === 'favor' ? 'เมื่อวานเฝ้าตลาดครบกะแล้ว คุณคืนบุญคุณเจ๊เรียบร้อย'
          : `จบกะ${previousShift.relief === 'mascot' ? 'มาสคอต' : 'ขึ้นเวที'} · ได้ทุนกลับมาทำงาน ฿${fmt(previousShift.income)}`}
      </p>}
      {yesterday?.opening && <aside className="mb-3 rounded-xl border-2 border-ink bg-sun p-3 text-ink">
        <small>ข่าวหน้าหนึ่งเช้านี้</small>
        <p className="font-display">{openingStories[yesterday.opening][yesterday.methodId ? 'workNews' : 'quietNews']}</p>
      </aside>}
      <NewsCard state={state} compact />
      <div className="job-toolbar">
        <strong>งานที่เปิดวันนี้ <span>{available.length}</span></strong>
        <select aria-label="เรียงแผนงาน" value={order} onChange={e => setOrder(e.target.value)}>
          <option value="featured">งานแนะนำ</option><option value="cost">ทุนน้อยก่อน</option><option value="heat">Heat ต่ำก่อน</option>
        </select>
      </div>
      <div className="job-grid">
        {available.map(({ method: m, block }) => {
            const picked = methodId === m.id;
            const estimate = planEstimate(state, m, {});
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={picked}
                disabled={block !== null}
                onClick={() => {
                  if (picked) return;
                  setMethodId(m.id);
                  setCart(current => Object.fromEntries(Object.entries(current).filter(([id]) => {
                    const it = content.shopItems.find(item => item.id === id);
                    return it && (!it.methodId || it.methodId === m.id);
                  })));
                }}
                className="job-tile"
              >
                <span className="job-photo"><img src={jobSceneUrl(m.id)} alt="" />
                  <small>ทุน ฿{fmt(m.cost)}</small>{picked && <b aria-hidden="true">✓</b>}
                </span>
                <span className="job-copy"><strong>{lt(m.name)}</strong>
                  <small>{careerStatus(state, m.id).shifts} วันในสายงานนี้</small>
                  <span>{m.cleanIncome ? 'เงินสะอาด' : 'รายได้'} ฿{fmt(estimate.income[0])}–{fmt(estimate.income[1])}</span>
                  <small>{block === 'banned' ? t('plan.banned') : block === 'cooldown'
                    ? t('plan.cooldown', { n: state.methodState[m.id]?.cooldownUntil ?? 0 })
                    : `Heat ${estimate.heat[1] === 0 ? '0' : '+' + estimate.heat.join('–')}`}</small>
                </span>
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

      {method && preview && (
        <section className="kit-panel" id="daily-kit" aria-label="รายละเอียดงานและของเสริม" tabIndex={-1}>
          <div className="job-brief"><strong>{lt(method.name)}</strong><p>{lt(method.desc)}</p>
            <div className="flex flex-wrap gap-1"><MethodChips state={state} m={method} /></div>
          </div>
          <CareerDesk state={state} method={method.id} dispatch={dispatch} />
          <div className="kit-heading"><h3>ของช่วยงานวันนี้</h3><span>ไม่ซื้อก็เริ่มได้</span></div>
          <div className="kit-switch" role="group" aria-label="ประเภทของช่วยงาน">
            <button type="button" aria-pressed={itemGroup === 'daily'} onClick={() => setItemGroup('daily')}>ของรายวัน</button>
            <button type="button" aria-pressed={itemGroup === 'henchman'} onClick={() => setItemGroup('henchman')}>ทีมงาน · {crewCount}/{crewLimit}</button>
          </div>
          <div className="flex flex-col gap-1.5">
            {items.filter(it => it.kind === itemGroup).map((it) => {
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
                  className={`kit-row flex items-center gap-2 ${isBanned ? 'opacity-50' : ''}`}
                >
                  <Art id={`shop:${it.id}`} size={30} className="shrink-0" />
                  <div className="min-w-0 flex-1 text-sm leading-tight">
                    <strong>{lt(it.name)}</strong>
                    <p className="my-1 text-xs leading-snug">{itemEffect(it)}</p>
                    <div className="text-[11px] text-ink-soft">
                      {isBanned ? t('planner.banned') : `฿${fmt(price)}`}
                      {!isBanned && total + price > money(state) && n < max && ' · งบไม่พอเพิ่ม'}
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
                        isBanned || total + price > money(state) || n >= max || (it.kind === 'henchman' && crewCount >= crewLimit)
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
        </section>
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
        {method && preview && <details className="plan-receipt">
          <summary>ทุนรวม ฿{fmt(total)} <b>{canAfford ? 'เหลือ' : 'ขาด'} ฿{fmt(Math.abs(money(state) - total))}</b></summary>
          <p>ทุนงาน ฿{fmt(method.cost)} + ของช่วย ฿{fmt(cartCost)} · {method.cleanIncome ? 'เงินสะอาด' : 'รายได้'}ประมาณ ฿{fmt(preview.income[0])}–{fmt(preview.income[1])} · Heat {preview.heat[1] === 0 ? '0' : '+' + preview.heat.join('–')}</p>
          <small>ก่อนผลเหตุการณ์ กลไกเฉพาะงาน และค่าแรงทีม</small>
          <button type="button" className="receipt-link" onClick={e => {
            e.currentTarget.closest('details')?.removeAttribute('open');
            const kit = document.getElementById('daily-kit');
            kit?.focus({ preventScroll: true });
            kit?.scrollIntoView({ block: 'start' });
          }}>ไปเลือกของช่วยงาน</button>
        </details>}
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
            {t('plan.rest', { n: content.config.heatDecayQuietDay + homeOf(state).quietHeat })}
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
