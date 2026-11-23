import { useEffect, useState } from 'react';
import { content } from '@hts/shared/data';
import { api } from '../net/api';
import type { DailyInfo } from '../net/api';
import { fmt, lt, t } from '../i18n';
import { Art, Button, Panel, ScreenTitle } from '../components/ui';
import { SceneBackdrop } from '../components/SceneBackdrop';
import { usePlayerPortrait } from '../game/usePlayerPortrait';

/** Daily Challenge: seed ร่วมของวันนี้ อาชีพเดียวกันทุกคน นับวันละรอบ */
export function DailyScreen({
  onPlay,
  onBoard,
  onBack,
}: {
  onPlay: (r: { runId: string; seed: string; characterId: string }) => void;
  onBoard: () => void;
  onBack: () => void;
}) {
  const [info, setInfo] = useState<DailyInfo | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .daily()
      .then(setInfo)
      .catch(() => setError(true));
  }, []);

  const ch = info ? content.characters.find((c) => c.id === info.characterId) : undefined;
  const portrait = usePlayerPortrait(ch?.id ?? '');
  const start = async () => {
    setBusy(true);
    try {
      onPlay(await api.dailyStart());
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-3 px-4 pt-8 pb-[max(env(safe-area-inset-bottom),24px)]">
      <SceneBackdrop id="plan" />
      <div className="relative z-10">
        <ScreenTitle title={t('daily.title')} hint={t('daily.hint')} />
      </div>
      {info && ch && (
        <Panel className="relative z-10 flex flex-col items-center gap-2 text-center text-ink">
          <div className="font-display text-sm text-ink-soft">
            {t('daily.date', { d: info.date })} · รอบ 30 วัน
          </div>
          <Art id={portrait} size={120} />
          <div className="text-xs text-ink-soft">{t('daily.job')}</div>
          <div className="font-display text-xl font-semibold">{lt(ch.name)}</div>
          <div className="text-xs">
            <span className="text-clean">{lt(ch.pros)}</span> ·{' '}
            <span className="text-danger">{lt(ch.cons)}</span>
          </div>
          {info.status === 'done' && info.result ? (
            <div className="font-display mt-1 rounded-xl bg-sun px-3 py-1">
              🏆 {t('daily.done', { n: fmt(info.result.score), r: info.result.rank })}
            </div>
          ) : (
            <Button tone="pink" block disabled={busy} onClick={() => void start()}>
              {info.status === 'started' ? t('daily.resume') : t('daily.play')}
            </Button>
          )}
        </Panel>
      )}
      {error && (
        <p className="relative z-10 rounded-xl bg-white p-2 text-center text-sm text-danger">
          {t('daily.failed')}
        </p>
      )}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <Button tone="paper" onClick={onBack}>
          {t('daily.back')}
        </Button>
        <Button tone="grape" onClick={onBoard}>
          🏆 {t('daily.board')}
        </Button>
      </div>
    </main>
  );
}
