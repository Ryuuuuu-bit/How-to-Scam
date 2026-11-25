import { useState } from 'react';
import { auditionProgress, bountyRank, charKey } from '@hts/shared';
import type { Character, GameState } from '@hts/shared';
import { content } from '../game/content';
import { bountyText, moneyText } from '../game/bounty';
import type { BuyResult, useMarket } from '../game/market';
import type { Progress } from '../game/meta';
import { Art, Button } from './ui';
import './underground.css';

type Market = ReturnType<typeof useMarket>;

/** แถบค่าหัวกับเงินใต้ดิน */
export function WalletBar({
  progress,
  compact = false,
}: {
  progress: Progress;
  compact?: boolean;
}) {
  const rank = bountyRank(progress.xp);
  return (
    <div className="wallet-bar" data-compact={compact || undefined}>
      <div className="wallet-bounty">
        <Art id="icon:bounty" size={compact ? 34 : 48} />
        <div>
          <small>ค่าหัว</small>
          <b>{bountyText(progress.xp)}</b>
          {!compact && (
            <span>
              {rank.name}
              {rank.next &&
                ` · อีก ${bountyText(rank.next.xp - progress.xp)} เป็น "${rank.next.name}"`}
            </span>
          )}
        </div>
      </div>
      <div className="wallet-money">
        <Art id="icon:undermoney" size={compact ? 34 : 48} />
        <div>
          <small>เงินใต้ดิน</small>
          <b>{moneyText(progress.money)}</b>
        </div>
      </div>
    </div>
  );
}

const methodName = (id: string) => content.methods.find((m) => m.id === id)?.name.th ?? id;

/** ข้อความภารกิจออดิชั่น */
export function auditionText(ch: Character): string {
  const a = ch.audition;
  if (!a) return '';
  return a.kind === 'shifts'
    ? `ทำงาน${methodName(a.methodId)}ให้ครบ ${a.count} กะในรอบเดียว`
    : `ฟอกเงินสำเร็จ ${a.count} ครั้งในรอบเดียว`;
}

export function AuditionNote({ ch, state }: { ch: Character; state?: GameState }) {
  const p = state ? auditionProgress(state, ch) : null;
  return (
    <p className="audition-note">
      <Art id="icon:audition" size={22} />
      <span>
        <b>ออดิชั่นฟรี:</b> {auditionText(ch)} ด้วยตัวละครไหนก็ได้
        {p && ` (${p.done}/${p.need})`}
      </span>
    </p>
  );
}

const sorry: Record<Exclude<BuyResult, 'ok'>, string> = {
  poor: 'เงินใต้ดินยังไม่พอ เล่นอีกสักรอบนะ',
  error: 'ซื้อไม่สำเร็จ ลองใหม่อีกครั้ง',
};

/** ปุ่มซื้อของในตลาดใต้ดิน */
export function BuyButton({
  market,
  itemKey,
  label = 'ซื้อ',
  className = '',
}: {
  market: Market;
  itemKey: string;
  label?: string;
  className?: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const price = market.priceOf(itemKey);
  if (price === null) return null;
  const owned = market.progress.owned.includes(itemKey);
  const short = price - market.progress.money;
  const busy = market.busy === itemKey;
  return (
    <div className={`buy-wrap ${className}`}>
      <Button
        tone={owned ? 'paper' : short > 0 ? 'paper' : 'sun'}
        className="buy-button px-3 py-2 text-sm"
        disabled={owned || short > 0 || busy}
        onClick={async (e) => {
          e.stopPropagation();
          const r = await market.buy(itemKey);
          setMsg(r === 'ok' ? null : sorry[r]);
        }}
      >
        <Art id="icon:undermoney" size={22} />
        {owned ? 'มีแล้ว' : busy ? 'กำลังซื้อ…' : `${label} ${moneyText(price)}`}
      </Button>
      {!owned && short > 0 && <small className="buy-short">ขาดอีก {moneyText(short)}</small>}
      {msg && (
        <small role="alert" className="buy-short">
          {msg}
        </small>
      )}
    </div>
  );
}

/** ตัวละครที่ซื้อได้ทั้งหมด */
export const shopCharacters = () => content.characters.filter((c) => c.price !== undefined);
export const ownsCharacter = (p: Progress, id: string) => p.owned.includes(charKey(id));
