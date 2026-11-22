import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import type { Action, GameState } from '@hts/shared';
import { useSubmitRun } from '../game/submit';
import { shareCard } from '../game/shareCard';
import { awardRun } from '../game/meta';
import { content } from '@hts/shared/data';
import { fmt, lt, t } from '../i18n';
import { Art, Button, Panel } from '../components/ui';
import { EndingCard } from '../components/EndingCard';
import { DailyNewspaper } from '../components/DailyNewspaper';
import { ClosingEdition } from '../components/ClosingEdition';

export function EndScreen({
  state,
  runId,
  actions,
  onAgain,
  onMenu,
}: {
  state: GameState;
  runId?: string | undefined;
  actions: Action[];
  onAgain: () => void;
  onMenu: () => void;
}) {
  const submit = useSubmitRun(runId, actions);
  // รอบออฟไลน์: ให้แต้มแก๊งในเครื่อง (รอบออนไลน์ server เป็นคนให้)
  const [localAward] = useState(() =>
    runId
      ? { gained: 0, unlocked: [] as typeof content.characters, newAchievements: [] as string[] }
      : awardRun(state),
  );
  const [sharing, setSharing] = useState<'idle' | 'making' | 'saved'>('idle');
  const award =
    submit.state.kind === 'ok'
      ? {
          gained: submit.state.result.xpGained,
          unlocked: content.characters.filter((c) =>
            submit.state.kind === 'ok' ? submit.state.result.unlocked.includes(c.id) : false,
          ),
          newAchievements: submit.state.result.newAchievements,
        }
      : localAward;
  const okResult = submit.state.kind === 'ok' ? submit.state.result : undefined;
  const newAch = content.achievements.filter((a) => award.newAchievements.includes(a.id));
  useEffect(() => {
    audio.setDanger(false);
    if (state.end?.reason === 'caught') audio.sfx('sfx_jail', 'jail');
    else if (!content.endings.find(e => e.id === state.end?.endingId)?.when.retirementLife) audio.sfx('sfx_coins', 'end');
  }, []);
  const end = state.end;
  if (!end) return null;
  const signs = end.dangerSignIds
    .map((id) => content.dangerSigns.find((d) => d.id === id))
    .filter((d) => d !== undefined);
  const days = end.reason === 'survived' ? content.config.maxDays : state.day;

  return (
    <main className="end-screen mx-auto flex min-h-dvh flex-col gap-4 px-4 py-6">
      <div className="eyebrow text-center">CASE CLOSED / บทสรุปของคุณ</div>
      <div className="anim-rise-in text-center">
        <span className="font-display inline-block rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm text-ink">
          {t(`end.reason.${end.reason}`)}
        </span>
      </div>

      <EndingCard state={state} />

      <Panel className="anim-rise-in text-center" tone="paper">
        <div className="text-sm text-ink-soft">{t('end.score')}</div>
        <div className="font-display text-5xl font-semibold text-pink">{fmt(end.score)}</div>
        <div className="mt-1 text-sm">
          {t('end.clean', { n: state.cleanCash })} · {t('end.days', { n: days })}
        </div>
      </Panel>

      <SubmitBanner state={submit.state} onRetry={() => void submit.retry()} />
      <div className="grid grid-cols-2 gap-3">
        <Button tone="paper" onClick={onMenu}>{t('end.menu')}</Button>
        <Button tone="pink" onClick={onAgain}>{t('end.again')}</Button>
      </div>
      <ClosingEdition state={state} />
      <DailyNewspaper state={state} />

      {newAch.length > 0 && (
        <div className="anim-rise-in rounded-2xl border-[3px] border-ink bg-sun p-3 text-center text-ink shadow-pop">
          <div className="font-display text-lg">🎖️ {t('achievements.newTitle')}</div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {newAch.map((a) => (
              <span
                key={a.id}
                className="rounded-full border-2 border-ink bg-white px-2 py-0.5 text-sm"
              >
                {a.icon} {lt(a.name)}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        tone="grape"
        block
        disabled={sharing === 'making'}
        onClick={() => {
          setSharing('making');
          shareCard({
            state,
            titleId: okResult?.titleId,
            rank: okResult?.rank,
            daily: okResult?.dailyDate,
          })
            .then((r) => setSharing(r === 'saved' ? 'saved' : 'idle'))
            .catch((e: unknown) => {
              console.error('share card failed', e);
              setSharing('idle');
            });
        }}
      >
        📸{' '}
        {sharing === 'making'
          ? t('share.making')
          : sharing === 'saved'
            ? t('share.saved')
            : t('share.button')}
      </Button>

      {(award.gained > 0 || award.unlocked.length > 0) && (
        <div className="anim-rise-in flex flex-col gap-1 rounded-2xl border-[3px] border-ink bg-grape p-3 text-center text-white shadow-pop">
          {award.gained > 0 && (
            <div className="font-display text-lg">⭐ {t('end.xpGain', { n: award.gained })}</div>
          )}
          {award.unlocked.map((c) => (
            <div key={c.id} className="font-display flex items-center justify-center gap-2">
              <Art id={`char:${c.id}`} size={40} />
              {t('end.unlocked', { name: lt(c.name) })}
            </div>
          ))}
        </div>
      )}

      <section className="anim-rise-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <Art id="danger" size={28} />
          {t('end.dangerTitle')}
        </h3>
        <p className="mb-2 text-sm text-ink-soft">{t('end.dangerHint')}</p>
        <div className="flex flex-col gap-3">
          {signs.map((d) => (
            <div key={d.id} className="rounded-3xl border-[3px] border-ink bg-white p-4 text-ink shadow-pop">
              <div className="mb-2 h-2 rounded-full bg-[repeating-linear-gradient(135deg,#ffd23f_0_10px,#2b2140_10px_20px)]" />
              <h4 className="font-display text-lg font-semibold">{lt(d.title)}</h4>
              <p className="mt-1 text-[15px] leading-relaxed">{lt(d.body)}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

function SubmitBanner({
  state,
  onRetry,
}: {
  state: ReturnType<typeof useSubmitRun>['state'];
  onRetry: () => void;
}) {
  if (state.kind === 'offline') {
    return <p className="text-center text-xs text-ink-soft">{t('submit.offline')}</p>;
  }
  if (state.kind === 'sending') {
    return <p className="anim-pop text-center text-sm">{t('submit.sending')}</p>;
  }
  if (state.kind === 'error') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-white p-2 text-sm text-ink">
        <span className="text-danger">{t('submit.failed')}</span>
        <Button tone="sun" className="px-3 py-1 text-sm" onClick={onRetry}>
          {t('submit.retry')}
        </Button>
      </div>
    );
  }
  const title = content.titles.find((x) => x.id === state.result.titleId);
  return (
    <div className="anim-rise-in rounded-2xl border-[3px] border-ink bg-mint p-3 text-center text-white shadow-pop">
      <div className="font-display text-lg">🏆 {t('submit.ok', { n: state.result.rank })}</div>
      {title && <div className="text-sm">{t('submit.title', { t: lt(title.name) })}</div>}
    </div>
  );
}
