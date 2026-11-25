import { useEffect, useState } from 'react';
import type { GameState } from '@hts/shared';
import { content } from '../game/content';
import { audio } from '../audio/audio';
import {
  allCardIds,
  cardsFromRun,
  collectCards,
  loadScrapbook,
  rankCtx,
  recordRun,
  soiRankIndex,
  soiRanks,
  type VictimCard,
} from '../game/collection';
import { lt } from '../i18n';
import { clipWords } from '../i18n/thaiBreak';
import { useAuth } from '../net/auth';
import { Art } from './ui';
import './collection.css';

/** เก็บการ์ดเหยื่อทุกครั้งที่มีผลการโทร (ไม่แสดงอะไร) */
export function CardCollector({ state }: { state: GameState }) {
  const { user } = useAuth();
  useEffect(() => {
    if (collectCards(state, user).length > 0) audio.sfx('sfx_card_collect', 'paper');
  }, [state.lastResults, state.seed, user?.uid]);
  return null;
}

const trapNames: Record<string, { name: string; note: string }> = {
  baiter: { name: 'นักแกล้งมิจฯ ตัวพ่อ', note: 'โทรไปหลอก กลับโดนหลอกคืนพร้อมไลฟ์สด' },
  undercover: { name: 'ตำรวจล่อซื้อเสียงหวาน', note: 'คุยดีเกินไป ถามละเอียดเกินไป แล้วก็จริงด้วย' },
};

export function cardTitle(id: string): string {
  if (id in trapNames) return trapNames[id]?.name ?? id;
  const idx = Number(id.slice(1));
  return lt(content.victimParts.names[idx] ?? { th: '?' });
}

export function VictimCardView({ id, card, fresh }: { id: string; card?: VictimCard; fresh?: boolean }) {
  if (!card) {
    return (
      <div className="vcard vcard-empty" aria-label="การ์ดที่ยังไม่ได้">
        <span>?</span>
      </div>
    );
  }
  const trap = trapNames[id];
  const pitch = content.pitches.find((p) => p.id === card.pitchId);
  return (
    <figure className="vcard" data-trap={trap ? '' : undefined} data-fresh={fresh || undefined}>
      <div className="vcard-photo">
        <Art id={trap ? `victim:${id}` : `victim:${card.portrait}`} size={96} />
        <span className="vcard-stamp" data-won={card.won || undefined}>
          {trap ? 'โดนซ้อน' : card.won ? 'หลอกสำเร็จ' : 'เหยื่อรอดตัว'}
        </span>
      </div>
      <figcaption>
        <b>{cardTitle(id)}</b>
        <small>{trap ? trap.note : pitch ? `มุก: ${clipWords(lt(pitch.text), 48)}` : ''}</small>
      </figcaption>
    </figure>
  );
}

/** สรุปการ์ดใหม่และยศในซอยตอนจบรอบ */
export function RunCollection({ state, owned }: { state: GameState; owned: readonly string[] }) {
  const { user } = useAuth();
  const [info] = useState(() => {
    collectCards(state, user);
    // ยศก่อนรอบนี้: ยังไม่นับรอบนี้ และไม่นับการ์ดที่ได้ในรอบนี้
    const prev = rankCtx(user, owned);
    const thisRun = cardsFromRun(loadScrapbook(user), state.seed).length;
    const counted = prev.career.seeds.includes(state.seed);
    const before = counted ? soiRankIndex(prev) : soiRankIndex({ ...prev, cards: prev.cards - thisRun });
    recordRun(state, user);
    const ctx = rankCtx(user, owned);
    const book = loadScrapbook(user);
    return { book, fresh: cardsFromRun(book, state.seed), before, after: soiRankIndex(ctx), cards: ctx.cards };
  });
  const rankedUp = info.after > info.before;
  useEffect(() => {
    if (rankedUp) audio.sfx('sfx_rank_up', 'level');
  }, [rankedUp]);
  if (info.fresh.length === 0 && !rankedUp) return null;
  return (
    <div className="run-collection anim-rise-in">
      {rankedUp && (
        <div className="rank-up">
          <Art id={`rank:${soiRanks[info.after]?.id}`} size={64} />
          <div>
            <small>เลื่อนยศในซอย</small>
            <b>{soiRanks[info.after]?.name}</b>
          </div>
        </div>
      )}
      {info.fresh.length > 0 && (
        <>
          <div className="font-display text-center">
            การ์ดเหยื่อใหม่ {info.fresh.length} ใบ · สมุดภาพ {info.cards}/{allCardIds.length}
          </div>
          <div className="vcard-row">
            {info.fresh.slice(0, 6).map((id) => (
              <VictimCardView key={id} id={id} card={info.book[id]} fresh />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** ป้ายยศในซอยบนเมนู */
export function RankChip({ owned, onClick }: { owned: readonly string[]; onClick?: () => void }) {
  const { user } = useAuth();
  const rank = soiRanks[soiRankIndex(rankCtx(user, owned))];
  if (!rank) return null;
  return (
    <button type="button" className="rank-chip" onClick={onClick} aria-label={`ยศในซอย: ${rank.name}`}>
      <Art id={`rank:${rank.id}`} size={28} />
      <span>{rank.name}</span>
    </button>
  );
}
