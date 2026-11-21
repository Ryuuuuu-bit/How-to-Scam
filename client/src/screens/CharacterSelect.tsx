import { useState } from 'react';
import { content } from '@hts/shared/data';
import { isUnlocked, loadMeta } from '../game/meta';
import { lt, t } from '../i18n';
import { Art, Button, Chip, ScreenTitle } from '../components/ui';

export function CharacterSelect({
  onStart,
  onBack,
}: {
  onStart: (characterId: string) => void;
  onBack: () => void;
}) {
  const [meta] = useState(loadMeta);
  const [picked, setPicked] = useState(content.characters[0]?.id ?? '');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <div className="flex items-start justify-between gap-2">
        <ScreenTitle title={t('character.title')} />
        <Chip className="mt-1 shrink-0">⭐ {t('character.xp', { n: meta.xp })}</Chip>
      </div>
      <div className="flex flex-col gap-3 pb-28">
        {content.characters.map((c, i) => {
          const open = isUnlocked(c, meta);
          const active = open && c.id === picked;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!open}
              onClick={() => setPicked(c.id)}
              className={`anim-rise-in flex items-center gap-3 rounded-3xl border-[3px] border-ink p-3 text-left transition ${active ? 'bg-sun shadow-pop' : 'bg-paper'} ${open ? '' : 'opacity-60'}`}
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <div className="relative shrink-0">
                <Art
                  id={`char:${c.id}`}
                  size={84}
                  className={open ? '' : 'brightness-0 opacity-40'}
                />
                {!open && <Art id="icon:lock" size={34} className="absolute right-0 bottom-0" />}
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight font-semibold">
                  {open ? lt(c.name) : '???'}
                </div>
                {open ? (
                  <>
                    <div className="text-xs text-ink-soft">{lt(c.desc)}</div>
                    <div className="mt-1 text-xs">
                      <span className="font-semibold text-clean">{t('character.pros')}:</span>{' '}
                      {lt(c.pros)}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-danger">{t('character.cons')}:</span>{' '}
                      {lt(c.cons)}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-ink-soft">
                    {c.unlockEnding
                      ? t('character.lockedSecret')
                      : t('character.lockedXp', { n: c.unlockXp ?? 0 })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-ink bg-cream/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3">
          <Button tone="paper" onClick={onBack}>
            {t('character.back')}
          </Button>
          <Button tone="pink" block onClick={() => onStart(picked)}>
            {t('character.start')}
          </Button>
        </div>
      </div>
    </main>
  );
}
