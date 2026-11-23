import { durations, type Duration } from '@hts/shared';
import { useState } from 'react';
import { content } from '@hts/shared/data';
import { isUnlocked, progressFor } from '../game/meta';
import { useAuth } from '../net/auth';
import { lt, t } from '../i18n';
import { Art, Button, Chip, ScreenTitle } from '../components/ui';
import { characterArt, loadCosmetics } from '../game/cosmetics';

export function CharacterSelect({
  onStart,
  onBack,
}: {
  onStart: (characterId: string, days: Duration) => void;
  onBack: () => void;
}) {
  const [days, setDays] = useState<Duration>(30);
  const { user } = useAuth();
  const meta = progressFor(user);
  const cosmetics = loadCosmetics(meta, user?.uid);
  const [picked, setPicked] = useState(content.characters[0]?.id ?? '');
  const [showLocked, setShowLocked] = useState(false);
  const unlocked = content.characters.filter(c => isUnlocked(c, meta));
  return (
    <main className="character-screen mx-auto flex min-h-dvh flex-col px-4 py-6">
      <div className="eyebrow mb-3">THE CREW / เลือกตัวละครของคุณ</div>
      <div className="flex items-start justify-between gap-2">
        <ScreenTitle title={t('character.title')} />
        <Chip className="mt-1 shrink-0">⭐ {t('character.xp', { n: meta.xp })}</Chip>
      </div>
      <fieldset className="mb-3">
        <legend className="mb-1 font-semibold">ระยะเวลาของรอบ</legend>
        <div className="collection-filter">
          {durations.map(n => <button type="button" key={n} aria-pressed={days === n} onClick={() => setDays(n)}>{n} วัน</button>)}
        </div>
        <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
          {days === 30 ? 'ตั้งตัวในซอย เลือกงานและตัดสินใจว่าจะใช้ห้องว่างอย่างไร' :
            days === 60 ? 'เล่นต่อถึงเดือนที่สอง เลือกรับกะประจำ จัดรายการวิทยุ หรือทำงานอิสระ' :
            'เล่นครบสามเดือน เลือกเปิดร้าน ถือหุ้นกับทีม หรือเปิดโรงเรียนวันหยุด'}
        </p>
      </fieldset>
      <div className="collection-filter" role="group" aria-label="แสดงอาชีพ">
        <button aria-pressed={!showLocked} onClick={() => setShowLocked(false)}>เลือกเล่นได้ · {unlocked.length}</button>
        <button aria-pressed={showLocked} onClick={() => setShowLocked(true)}>ทั้งหมด · {content.characters.length}</button>
      </div>
      <div className="character-grid grid gap-4 pb-28">
        {(showLocked ? content.characters : unlocked).map((c, i) => {
          const open = isUnlocked(c, meta);
          const active = open && c.id === picked;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!open}
              aria-pressed={active}
              onClick={() => setPicked(c.id)}
              className={`character-card anim-rise-in flex items-center gap-3 rounded-3xl border-2 border-ink p-4 text-left transition ${active ? 'is-selected bg-sun shadow-pop' : 'bg-paper'} ${open ? '' : 'opacity-60'}`}
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <div className="character-portrait relative shrink-0">
                <Art
                  id={characterArt(c.id, cosmetics)}
                  size={100}
                  className={`character-figure ${open ? '' : 'brightness-0 opacity-40'}`}
                />
                {!open && <Art id="icon:lock" size={34} className="absolute right-0 bottom-0" />}
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight font-semibold">
                  {lt(c.name)}
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
      <div className="character-footer fixed inset-x-0 bottom-0 z-10 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3">
          <Button tone="paper" onClick={onBack}>
            {t('character.back')}
          </Button>
          <Button tone="pink" block onClick={() => onStart(picked, days)}>
            {t('character.start')}
          </Button>
        </div>
      </div>
    </main>
  );
}
