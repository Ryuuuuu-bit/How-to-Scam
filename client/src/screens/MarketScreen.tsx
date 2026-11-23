import { useState } from 'react';
import { charKey, cosmeticPrices } from '@hts/shared';
import { content } from '@hts/shared/data';
import { sceneUrl } from '../assets/art';
import { Art, Button, ScreenTitle } from '../components/ui';
import {
  AuditionNote,
  BuyButton,
  ownsCharacter,
  shopCharacters,
  WalletBar,
} from '../components/Underground';
import { characterArt, cosmeticKey, cosmeticUnlocked, menuScenes, skins } from '../game/cosmetics';
import { useMarket } from '../game/market';
import { lt } from '../i18n';

type Tab = 'crew' | 'style';

/** ตลาดใต้ดิน: ใช้เงินใต้ดินซื้อตัวละครและของแต่ง */
export function MarketScreen({ onBack }: { onBack: () => void }) {
  const market = useMarket();
  const [tab, setTab] = useState<Tab>('crew');
  const p = market.progress;
  const crew = shopCharacters();
  const looks = [
    ...menuScenes.filter((s) => Object.hasOwn(cosmeticPrices, cosmeticKey(s))),
    ...skins.filter((s) => Object.hasOwn(cosmeticPrices, cosmeticKey(s))),
  ];
  const crewLeft = crew.filter((c) => !ownsCharacter(p, c.id)).length;
  return (
    <main className="market-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="eyebrow">UNDERGROUND / ตลาดใต้ดิน</div>
      <ScreenTitle
        title="ตลาดใต้ดิน"
        hint="เงินใต้ดินได้จากทุกรอบที่จบ ไม่ว่าจะรอดหรือโดนจับ ใช้ซื้อลูกทีมใหม่และของแต่ง"
      />
      <WalletBar progress={p} />
      <div className="collection-filter" role="group" aria-label="หมวดของในตลาด">
        <button type="button" aria-pressed={tab === 'crew'} onClick={() => setTab('crew')}>
          ลูกทีมใหม่ · {crewLeft}
        </button>
        <button type="button" aria-pressed={tab === 'style'} onClick={() => setTab('style')}>
          ของแต่ง · {looks.filter((l) => !cosmeticUnlocked(l, p)).length}
        </button>
      </div>

      {tab === 'crew' ? (
        <div className="market-crew">
          {crew.map((c) => {
            const has = ownsCharacter(p, c.id);
            return (
              <article key={c.id} className="crew-card" data-owned={has || undefined}>
                <Art
                  id={characterArt(c.id, { scene: 'menu', skins: {} })}
                  size={96}
                  className="crew-portrait"
                />
                <div className="crew-body">
                  <h3>{lt(c.name)}</h3>
                  <p className="crew-desc">{lt(c.desc)}</p>
                  <p className="crew-pros">
                    <b>จุดเด่น:</b> {lt(c.pros)}
                  </p>
                  {has ? (
                    <p className="crew-owned">อยู่ในแก๊งแล้ว เลือกเล่นได้เลย</p>
                  ) : (
                    <>
                      <AuditionNote ch={c} />
                      <BuyButton market={market} itemKey={charKey(c.id)} label="รับเข้าแก๊ง" />
                    </>
                  )}
                </div>
              </article>
            );
          })}
          <p className="market-tip">ไม่อยากจ่าย? ลองตัวละครเหล่านี้ได้ฟรีใน Daily Challenge ก่อนตัดสินใจ</p>
        </div>
      ) : (
        <div className="market-style">
          {looks.map((item) => {
            const open = cosmeticUnlocked(item, p);
            const isSkin = 'characterId' in item;
            const owner = isSkin
              ? content.characters.find((c) => c.id === item.characterId)
              : undefined;
            return (
              <article key={item.id} className="style-card" data-owned={open || undefined}>
                {isSkin ? (
                  <Art id={`skin:${item.id}`} size={96} className="style-art" />
                ) : (
                  <img src={sceneUrl(item.scene)} alt="" className="style-scene" />
                )}
                <div>
                  <small>{isSkin ? `สกิน · ${owner ? lt(owner.name) : ''}` : 'ฉากเมนูหลัก'}</small>
                  <h3>{item.name}</h3>
                  <p>{open ? 'ได้แล้ว ใส่ได้ที่ห้องแต่งตัว' : `ซื้อเลย หรือรอจน${item.hint}`}</p>
                  {!open && <BuyButton market={market} itemKey={cosmeticKey(item)} />}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Button tone="paper" onClick={onBack}>
        กลับ
      </Button>
    </main>
  );
}
