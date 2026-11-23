import type { ReactNode } from 'react';
import {
  basePrice,
  contrabandWeight,
  dealDiscount,
  holdPrice,
  hideoutTier,
  isAlly,
  placeIds,
  places,
  placeUnlocked,
  priceOf,
  raidTonight,
} from '@hts/shared';
import type { Action, GameState, ShopItem } from '@hts/shared';
import { content, hideoutTiers } from '@hts/shared/data';
import { fmt, lt } from '../i18n';
import { Art, Button } from '../components/ui';
import { hideoutArtUrl } from '../assets/art';
import { formLabel, placeIcon } from '../components/SoiMap';
import '../components/shop.css';

type Dispatch = (a: Action) => void;

const money = (s: GameState) => s.dirtyCash + s.cleanCash;
const item = (id: string) => content.shopItems.find((x) => x.id === id);
const priceFor = (s: GameState, it: ShopItem) => priceOf(s, content, it.id, basePrice(s, it));
const owned = (s: GameState, id: string) => (s.upgrades[id] ?? 0) > 0;

/** ร้านอัปเกรดท้ายวันรุ่น 1.0 */
export function ShopV1({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const scanner = owned(state, 'app_scanner') && raidTonight(state);
  return (
    <div className="shop-v1">
      {scanner && <RaidWarning state={state} />}
      <Hideout state={state} dispatch={dispatch} />
      <NightMarket state={state} dispatch={dispatch} />
      <ShadyDeal state={state} dispatch={dispatch} />
      <PhoneApps state={state} dispatch={dispatch} />
      <SoiGoods state={state} dispatch={dispatch} />
    </div>
  );
}

function RaidWarning({ state }: { state: GameState }) {
  const decoy = state.case?.evidence.some((e) => e.kind === 'decoy');
  return (
    <div className="shop-raid" role="alert">
      <Art id="shop:app_scanner" size={44} />
      <div>
        <strong>สายในโรงพักส่งข้อความมา: คืนนี้สารวัตรขอหมายค้นแล้ว</strong>
        <p>
          {decoy
            ? 'โชคดีที่เบาะแสปลอมของคุณยังรออยู่ สารวัตรน่าจะไปผิดที่'
            : `ใช้เงินสกปรก ฿${fmt(state.dirtyCash)} ให้น้อยลงก่อนนอน หรือซื้อของที่ลบหลักฐานได้ แอปนี้ช่วยให้โดนยึดแค่ครึ่งเดียว`}
        </p>
      </div>
    </div>
  );
}

function Section({ icon, title, note, children, tone }: { icon: string; title: string; note?: string; children: ReactNode; tone?: string }) {
  return (
    <section className="shop-section" data-tone={tone}>
      <header className="shop-section-head">
        <Art id={icon} size={40} />
        <div>
          <h3>{title}</h3>
          {note && <p>{note}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

// ---------- ห้องลับ ----------
function Hideout({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const tier = hideoutTier(state);
  const hideout = item('hideout');
  const next = hideoutTiers[tier + 1];
  const price = hideout && next ? priceFor(state, hideout) : 0;
  const img = hideoutArtUrl(tier);
  return (
    <section className="hideout-card">
      <div className="hideout-art">
        {img ? <img src={img} alt="" /> : <span aria-hidden="true">🏚️</span>}
        <span className="hideout-tier" aria-label={`ห้องลับขั้น ${tier} จาก 3`}>
          {[1, 2, 3].map((n) => (
            <i key={n} data-on={n <= tier || undefined} />
          ))}
        </span>
      </div>
      <div className="hideout-body">
        <small>ห้องลับของคุณ</small>
        <h3>{hideoutTiers[tier]?.name}</h3>
        {next ? (
          <>
            <p>
              ขั้นถัดไป <b>{next.name}</b>: {next.perk}
            </p>
            <Button tone="sun" block disabled={money(state) < price} onClick={() => dispatch({ t: 'buy', itemId: 'hideout' })}>
              ย้ายฐาน ฿{fmt(price)}
            </Button>
          </>
        ) : (
          <p>ฐานใหญ่ที่สุดในซอยแล้ว เพื่อนบ้านเริ่มสงสัยว่าคุณทำงานอะไร</p>
        )}
      </div>
    </section>
  );
}

// ---------- ตลาดมืด ----------
function NightMarket({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const m = state.market;
  if (!m || m.day !== state.day) return null;
  return (
    <Section icon="icon:market" title="ตลาดมืดคืนนี้" note="ของเปลี่ยนทุกคืน ของหายากโผล่มานาน ๆ ที" tone="night">
      <div className="market-row">
        {m.offers.map((id) => {
          const it = item(id);
          if (!it) return null;
          const bought = m.bought.includes(id) || owned(state, id);
          const price = priceFor(state, it);
          const held = m.hold === id;
          return (
            <article key={id} className="market-card" data-rare={it.rare || undefined} data-sold={bought || undefined}>
              {it.rare && <span className="market-rare">ของหายาก</span>}
              {held && <span className="market-held">จองไว้ให้คืนพรุ่งนี้</span>}
              <Art id={`shop:${id}`} size={72} className="market-icon" />
              <h4>{lt(it.name)}</h4>
              <p>{lt(it.desc)}</p>
              <div className="market-actions">
                <Button tone={it.rare ? 'sun' : 'paper'} className="px-3 py-2 text-sm" disabled={bought || money(state) < price} onClick={() => dispatch({ t: 'buy', itemId: id })}>
                  {bought ? 'ได้แล้ว' : `฿${fmt(price)}`}
                </Button>
                {!bought && !m.hold && (
                  <button
                    type="button"
                    className="market-hold"
                    disabled={money(state) < holdPrice}
                    onClick={() => dispatch({ t: 'shopHold', itemId: id })}
                    aria-label={`จอง${lt(it.name)}ไว้คืนพรุ่งนี้ ราคา ${holdPrice} บาท`}
                  >
                    <Art id="icon:hold" size={22} /> จอง ฿{holdPrice}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

// ---------- ดีลเถื่อน ----------
function ShadyDeal({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const m = state.market;
  if (!m || m.day !== state.day || !m.deal) return null;
  const it = item(m.deal);
  if (!it) return null;
  const full = basePrice(state, it);
  const price = Math.round((full * (100 - dealDiscount)) / 100);
  const friend = isAlly(state, 'hia');
  const done = m.dealBought || owned(state, it.id);
  return (
    <Section icon="icon:deal" title="ดีลใต้โต๊ะของเฮียโต้ง" note="ลดครึ่งราคา คืนละชิ้น ไม่มีใบเสร็จ (มั้ง)" tone="deal">
      <div className="deal-card" data-done={done || undefined}>
        <div className="deal-box">
          <Art id={`shop:${it.id}`} size={64} />
        </div>
        <div className="deal-body">
          <h4>{lt(it.name)}</h4>
          <p>{lt(it.desc)}</p>
          <p className="deal-risk" data-safe={friend || undefined}>
            {friend
              ? 'เฮียเป็นพวกเรา ดีลนี้ไม่มีใครรู้'
              : `มีคนถ่ายรูปใบเสร็จไว้ หลักฐานบนบอร์ดคดี +${contrabandWeight}`}
          </p>
          <div className="deal-price">
            <s>฿{fmt(full)}</s>
            <Button tone="pink" className="px-3 py-2 text-sm" disabled={done || money(state) < price} onClick={() => dispatch({ t: 'shopDeal' })}>
              {done ? 'ปิดดีลแล้ว' : `รับดีล ฿${fmt(price)}`}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ---------- แอปมือถือ ----------
function PhoneApps({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const apps = content.shopItems.filter((it) => it.line === 'app');
  return (
    <Section icon="shop:new_phone" title="ร้านแอปใต้ดิน" note="ซื้อครั้งเดียว ติดเครื่องไปจนจบรอบ" tone="app">
      <div className="app-grid">
        {apps.map((it) => {
          const has = owned(state, it.id);
          const price = priceFor(state, it);
          return (
            <article key={it.id} className="app-tile" data-owned={has || undefined}>
              <Art id={`shop:${it.id}`} size={58} className="app-tile-icon" />
              <h4>{lt(it.name)}</h4>
              <p>{lt(it.desc)}</p>
              <Button tone={has ? 'paper' : 'mint'} className="w-full px-2 py-2 text-sm" disabled={has || money(state) < price} onClick={() => dispatch({ t: 'buy', itemId: it.id })}>
                {has ? 'ติดตั้งแล้ว' : `ติดตั้ง ฿${fmt(price)}`}
              </Button>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

// ---------- ของประจำสถานที่ ----------
function SoiGoods({ state, dispatch }: { state: GameState; dispatch: Dispatch }) {
  const goods = content.shopItems.filter((it) => it.line === 'place');
  const locked = placeIds.filter((pid) => !goods.some((it) => it.unlock?.place === pid && placeUnlocked(state, it)));
  return (
    <Section icon="shop:pl_market_local" title="ของจากซอย" note="สถานที่ที่เปลี่ยนไปแล้วจะมีของเฉพาะทางนั้นมาขาย" tone="soi">
      <div className="soi-goods">
        {locked.length > 0 && (
          <ul className="soi-locked" aria-label="ของที่ยังไม่ปลดล็อก">
            {locked.map((pid) => (
              <li key={pid}>
                <span>
                  {placeIcon[pid]} {places[pid].name}
                </span>
                <span className="soi-good-locked">
                  {goods
                    .filter((it) => it.unlock?.place === pid)
                    .map((it) => (
                      <span key={it.id} className="soi-good-ghost">
                        <Art id={`shop:${it.id}`} size={30} />
                      </span>
                    ))}
                </span>
              </li>
            ))}
            <p>ทำงานแถวไหนจนคนในซอยเรียกประชุม แล้วเลือกอนาคตของที่นั่น ของหนึ่งในสามชิ้นจะปลดล็อกตามทางที่เลือก</p>
          </ul>
        )}
        {placeIds.map((pid) => {
          const p = places[pid];
          const unlocked = goods.find((it) => it.unlock?.place === pid && placeUnlocked(state, it));
          if (!unlocked) return null;
          const has = owned(state, unlocked.id);
          const price = priceFor(state, unlocked);
          return (
            <article key={pid} className="soi-good" data-form={unlocked.unlock?.form}>
              <span className="soi-good-place">
                {placeIcon[pid]} {p.name} · {formLabel[unlocked.unlock?.form ?? 'local']}
              </span>
              <div className="soi-good-main">
                <Art id={`shop:${unlocked.id}`} size={64} />
                <div>
                  <h4>{lt(unlocked.name)}</h4>
                  <p>{lt(unlocked.desc)}</p>
                </div>
              </div>
              <Button tone={has ? 'paper' : 'sun'} block className="py-2 text-sm" disabled={has || money(state) < price} onClick={() => dispatch({ t: 'buy', itemId: unlocked.id })}>
                {has ? 'มีแล้ว' : `ซื้อ ฿${fmt(price)}`}
              </Button>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
