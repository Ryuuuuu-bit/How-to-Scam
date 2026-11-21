import type { Run } from '../game/useGame';
import { t } from '../i18n';
import { Art, Button } from '../components/ui';

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <div className="anim-rise-in flex gap-1">
        <Art id="char:ex_insurance" size={72} />
        <Art id="char:gamer_kid" size={72} />
        <Art id="char:temple_kid" size={72} />
      </div>
      <div className="anim-rise-in">
        <h1 className="text-5xl font-semibold tracking-tight text-pink drop-shadow-[3px_3px_0_#2b2140]">
          {t('app.title')}
        </h1>
        <p className="font-display mt-1 text-lg">{t('app.subtitle')}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
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
      <p className="text-xs text-ink-soft">{t('app.disclaimer')}</p>
    </main>
  );
}
