import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt, t } from '../i18n';
import { Art, Button, Panel } from '../components/ui';
import { sceneUrl } from '../assets/art';

export function EndScreen({
  state,
  onAgain,
  onMenu,
}: {
  state: GameState;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const end = state.end;
  if (!end) return null;
  const ending = content.endings.find((e) => e.id === end.endingId);
  const signs = end.dangerSignIds
    .map((id) => content.dangerSigns.find((d) => d.id === id))
    .filter((d) => d !== undefined);
  const days = end.reason === 'survived' ? content.config.maxDays : state.day;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <div className="anim-rise-in text-center">
        <span className="font-display inline-block rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm">
          {t(`end.reason.${end.reason}`)}
        </span>
      </div>

      {ending && (
        <Panel tone="sun" className="anim-rise-in text-center">
          {sceneUrl(`end_${ending.id}`) ? (
            <img
              src={sceneUrl(`end_${ending.id}`)}
              alt=""
              className="anim-scene-in aspect-[4/3] w-full rounded-2xl border-[3px] border-ink object-cover object-top"
            />
          ) : (
            <Art id={`ending:${ending.id}`} size={96} className="mx-auto" />
          )}
          <h2 className="mt-2 text-2xl font-semibold">{lt(ending.title)}</h2>
          <p className="mt-1">{lt(ending.body)}</p>
        </Panel>
      )}

      <Panel className="anim-rise-in text-center" tone="paper">
        <div className="text-sm text-ink-soft">{t('end.score')}</div>
        <div className="font-display text-5xl font-semibold text-pink">{fmt(end.score)}</div>
        <div className="mt-1 text-sm">
          {t('end.clean', { n: state.cleanCash })} · {t('end.days', { n: days })}
        </div>
      </Panel>

      <section className="anim-rise-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <Art id="danger" size={28} />
          {t('end.dangerTitle')}
        </h3>
        <p className="mb-2 text-sm text-ink-soft">{t('end.dangerHint')}</p>
        <div className="flex flex-col gap-3">
          {signs.map((d) => (
            <div key={d.id} className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-pop">
              <div className="mb-2 h-2 rounded-full bg-[repeating-linear-gradient(135deg,#ffd23f_0_10px,#2b2140_10px_20px)]" />
              <h4 className="font-display text-lg font-semibold">{lt(d.title)}</h4>
              <p className="mt-1 text-[15px] leading-relaxed">{lt(d.body)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-2 grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]">
        <Button tone="paper" onClick={onMenu}>
          {t('end.menu')}
        </Button>
        <Button tone="pink" onClick={onAgain}>
          {t('end.again')}
        </Button>
      </div>
    </main>
  );
}
