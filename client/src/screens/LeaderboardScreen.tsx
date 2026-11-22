import { useEffect, useState } from 'react';
import { content } from '@hts/shared/data';
import { api } from '../net/api';
import type { BoardRow } from '../net/api';
import { useAuth } from '../net/auth';
import { fmt, lt, t } from '../i18n';
import { Art, Button, ScreenTitle } from '../components/ui';

type Board = 'top' | 'longest' | 'fastest' | 'daily';
const BOARDS: Board[] = ['daily', 'top', 'longest', 'fastest'];

export function LeaderboardScreen({
  onBack,
  initialBoard = 'top',
}: {
  onBack: () => void;
  initialBoard?: Board;
}) {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [season, setSeason] = useState<string>('');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .seasons()
      .then((r) => {
        if (!active) return;
        const ids = Array.from(new Set([r.current, ...r.seasons.map((s) => s.id)]));
        setSeasons(ids);
        setSeason((s) => s || r.current);
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!season) return;
    let active = true;
    setRows(null);
    setError(false);
    api
      .leaderboard(board, season)
      .then((r) => { if (active) setRows(r.rows); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [board, season, retry]);

  const titleName = (id: string) => {
    const tt = content.titles.find((x) => x.id === id);
    return tt ? lt(tt.name) : '';
  };

  return (
    <main className="collection-screen mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <ScreenTitle title={t('leaderboard.title')} />
      <div className="mb-2">
        {seasons.length > 0 && board !== 'daily' && (
          <select
            aria-label="ซีซันกระดานคะแนน"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="font-display rounded-xl border-2 border-ink bg-white px-2 py-1 text-sm text-ink"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {t('leaderboard.season', { s })}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {BOARDS.map((b) => (
          <button
            aria-pressed={b === board}
            key={b}
            type="button"
            onClick={() => setBoard(b)}
            className={`font-display min-h-11 rounded-xl border-2 border-ink px-1 py-2 text-xs leading-tight text-ink ${b === board ? 'bg-sun shadow-pop-sm' : 'bg-paper'}`}
          >
            {t(`leaderboard.boards.${b}`)}
          </button>
        ))}
      </div>
      {error && <div className="grid justify-items-center gap-2" role="status">
        <p>{t('leaderboard.error')}</p>
        <Button tone="paper" onClick={() => { setError(false); setRetry(n => n + 1); }}>โหลดอันดับอีกครั้ง</Button>
      </div>}
      {!error && rows === null && <p role="status" className="text-center">กำลังโหลดอันดับ…</p>}
      {rows?.length === 0 && <p className="text-center text-ink-soft">{t('leaderboard.empty')}</p>}
      <ol className="flex flex-col gap-2 pb-24">
        {rows?.map((r) => {
          const me = r.userId === user?.uid;
          return (
            <li
              key={r.userId}
              className={`flex items-center gap-2 rounded-2xl border-2 border-ink p-2 text-ink ${me ? 'bg-sun' : 'bg-paper'}`}
            >
              <span className="font-display w-8 text-center text-lg font-semibold">
                {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
              </span>
              <Art id={`char:${r.characterId}`} size={40} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">
                  {r.displayName}
                  {me && <span className="ml-1 text-xs text-grape">({t('leaderboard.you')})</span>}
                </div>
                <div className="truncate text-xs text-ink-soft">{titleName(r.titleId)}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-semibold text-pink">
                  {board === 'top' || board === 'daily'
                    ? fmt(r.score)
                    : t('leaderboard.days', { n: r.days })}
                </div>
                {board !== 'top' && board !== 'daily' && (
                  <div className="text-xs text-ink-soft">{fmt(r.score)}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-ink bg-cream/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto max-w-md">
          <Button tone="paper" block onClick={onBack}>
            {t('leaderboard.back')}
          </Button>
        </div>
      </div>
    </main>
  );
}
