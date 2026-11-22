import { useState } from 'react';
import { GoogleButton } from '../net/GoogleButton';
import { useAuth } from '../net/auth';
import { t } from '../i18n';
import { Button } from '../components/ui';

/** แผ่นโปรไฟล์: ชื่อ UID ผูก Google ออกจากระบบ */
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const user = auth.user;
  const [name, setName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3"
      onClick={onClose}
    >
      <div
        className="anim-rise-in flex w-full max-w-md flex-col gap-3 rounded-3xl border-[3px] border-ink bg-paper p-4 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">{t('profile.title')}</h2>
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full border-2 border-ink"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-sun text-xl">
              🕶️
            </div>
          )}
          <div className="min-w-0 text-sm">
            <div className="font-display text-base font-semibold">{user.displayName}</div>
            <div className="text-ink-soft">
              {t(`profile.kind.${user.kind}`)} · {t('profile.uid')}{' '}
              <span className="font-mono font-semibold text-ink">{user.shortId}</span>
            </div>
            <div className="text-xs text-ink-soft">
              {t('profile.xp', { n: user.xp, r: user.runsPlayed })}
            </div>
          </div>
        </div>
        <label className="text-sm font-semibold">
          {t('profile.name')}
          <div className="mt-1 flex gap-2">
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-3 py-2 font-normal"
            />
            <Button
              tone="mint"
              className="px-3 py-2 text-sm"
              disabled={saving || name.trim().length < 2 || name.trim() === user.displayName}
              onClick={() => {
                setSaving(true);
                auth.rename(name.trim()).finally(() => setSaving(false));
              }}
            >
              {t('profile.save')}
            </Button>
          </div>
        </label>
        {user.kind === 'guest' && auth.googleClientId && (
          <div className="rounded-2xl border-2 border-dashed border-ink p-3 text-center text-sm">
            <p className="mb-2">{t('profile.linkGoogle')}</p>
            <GoogleButton
              clientId={auth.googleClientId}
              text="continue_with"
              onCredential={(c) => void auth.loginGoogle(c)}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            tone="paper"
            onClick={() => {
              if (user.kind === 'google' || window.confirm(t('profile.logoutGuestWarn'))) {
                auth.logout();
                onClose();
              }
            }}
          >
            {t('profile.logout')}
          </Button>
          <Button tone="pink" onClick={onClose}>
            {t('profile.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
