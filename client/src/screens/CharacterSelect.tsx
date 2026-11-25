import { careerAffinities, charKey, durations, type Duration } from '@hts/shared';
import { useState } from 'react';
import { content } from '../game/content';
import { isUnlocked } from '../game/meta';
import { useMarket } from '../game/market';
import { bountyText } from '../game/bounty';
import { AuditionNote, BuyButton, WalletBar } from '../components/Underground';
import { useAuth } from '../net/auth';
import { lt, t } from '../i18n';
import { Art, Button, ScreenTitle } from '../components/ui';
import { characterArt, loadCosmetics } from '../game/cosmetics';

export function CharacterSelect({
  onStart,
  onBack,
  starting = false,
  startError = false,
}: {
  onStart: (characterId: string, days: Duration) => void;
  onBack: () => void;
  starting?: boolean;
  startError?: boolean;
}) {
  const [days, setDays] = useState<Duration>(30);
  const { user } = useAuth();
  const market = useMarket();
  const meta = market.progress;
  const cosmetics = loadCosmetics(meta, user?.uid);
  const [picked, setPicked] = useState(content.characters[0]?.id ?? '');
  const [showLocked, setShowLocked] = useState(false);
  const unlocked = content.characters.filter(c => isUnlocked(c, meta));
  const forSale = content.characters.filter(c => !isUnlocked(c, meta) && c.price !== undefined);
  const shown = showLocked ? content.characters : [...unlocked, ...forSale];
  return (
    <main className="character-screen mx-auto flex min-h-dvh flex-col px-4 py-6">
      <div className="eyebrow mb-3">THE CREW / เลือกตัวละครของคุณ</div>
      <ScreenTitle title={t('character.title')} />
      <div className="mb-3">
        <WalletBar progress={meta} compact />
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
        <button aria-pressed={!showLocked} onClick={() => setShowLocked(false)}>เลือกเล่นได้ {unlocked.length}{forSale.length > 0 ? ` · รอรับเข้าแก๊ง ${forSale.length}` : ''}</button>
        <button aria-pressed={showLocked} onClick={() => setShowLocked(true)}>ทั้งหมด · {content.characters.length}</button>
      </div>
      <div className="character-grid grid gap-4 pb-28">
        {shown.map((c, i) => {
          const open = isUnlocked(c, meta);
          const active = open && c.id === picked;
          if (!open && c.price !== undefined) {
            return (
              <div
                key={c.id}
                className="character-card is-for-sale anim-rise-in flex items-center gap-3 rounded-3xl border-2 border-ink bg-paper p-4 text-left"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <div className="character-portrait relative shrink-0">
                  <Art id={characterArt(c.id, cosmetics)} size={100} className="character-figure" />
                  <Art id="icon:lock" size={34} className="absolute right-0 bottom-0" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg leading-tight font-semibold">{lt(c.name)}</div>
                  <div className="text-xs text-ink-soft">{lt(c.desc)}</div>
                  <div className="mt-1 text-xs">
                    <span className="font-semibold text-clean">{t('character.pros')}:</span> {lt(c.pros)}
                  </div>
                  <AuditionNote ch={c} />
                  <BuyButton market={market} itemKey={charKey(c.id)} label="รับเข้าแก๊ง" />
                </div>
              </div>
            );
          }
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
                    <div className="mt-1 text-xs">{careerAffinities[c.id]?.talent} · เลือกสาย{content.methods.find(m => m.id === careerAffinities[c.id]?.method)?.name.th}ได้หลังทำงาน 2 วัน</div>
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
                      : t('character.lockedXp', { n: bountyText(c.unlockXp ?? 0) })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="character-footer fixed inset-x-0 bottom-0 z-10 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">
        {startError && <p role="alert" className="mx-auto mb-2 max-w-md rounded-xl bg-paper p-2 text-sm">เริ่มรอบเก็บคะแนนไม่สำเร็จ กรุณาลองอีกครั้ง</p>}
        <div className="mx-auto flex max-w-md gap-3">
          <Button tone="paper" disabled={starting} onClick={onBack}>
            {t('character.back')}
          </Button>
          <Button tone="pink" block disabled={starting} onClick={() => onStart(picked, days)}>
            {starting ? 'กำลังเริ่มรอบ…' : t('character.start')}
          </Button>
        </div>
      </div>
    </main>
  );
}
