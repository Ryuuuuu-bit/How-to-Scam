import type { Run } from '../game/useGame';
import { t } from '../i18n';
import { Art, Button } from '../components/ui';
import { SceneBackdrop } from '../components/SceneBackdrop';

export function MainMenu({
  saved,
  onNew,
  onContinue,
}: {
  saved: Run | null;
  onNew: () => void;
  onContinue: () => void;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-end gap-5 px-4 pt-10 pb-[max(env(safe-area-inset-bottom),28px)] text-center">
      <SceneBackdrop id="menu" />
      <div className="anim-rise-in relative z-10 -mb-3 flex items-end">
        <Art id="char:ex_insurance" size={112} />
        <Art id="char:gamer_kid" size={112} className="-mx-3" />
        <Art id="char:temple_kid" size={112} />
      </div>
      <div className="anim-rise-in relative z-10">
        <h1 className="text-5xl font-semibold tracking-tight text-pink drop-shadow-[3px_3px_0_#2b2140]">
          {t('app.title')}
        </h1>
        <p className="font-display mt-1 text-lg">{t('app.subtitle')}</p>
      </div>
      <div className="relative z-10 flex w-full flex-col gap-3">
        {saved && (
          <Button tone="mint" block onClick={onContinue}>
            {t('menu.continue', { day: saved.state.day })}
          </Button>
        )}
        <Button
          tone="pink"
          block
          onClick={() => {
            if (!saved || window.confirm(t('menu.abandonConfirm'))) onNew();
          }}
        >
          {t('menu.newRun')}
        </Button>
        <Button tone="paper" block disabled>
          {t('menu.leaderboardSoon')}
        </Button>
      </div>
      <p className="relative z-10 text-xs text-ink-soft">{t('app.disclaimer')}</p>
    </main>
  );
}
