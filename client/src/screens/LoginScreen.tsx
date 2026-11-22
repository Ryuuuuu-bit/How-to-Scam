import { useState } from 'react';
import { GoogleButton } from '../net/GoogleButton';
import { useAuth } from '../net/auth';
import { t } from '../i18n';
import { Art, Button, Panel } from '../components/ui';
import { SceneBackdrop } from '../components/SceneBackdrop';

/** หน้าเข้าสู่ระบบ: Google หรือ Guest (ทุกคนได้ UID) */
export function LoginScreen() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-4 px-4 pt-10 pb-[max(env(safe-area-inset-bottom),28px)]">
      <SceneBackdrop id="menu" />
      <div className="relative z-10 -mb-2 flex items-end justify-center">
        <Art id="char:ex_insurance" size={96} />
        <Art id="char:live_seller" size={96} className="-mx-3" />
        <Art id="char:orange_cat" size={96} />
      </div>
      <Panel className="relative z-10 flex flex-col gap-3 text-center text-ink">
        <h1 className="text-3xl font-semibold">{t('auth.title')}</h1>
        <p className="text-sm text-ink-soft">{t('auth.hint')}</p>
        {auth.googleClientId ? (
          <GoogleButton
            clientId={auth.googleClientId}
            onCredential={(c) => void run(() => auth.loginGoogle(c))}
          />
        ) : (
          <p className="rounded-xl bg-cream p-2 text-xs text-ink-soft">{t('auth.googleSoon')}</p>
        )}
        <Button tone="sun" block disabled={busy} onClick={() => void run(auth.loginGuest)}>
          {t('auth.guest')}
        </Button>
        <p className="-mt-1 text-xs text-ink-soft">{t('auth.guestHint')}</p>
        {auth.error && <p className="text-sm font-semibold text-danger">{t('auth.failed')}</p>}
        <button type="button" className="text-xs underline" onClick={auth.playOffline}>
          {t('auth.offline')}
        </button>
      </Panel>
    </main>
  );
}
