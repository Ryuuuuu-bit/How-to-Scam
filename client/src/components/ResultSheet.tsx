import { useEffect, useRef } from 'react';
import type { ResultLine } from '../game/results';
import { t } from '../i18n';
import { Art } from './ui';
import { PopupButton } from './PopupControls';

const toneBg = { good: 'bg-[#e6fbf5]', bad: 'bg-[#ffe9ea]', neutral: 'bg-white' } as const;

/** แผ่นสรุปผลที่เด้งขึ้นจากด้านล่างหลังทุกการตัดสินใจ */
export function ResultSheet({ lines, onClose }: { lines: ResultLine[]; onClose: () => void }) {
  const good = lines.some((l) => l.tone === 'good' && l.art === 'icon:dirty');
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="result-overlay fixed inset-0 z-40 flex items-end justify-center p-3"
      onClick={onClose}
    >
      {good && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center gap-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="anim-coin text-3xl" style={{ animationDelay: `${i * 0.12}s` }}>
              🪙
            </span>
          ))}
        </div>
      )}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="ผลการตัดสินใจ"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Tab') {
            e.preventDefault();
            panel.current?.querySelector('button')?.focus();
          }
        }}
        className="result-panel anim-rise-in w-full max-w-md rounded-3xl border-2 border-ink bg-paper p-5 shadow-pop pb-[max(env(safe-area-inset-bottom),20px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`anim-rise-in flex items-start gap-3 rounded-2xl border-2 border-ink p-3 ${toneBg[l.tone]}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {l.art && <Art id={l.art} size={44} className="shrink-0" />}
              <div>
                <div className="font-display text-base leading-snug font-medium">{l.title}</div>
                {l.body && <div className="mt-0.5 text-sm text-ink-soft">{l.body}</div>}
              </div>
            </div>
          ))}
        </div>
        <PopupButton icon="→" className="mt-4 w-full" onClick={onClose} autoFocus>
          {t('result.continue')}
        </PopupButton>
      </div>
    </div>
  );
}
