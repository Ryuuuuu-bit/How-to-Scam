import { useState } from 'react';
import { content } from '@hts/shared/data';
import { lt, t } from '../i18n';
import { Art, Button, ScreenTitle } from '../components/ui';

export function CharacterSelect({
  onStart,
  onBack,
}: {
  onStart: (characterId: string) => void;
  onBack: () => void;
}) {
  const [picked, setPicked] = useState(content.characters[0]?.id ?? '');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <ScreenTitle title={t('character.title')} />
      <div className="flex flex-col gap-3">
        {content.characters.map((c, i) => {
          const active = c.id === picked;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setPicked(c.id)}
              className={`anim-rise-in flex items-center gap-3 rounded-3xl border-[3px] border-ink p-3 text-left transition ${active ? 'bg-sun shadow-pop' : 'bg-paper opacity-80'}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <Art id={`char:${c.id}`} size={96} className="shrink-0" />
              <div>
                <div className="font-display text-lg font-semibold">{lt(c.name)}</div>
                <div className="text-sm text-ink-soft">{lt(c.desc)}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex gap-3 pt-6 pb-[env(safe-area-inset-bottom)]">
        <Button tone="paper" onClick={onBack}>
          {t('character.back')}
        </Button>
        <Button tone="pink" block onClick={() => onStart(picked)}>
          {t('character.start')}
        </Button>
      </div>
    </main>
  );
}
