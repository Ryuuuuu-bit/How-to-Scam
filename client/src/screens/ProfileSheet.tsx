import { useState } from 'react';
import { GoogleButton } from '../net/GoogleButton';
import { useAuth } from '../net/auth';
import { t } from '../i18n';
import { PopupButton, PopupClose, ConfirmPopup } from '../components/PopupControls';

/** แผ่นโปรไฟล์: ชื่อ UID ผูก Google ออกจากระบบ */
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const user = auth.user;
  const [name, setName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  if (!user) return null;
  const logout = () => {
    auth.logout();
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3"
      onClick={onClose}
    >
      <div
        className="anim-rise-in flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-3xl border-[3px] border-ink bg-paper p-4 text-ink shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="popup-heading">
          <h2 className="text-xl font-semibold">{t('profile.title')}</h2>
          <PopupClose label="ปิดโปรไฟล์" onClick={onClose} />
        </header>
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
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-3 py-2 font-normal text-ink"
            />
            <PopupButton
              icon="✓"
              disabled={saving || name.trim().length < 2 || name.trim() === user.displayName}
              onClick={() => {
                setSaving(true);
                auth.rename(name.trim()).finally(() => setSaving(false));
              }}
            >
              {t('profile.save')}
            </PopupButton>
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
          <PopupButton
            variant="secondary"
            icon="↗"
            onClick={() => {
              if (user.kind === 'google') logout();
              else setConfirmLogout(true);
            }}
          >
            {t('profile.logout')}
          </PopupButton>
          <PopupButton onClick={onClose}>{t('profile.close')}</PopupButton>
        </div>
        {confirmLogout && (
          <ConfirmPopup
            title={t('profile.logout')}
            description={t('profile.logoutGuestWarn')}
            confirmLabel="ยืนยันออกจากระบบ"
            icon="icon:profile"
            onCancel={() => setConfirmLogout(false)}
            onConfirm={logout}
          />
        )}
      </div>
    </div>
  );
}
