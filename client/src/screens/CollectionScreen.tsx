import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { VictimCardView } from '../components/Collection';
import { Art, Button, ScreenTitle } from '../components/ui';
import { allCardIds, loadScrapbook, questDone, rankCtx, soiRankIndex, soiRanks } from '../game/collection';
import { useMarket } from '../game/market';
import { useAuth } from '../net/auth';
import '../components/collection.css';

/** สมุดภาพการ์ดเหยื่อกับบันไดยศในซอย */
export function CollectionScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const market = useMarket();
  const owned = market.progress.owned;
  const [tab, setTab] = useState<'rank' | 'book'>('rank');
  const ctx = rankCtx(user, owned);
  const current = soiRankIndex(ctx);
  const book = loadScrapbook(user);

  useEffect(() => {
    audio.setTrack('bgm_home');
    return () => audio.setTrack(null);
  }, []);

  return (
    <main className="collection-screen mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="eyebrow">SOI RECORD / ยศในซอยกับสมุดภาพ</div>
      <ScreenTitle
        title="ยศในซอยกับสมุดภาพ"
        hint="ทำภารกิจข้ามรอบเพื่อเลื่อนยศ และเก็บการ์ดเหยื่อทุกคนที่เคยรับสายคุณ"
      />
      <div className="collection-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'rank'} onClick={() => setTab('rank')}>
          ยศในซอย
        </button>
        <button type="button" role="tab" aria-selected={tab === 'book'} onClick={() => setTab('book')}>
          สมุดภาพเหยื่อ {ctx.cards}/{allCardIds.length}
        </button>
      </div>

      {tab === 'rank' ? (
        <ol className="rank-ladder">
          {soiRanks.map((r, i) => (
            <li key={r.id} className="rank-step" data-state={i < current ? 'past' : i === current ? 'now' : 'next'}>
              <Art id={`rank:${r.id}`} size={72} className={i > current ? 'rank-locked' : ''} />
              <div className="rank-body">
                <h3>
                  <span className="rank-no">ยศ {i + 1}</span> {r.name}
                  {i === current && <em>ยศของคุณ</em>}
                </h3>
                <p>{r.blurb}</p>
                {r.quests.length > 0 && (
                  <ul className="rank-quests">
                    {r.quests.map((q) => {
                      const done = questDone(q, ctx);
                      return (
                        <li key={q.label} data-done={done || undefined}>
                          <span>{done ? '✓' : '○'}</span> {q.label}
                          {!done && q.need > 1 && (
                            <small>
                              {' '}
                              ({Math.min(q.have(ctx), q.need)}/{q.need})
                            </small>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <section className="scrapbook">
          <p className="scrapbook-note">
            ทุกใบคือคนจริงที่อาจเป็นแม่ ยาย หรือเพื่อนคุณ ในชีวิตจริงถ้ามีคนโทรมาเร่งให้โอนเงิน วางสายแล้วโทรกลับเบอร์ทางการเสมอ
          </p>
          <div className="vcard-grid">
            {allCardIds.map((id) => (
              <VictimCardView key={id} id={id} card={book[id]} />
            ))}
          </div>
        </section>
      )}

      <Button tone="paper" onClick={onBack}>
        กลับ
      </Button>
    </main>
  );
}
