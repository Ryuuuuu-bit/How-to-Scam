import { useEffect, useState, type ReactNode } from 'react';
import {
  bestHome,
  carKey,
  cars,
  homeKey,
  homes,
  marketRequires,
  outfitKey,
  outfits,
  ownsCar,
  ownsOutfit,
  ownsPet,
  petKey,
  pets,
  reformKey,
  type HomeDef,
  type LoadoutPick,
} from '@hts/shared';
import { ART } from '../assets/art';
import { audio } from '../audio/audio';
import { Art, Button, ScreenTitle } from '../components/ui';
import { BuyButton, WalletBar } from '../components/Underground';
import { loadPick, savePick } from '../game/loadout';
import { RankChip } from '../components/Collection';
import { useMarket } from '../game/market';
import { useAuth } from '../net/auth';
import './home.css';

function homePerks(h: HomeDef): string[] {
  const out: string[] = [];
  if (h.quietHeat) out.push(`วันพัก Heat ลดเพิ่ม ${h.quietHeat}`);
  if (h.escapePct) out.push(`หนีตำรวจรอด +${h.escapePct}%`);
  if (h.escapeHeat) out.push(`หนีรอดแล้ว Heat ต่ำลงอีก ${h.escapeHeat}`);
  return out.length ? out : ['ยังไม่มีโบนัส ประหยัดไว้ก่อน'];
}

/** บ้านกับตู้เสื้อผ้า: ใช้เงินใต้ดินอัปเกรดบ้านและซื้อชุด ติดตัวเข้ารอบถัดไป */
export function HomeScreen({
  onBack,
  onPlay,
  onCollection,
}: {
  onBack: () => void;
  onPlay?: () => void;
  onCollection?: () => void;
}) {
  const { user } = useAuth();
  const market = useMarket();
  const p = market.progress;
  const home = bestHome(p.owned);
  const homeIdx = homes.findIndex((h) => h.id === home);
  const [pick, setPick] = useState(() => loadPick(user?.uid));
  const choose = (next: LoadoutPick, sfx: string) => {
    setPick(savePick(next, user?.uid));
    audio.sfx(sfx, 'paper');
  };
  const worn = ownsOutfit(p.owned, pick.outfit) ? pick.outfit : 'casual';
  const pet = ownsPet(p.owned, pick.pet) ? pick.pet : 'none';
  const car = ownsCar(p.owned, pick.car) ? pick.car : 'none';
  const hasReform = p.owned.includes(reformKey);
  const reform = hasReform && pick.reform;
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    audio.setTrack('bgm_home');
    return () => audio.setTrack(null);
  }, []);

  // เสียงตอนได้บ้านใหม่หรือชุดใหม่
  const [ownedCount, setOwnedCount] = useState(p.owned.length);
  useEffect(() => {
    if (p.owned.length > ownedCount) {
      const last = p.owned.at(-1) ?? '';
      const [kind, id] = last.split(':');
      const buySfx: Record<string, string> = {
        home: 'sfx_home_upgrade',
        pet: `sfx_pet_${id}`,
        car: 'sfx_car_rev',
        reform: 'sfx_achievement',
      };
      audio.sfx(buySfx[kind ?? ''] ?? 'sfx_outfit_buy', 'level');
      setFlash(last);
    }
    setOwnedCount(p.owned.length);
  }, [p.owned, ownedCount]);

  const heroSrc = ART[`home:${home}`]?.src;
  return (
    <main className="home-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="eyebrow">SAFEHOUSE / บ้าน รถ สัตว์เลี้ยง ตู้เสื้อผ้า</div>
      <ScreenTitle
        title="บ้านของฉัน"
        hint="เงินใต้ดินจากทุกรอบเอามาอัปเกรดบ้าน ซื้อชุด รถ และสัตว์เลี้ยง ทุกอย่างติดตัวเข้ารอบถัดไป (ยกเว้น Daily Challenge)"
      />
      <div className="flex flex-wrap items-center gap-2">
        <RankChip owned={p.owned} onClick={onCollection} />
        <WalletBar progress={p} compact />
      </div>

      <section className="home-hero" data-home={home}>
        {heroSrc ? <img src={heroSrc} alt={homes[homeIdx]?.name ?? ''} /> : <div className="home-hero-empty" />}
        <div className="home-hero-tag">
          <small>ตอนนี้อยู่ที่</small>
          <b>{homes[homeIdx]?.name}</b>
        </div>
        <div className="home-hero-fit">
          <Art id={`outfit:${worn}`} size={84} />
          <span>{outfits.find((o) => o.id === worn)?.name}</span>
        </div>
        {(pet !== 'none' || car !== 'none' || reform) && (
          <div className="home-hero-crew">
            {pet !== 'none' && <Art id={`pet:${pet}`} size={44} />}
            {car !== 'none' && <Art id={`car:${car}`} size={44} />}
            {reform && <Art id="icon:reform" size={44} />}
          </div>
        )}
      </section>

      <h2 className="font-display text-xl">อัปเกรดบ้าน</h2>
      <p className="-mt-2 text-sm text-ink-soft">
        บ้านยิ่งดี ยิ่งกบดานง่าย ตำรวจตามตัวยากขึ้น ต้องย้ายทีละขั้น ห้องเช่า → คอนโด → บ้านเดี่ยว
      </p>
      <div className="home-ladder">
        {homes.map((h, i) => {
          const has = i <= homeIdx;
          const need = marketRequires(homeKey(h.id));
          const locked = !has && need !== null && !p.owned.includes(need);
          return (
            <article
              key={h.id}
              className="home-card"
              data-current={h.id === home || undefined}
              data-owned={has || undefined}
              data-flash={flash === homeKey(h.id) || undefined}
            >
              <div className="home-card-art">
                {ART[`home:${h.id}`]?.src ? (
                  <img src={ART[`home:${h.id}`]?.src} alt="" />
                ) : (
                  <Art id={`home:${h.id}`} size={64} />
                )}
                <span className="home-step">ขั้น {i + 1}</span>
              </div>
              <div className="home-card-body">
                <h3>{h.name}</h3>
                <p className="home-desc">{h.desc}</p>
                <ul className="home-perks">
                  {homePerks(h).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {h.id === home ? (
                  <p className="home-badge">🏠 อยู่ที่นี่</p>
                ) : has ? (
                  <p className="home-badge home-badge-old">ย้ายออกมาแล้ว</p>
                ) : locked ? (
                  <p className="home-badge home-badge-old">🔒 ต้องมีคอนโดก่อน</p>
                ) : (
                  <BuyButton market={market} itemKey={homeKey(h.id)} label="ย้ายเข้า" />
                )}
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="font-display text-xl">ตู้เสื้อผ้า</h2>
      <p className="-mt-2 text-sm text-ink-soft">
        ใส่ได้ทีละชุด ชุดที่ใช่ทำให้เหยื่อเชื่อง่ายขึ้น เลือกให้เข้ากับงานที่จะทำในรอบหน้า
      </p>
      {ART['home:closet']?.src && (
        <img className="wardrobe-banner" src={ART['home:closet']?.src} alt="" />
      )}
      <div className="wardrobe-rack">
        {outfits.map((o) => {
          const has = ownsOutfit(p.owned, o.id);
          const on = worn === o.id;
          return (
            <article
              key={o.id}
              className="outfit-card"
              data-on={on || undefined}
              data-owned={has || undefined}
              data-flash={flash === outfitKey(o.id) || undefined}
            >
              <div className="outfit-hanger" aria-hidden />
              <Art id={`outfit:${o.id}`} size={132} className={has ? 'outfit-art' : 'outfit-art outfit-art-locked'} />
              <h3>{o.name}</h3>
              <p className="outfit-effect">{o.effect}</p>
              <p className="outfit-desc">{o.desc}</p>
              {has ? (
                <Button
                  tone={on ? 'mint' : 'paper'}
                  className="px-3 py-2 text-sm"
                  aria-pressed={on}
                  disabled={on}
                  onClick={() => choose({ outfit: o.id }, 'sfx_outfit_wear')}
                >
                  {on ? '✓ ใส่อยู่' : 'ใส่ชุดนี้'}
                </Button>
              ) : (
                <BuyButton market={market} itemKey={outfitKey(o.id)} />
              )}
            </article>
          );
        })}
      </div>

      <h2 className="font-display text-xl">สัตว์เลี้ยง</h2>
      <p className="-mt-2 text-sm text-ink-soft">พาไปด้วยได้ทีละตัว แต่ละตัวช่วยงานคนละแบบ</p>
      <div className="pick-grid">
        {pets
          .filter((x) => x.id !== 'none')
          .map((x) => (
            <PickCard
              key={x.id}
              art={`pet:${x.id}`}
              name={x.name}
              effect={x.effect}
              desc={x.desc}
              owned={ownsPet(p.owned, x.id)}
              on={pet === x.id}
              flash={flash === petKey(x.id)}
              buy={<BuyButton market={market} itemKey={petKey(x.id)} />}
              onToggle={() => choose({ pet: pet === x.id ? 'none' : x.id }, `sfx_pet_${x.id}`)}
              onLabel="✓ พาไปด้วย"
              offLabel="พาไปด้วย"
            />
          ))}
      </div>

      <h2 className="font-display text-xl">โรงรถ</h2>
      <p className="-mt-2 text-sm text-ink-soft">รถช่วยหนีตำรวจ แต่คันที่เด่นเกินไปก็ทำให้คนจำได้</p>
      <div className="pick-grid">
        {cars
          .filter((x) => x.id !== 'none')
          .map((x) => (
            <PickCard
              key={x.id}
              art={`car:${x.id}`}
              name={x.name}
              effect={x.effect}
              desc={x.desc}
              owned={ownsCar(p.owned, x.id)}
              on={car === x.id}
              flash={flash === carKey(x.id)}
              buy={<BuyButton market={market} itemKey={carKey(x.id)} />}
              onToggle={() => choose({ car: car === x.id ? 'none' : x.id }, 'sfx_car_rev')}
              onLabel="✓ ขับคันนี้"
              offLabel="ขับคันนี้"
            />
          ))}
      </div>

      <h2 className="font-display text-xl">ทางกลับใจ</h2>
      <section className="reform-card" data-on={reform || undefined} data-flash={flash === reformKey || undefined}>
        <Art id="misc:honest_shop" size={140} className="reform-art" />
        <div className="reform-body">
          <h3>ทุนเปิดร้านสุจริต</h3>
          <p>
            เก็บเงินก้อนนี้ไว้เปิดร้านของตัวเองหลังวางมือ รอบที่ตั้งใจกลับใจ เริ่มด้วยกรรมดี +5 แต่รายได้ทุกงาน −10%
            ถ้าอยู่รอดจนจบรอบโดยกรรมไม่ติดลบ จะได้ฉากจบใหม่ “ร้านสุจริต”
          </p>
          {hasReform ? (
            <Button
              tone={reform ? 'mint' : 'paper'}
              className="px-3 py-2 text-sm"
              aria-pressed={reform}
              onClick={() => choose({ reform: !reform }, reform ? 'sfx_outfit_wear' : 'sfx_achievement')}
            >
              {reform ? '✓ รอบหน้าตั้งใจกลับใจ' : 'รอบหน้าตั้งใจกลับใจ'}
            </Button>
          ) : (
            <BuyButton market={market} itemKey={reformKey} label="เก็บทุน" />
          )}
        </div>
      </section>

      {onPlay && (
        <Button tone="sun" onClick={onPlay}>
          พร้อมแล้ว ออกไปทำงานรอบใหม่
        </Button>
      )}
      <Button tone="paper" onClick={onBack}>
        กลับ
      </Button>
    </main>
  );
}

function PickCard({
  art,
  name,
  effect,
  desc,
  owned,
  on,
  flash,
  buy,
  onToggle,
  onLabel,
  offLabel,
}: {
  art: string;
  name: string;
  effect: string;
  desc: string;
  owned: boolean;
  on: boolean;
  flash: boolean;
  buy: ReactNode;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <article className="pick-card" data-on={on || undefined} data-owned={owned || undefined} data-flash={flash || undefined}>
      <Art id={art} size={120} className={owned ? 'pick-art' : 'pick-art outfit-art-locked'} />
      <div className="pick-body">
        <h3>{name}</h3>
        <p className="outfit-effect">{effect}</p>
        <p className="outfit-desc">{desc}</p>
        {owned ? (
          <Button tone={on ? 'mint' : 'paper'} className="px-3 py-2 text-sm" aria-pressed={on} onClick={onToggle}>
            {on ? onLabel : offLabel}
          </Button>
        ) : (
          buy
        )}
      </div>
    </article>
  );
}
