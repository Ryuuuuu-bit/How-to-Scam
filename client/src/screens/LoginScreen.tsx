import { useState } from 'react';
import { GoogleButton } from '../net/GoogleButton';
import { useAuth } from '../net/auth';
import { t } from '../i18n';
import { Art } from '../components/ui';
import wordmark from '../assets/img/login-wordmark.webp';
import './login.css';

export function LoginScreen() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="caper-entry">
      <div className="entry-layout">
        <header className="entry-poster">
          <h1 aria-label="How to Scam">
            <img src={wordmark} alt="" />
          </h1>
          <p className="entry-premise">จะรอดไปได้กี่วัน?</p>
          <div className="entry-crew" aria-hidden="true">
            <Art id="char:ex_insurance" size={210} />
            <Art id="char:live_seller" size={185} />
            <Art id="char:orange_cat" size={134} />
          </div>
        </header>
        <section className="entry-pass" aria-labelledby="entry-heading">
          <header className="pass-heading">
            <img src="/caper-bag.svg" width="44" height="44" alt="" />
            <h2 id="entry-heading">{t('auth.title')}</h2>
          </header>

          <div className="pass-actions" inert={busy} aria-busy={busy}>
            <button
              className="pass-start"
              disabled={busy}
              onClick={() => void run(auth.loginGuest)}
            >
              {busy ? t('auth.loading') : 'เริ่มเล่นทันที'}
              <span aria-hidden="true">↗</span>
            </button>
            <p>ผูก Google ทีหลังได้ คะแนนไม่หาย</p>
            <div className="pass-divider">หรือ</div>
            {auth.googleClientId ? (
              <GoogleButton
                fill
                clientId={auth.googleClientId}
                onCredential={(c) => void run(() => auth.loginGoogle(c))}
              />
            ) : (
              <p>{t('auth.googleSoon')}</p>
            )}
          </div>
          {auth.error && (
            <p className="pass-error" role="alert">
              {t('auth.failed')}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
