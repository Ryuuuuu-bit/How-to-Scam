import { useEffect, useState } from 'react';
import {
  bestHome,
  homeKey,
  homes,
  marketRequires,
  outfitKey,
  outfits,
  ownsOutfit,
  type HomeDef,
  type OutfitId,
} from '@hts/shared';
import { ART } from '../assets/art';
import { audio } from '../audio/audio';
import { Art, Button, ScreenTitle } from '../components/ui';
import { BuyButton, WalletBar } from '../components/Underground';
import { loadOutfit, saveOutfit } from '../game/loadout';
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
export function HomeScreen({ onBack, onPlay }: { onBack: () => void; onPlay?: () => void }) {
  const { user } = useAuth();
  const market = useMarket();
  const p = market.progress;
  const home = bestHome(p.owned);
  const homeIdx = homes.findIndex((h) => h.id === home);
  const [outfit, setOutfit] = useState<OutfitId>(() => loadOutfit(user?.uid));
  const worn = ownsOutfit(p.owned, outfit) ? outfit : 'casual';
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
      audio.sfx(last.startsWith('home:') ? 'sfx_home_upgrade' : 'sfx_outfit_buy', 'level');
      setFlash(last);
    }
    setOwnedCount(p.owned.length);
  }, [p.owned, ownedCount]);

  const heroSrc = ART[`home:${home}`]?.src;
  return (
    <main className="home-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="eyebrow">SAFEHOUSE / บ้านกับตู้เสื้อผ้า</div>
      <ScreenTitle
        title="บ้านของฉัน"
        hint="เงินใต้ดินจากทุกรอบเอามาอัปเกรดบ้านและซื้อชุด ทุกอย่างติดตัวเข้ารอบถัดไป (ยกเว้น Daily Challenge)"
      />
      <WalletBar progress={p} compact />

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
                  onClick={() => {
                    setOutfit(o.id);
                    saveOutfit(o.id, user?.uid);
                    audio.sfx('sfx_outfit_wear', 'paper');
                  }}
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

      {onPlay && (
        <Button tone="sun" onClick={onPlay}>
          แต่งตัวเสร็จแล้ว ออกไปทำงานรอบใหม่
        </Button>
      )}
      <Button tone="paper" onClick={onBack}>
        กลับ
      </Button>
    </main>
  );
}
