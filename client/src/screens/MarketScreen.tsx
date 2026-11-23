import { charKey } from '@hts/shared';
import { Art, Button, ScreenTitle } from '../components/ui';
import {
  AuditionNote,
  BuyButton,
  ownsCharacter,
  shopCharacters,
  WalletBar,
} from '../components/Underground';
import { useMarket } from '../game/market';
import { lt } from '../i18n';

/** ตลาดใต้ดิน: ใช้เงินใต้ดินรับตัวละครใหม่เข้าแก๊ง */
export function MarketScreen({ onBack }: { onBack: () => void }) {
  const market = useMarket();
  const p = market.progress;
  const crew = shopCharacters();
  const crewLeft = crew.filter((c) => !ownsCharacter(p, c.id)).length;
  return (
    <main className="market-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="eyebrow">UNDERGROUND / ตลาดใต้ดิน</div>
      <ScreenTitle
        title="ตลาดใต้ดิน"
        hint={`เงินใต้ดินได้จากทุกรอบที่จบ ไม่ว่าจะรอดหรือโดนจับ ใช้รับลูกทีมใหม่เข้าแก๊ง · รออยู่อีก ${crewLeft} คน`}
      />
      <WalletBar progress={p} />
      <div className="market-crew">
        {crew.map((c) => {
          const has = ownsCharacter(p, c.id);
          return (
            <article key={c.id} className="crew-card" data-owned={has || undefined}>
              <Art id={`char:${c.id}`} size={96} className="crew-portrait" />
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
      <Button tone="paper" onClick={onBack}>
        กลับ
      </Button>
    </main>
  );
}
