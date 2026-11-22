import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { dailyArticles, markPaperRead, paperWasRead } from '../game/newspaper';
import { Art, Button } from './ui';

export function DailyNewspaper({
  state,
  autoOpen = false,
}: {
  state: GameState;
  autoOpen?: boolean;
}) {
  const articles = dailyArticles(state, content);
  const latest = articles.at(-1);
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open =
    opened || (autoOpen && !!latest && !dismissed && !paperWasRead(state.seed, latest.day));
  const [day, setDay] = useState(latest?.day ?? 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const article = articles.find((a) => a.day === day) ?? latest;
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const close = () => {
    if (latest) markPaperRead(state.seed, latest.day);
    setOpened(false);
    setDismissed(true);
    dialog.current?.close();
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={!latest}
        onClick={() => setOpened(true)}
        className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-sm font-semibold shadow-pop-sm disabled:opacity-50"
      >
        📰 {latest ? `ข่าววันที่ ${latest.day}` : 'ข่าวเริ่มหลังจบวันแรก'}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="paper-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-[3px] border-ink bg-paper p-5 text-ink shadow-pop backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between gap-3 border-b-4 border-ink pb-3">
          <div>
            <p className="eyebrow">ข่าวสมมติจากการเล่นของคุณ</p>
            <h2 id="paper-title" className="font-display text-2xl">
              เดลี่ต้มตุ๋น
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="ปิดหนังสือพิมพ์"
            className="rounded-full border-2 border-ink px-3 py-2"
          >
            ✕
          </button>
        </div>
        {article && (
          <article className="py-4">
            <label className="text-sm">
              ฉบับวันที่{' '}
              <select
                aria-label="เลือกฉบับข่าว"
                value={article.day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="rounded border border-ink bg-white px-2 py-1"
              >
                {articles.map((a) => (
                  <option key={a.day} value={a.day}>
                    วันที่ {a.day}
                  </option>
                ))}
              </select>
            </label>
            <figure className="my-3 flex items-center gap-4 rounded-2xl border-2 border-ink bg-sun/30 p-4">
              <Art id={article.image} size={96} />
              <figcaption className="text-sm">ภาพประกอบ: {article.caption}</figcaption>
            </figure>
            <h3 className="font-display text-2xl font-semibold leading-snug">{article.headline}</h3>
            <p className="mt-3 leading-relaxed">{article.body}</p>
            {article.events.length > 0 && (
              <div className="mt-4 border-t-2 border-ink pt-3">
                <h4 className="font-semibold">เกาะติดเรื่องในเมือง</h4>
                {article.events.map((event, i) => (
                  <p key={i} className="mt-2 text-sm">
                    {event}
                  </p>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-ink-soft">
              เรื่องราวทั้งหมดเป็นเรื่องแต่งในเกมเพื่อเสียดสีและให้ตระหนักถึงภัยมิจฉาชีพ
            </p>
          </article>
        )}
        <Button block tone="sun" onClick={close}>
          อ่านแล้ว เล่นต่อ
        </Button>
      </dialog>
    </>
  );
}
