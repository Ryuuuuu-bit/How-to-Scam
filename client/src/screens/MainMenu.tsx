import { useRef, useState } from 'react';
import type { Run } from '../game/useGame';
import { t } from '../i18n';
import { Art, Button } from '../components/ui';
import { sceneUrl } from '../assets/art';
import { useAuth } from '../net/auth';
import { loadCosmetics, menuScenes } from '../game/cosmetics';
import { progressFor } from '../game/meta';
import { HowToPlay } from './HowToPlay';
import { ConfirmPopup } from '../components/PopupControls';

export function MainMenu({
  saved,
  onNew,
  onContinue,
  onLeaderboard,
  onProfile,
  onDaily,
  onAchievements,
  onWardrobe,
}: {
  saved: Run | null;
  onNew: () => void;
  onContinue: () => void;
  onLeaderboard?: (() => void) | undefined;
  onProfile?: (() => void) | undefined;
  onDaily?: (() => void) | undefined;
  onAchievements?: (() => void) | undefined;
  onWardrobe: () => void;
}) {
  const [help, setHelp] = useState(false);
  const [confirmNewRun, setConfirmNewRun] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const { user, status } = useAuth();
  const cosmetics = loadCosmetics(progressFor(user), user?.uid);
  const menuScene = menuScenes.find((s) => s.id === cosmetics.scene) ?? menuScenes[0];
  if (help) {
    return (
      <HowToPlay
        onBack={() => {
          setHelp(false);
          window.requestAnimationFrame(() => helpButton.current?.focus());
        }}
      />
    );
  }
  return (
    <main className="menu-shell">
      <header className="brand-bar">
        <a href="#" aria-label="How to Scam หน้าหลัก">
          HTS<span>®</span>
        </a>
        <span>เกมตลกร้าย · วางแผน · เอาตัวรอด</span>
      </header>
      <div className="menu-layout">
        <section className="menu-copy anim-rise-in">
          <div className="eyebrow">
            <span className="live-dot" /> ยินดีต้อนรับสู่ด้านสีเทาของเมือง
          </div>
          <h1 className="game-logo">
            HOW TO
            <br />
            <span>SCAM</span>
            <i>?</i>
          </h1>
          <p className="menu-subtitle">
            เริ่มจากศูนย์…
            <br />
            จบที่เศรษฐี หรือสถานีตำรวจ
          </p>
          <p className="menu-description">
            {t('app.subtitle')} วางแผน รับความเสี่ยง และรับมือเรื่องวุ่น ๆ ที่คุณไม่มีวันเดาถูก
          </p>
          <div className="menu-actions">
            {saved && (
              <Button tone="mint" block onClick={onContinue}>
                {t('menu.continue', { day: saved.state.day })}
              </Button>
            )}
            <Button
              tone="sun"
              block
              onClick={() => {
                if (saved) setConfirmNewRun(true);
                else onNew();
              }}
            >
              {t('menu.newRun')} <span aria-hidden>↗</span>
            </Button>
            {onDaily && (
              <Button tone="pink" block onClick={onDaily}>
                <span className="flex items-center gap-2">
                  <Art id="icon:day" size={25} className="shrink-0" />
                  {t('menu.daily')}
                </span>
              </Button>
            )}
            <Button tone="grape" block disabled={!onLeaderboard} onClick={onLeaderboard}>
              <span className="flex items-center gap-2">
                <Art id="icon:trophy" size={25} className="shrink-0" />
                {onLeaderboard ? t('menu.leaderboard') : t('menu.leaderboardSoon')}
              </span>
            </Button>
            {user && onProfile && (
              <button
                type="button"
                onClick={onProfile}
                className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-white px-3 py-2 text-left text-sm text-ink"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Art id="icon:profile" size={22} className="shrink-0" />
                  <b className="truncate">{user.displayName}</b>
                </span>
                <span className="font-mono text-xs text-ink-soft">UID {user.shortId}</span>
              </button>
            )}
            {status === 'offline' && (
              <p className="rounded-xl bg-white/80 p-2 text-xs text-ink">
                {t('auth.offlineBanner')}
              </p>
            )}
            {onAchievements && (
              <Button tone="paper" block onClick={onAchievements}>
                <span className="flex items-center gap-2">
                  <Art id="icon:medal" size={25} className="shrink-0" />
                  {t('menu.achievements')}
                </span>
              </Button>
            )}
            <Button tone="paper" block onClick={onWardrobe}>
              <span className="flex items-center gap-2">
                <Art id="icon:wardrobe" size={25} className="shrink-0" />
                ห้องแต่งตัวและฉากเมนู
              </span>
              <span aria-hidden>↗</span>
            </Button>
            <Button ref={helpButton} tone="paper" block onClick={() => setHelp(true)}>
              <span className="flex items-center gap-2">
                <Art id="icon:news" size={25} className="shrink-0" />
                วิธีเล่น
              </span>
              <span aria-hidden>↗</span>
            </Button>
          </div>
          <div className="menu-facts">
            <div>
              <b>30</b>
              <span>วันเปลี่ยนชีวิต</span>
            </div>
            <div>
              <b>∞</b>
              <span>เรื่องไม่คาดฝัน</span>
            </div>
            <div>
              <b>1</b>
              <span>การตัดสินใจของคุณ</span>
            </div>
          </div>
        </section>
        <section className="menu-art" aria-label="ภาพเมืองและตัวละคร How to Scam">
          <img src={sceneUrl(menuScene.scene)} alt={menuScene.name} />
          <div className="art-stamp">
            แฟ้มคดี #001 <span>เริ่มต้นใหม่ได้เสมอ</span>
          </div>
          <div className="art-caption">
            <span className="live-dot" /> เมืองนี้… ไม่มีอะไรฟรี<b>แม้แต่บทเรียนชีวิต</b>
          </div>
        </section>
      </div>
      <footer className="menu-footer">
        <span>เรื่องแต่งทั้งหมด · ความเสี่ยงในเกมเท่านั้น</span>
        <p>{t('app.disclaimer')}</p>
      </footer>
      {confirmNewRun && (
        <ConfirmPopup
          title={t('menu.newRun')}
          description={t('menu.abandonConfirm')}
          confirmLabel="ยืนยันเริ่มใหม่"
          icon="icon:day"
          onCancel={() => setConfirmNewRun(false)}
          onConfirm={() => {
            setConfirmNewRun(false);
            onNew();
          }}
        />
      )}
    </main>
  );
}
