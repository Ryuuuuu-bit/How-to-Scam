import { content } from '../game/content';
import { loadMeta } from '../game/meta';
import { useAuth } from '../net/auth';
import { lt, t } from '../i18n';
import { Button, ScreenTitle } from '../components/ui';

/** หน้ารวมเหรียญความสำเร็จ (ออนไลน์ใช้ของ server ออฟไลน์ใช้ของในเครื่อง) */
export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const owned = new Set(auth.user ? auth.achievements : loadMeta().achievements);
  const all = content.achievements;
  const earned = all.filter(a => owned.has(a.id)).length;
  return (
    <main className="collection-screen mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <ScreenTitle
        title={t('achievements.title')}
        hint={t('achievements.progress', {
          n: earned,
          m: all.length,
        })}
      />
      <progress className="collection-progress" aria-label="เหรียญที่สะสมแล้ว" value={earned} max={all.length} />
      <div className="grid grid-cols-2 gap-2 pb-24">
        {all.map((a) => {
          const got = owned.has(a.id);
          return (
            <div
              key={a.id}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 border-ink p-3 text-center text-ink ${got ? 'bg-sun shadow-pop-sm' : 'bg-paper opacity-60'}`}
            >
              <div className={`text-3xl ${got ? '' : 'grayscale'}`}>{got ? a.icon : '🔒'}</div>
              <div className="font-display text-sm leading-tight font-semibold">{lt(a.name)}</div>
              <div className="text-[11px] leading-snug text-ink-soft">{lt(a.desc)}</div>
            </div>
          );
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-ink bg-cream/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto max-w-md">
          <Button tone="paper" block onClick={onBack}>
            {t('achievements.back')}
          </Button>
        </div>
      </div>
    </main>
  );
}
