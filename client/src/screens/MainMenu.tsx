import { useState } from 'react';
import type { Run } from '../game/useGame';
import { t } from '../i18n';
import { Button } from '../components/ui';
import { sceneUrl } from '../assets/art';
import { useAuth } from '../net/auth';

export function MainMenu({
  saved,
  onNew,
  onContinue,
  onLeaderboard,
  onProfile,
}: {
  saved: Run | null;
  onNew: () => void;
  onContinue: () => void;
  onLeaderboard?: (() => void) | undefined;
  onProfile?: (() => void) | undefined;
}) {
  const [help, setHelp] = useState(false);
  const { user, status } = useAuth();
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
                if (!saved || window.confirm(t('menu.abandonConfirm'))) onNew();
              }}
            >
              {t('menu.newRun')} <span aria-hidden>↗</span>
            </Button>
            <Button tone="grape" block disabled={!onLeaderboard} onClick={onLeaderboard}>
              🏆 {onLeaderboard ? t('menu.leaderboard') : t('menu.leaderboardSoon')}
            </Button>
            {user && onProfile && (
              <button
                type="button"
                onClick={onProfile}
                className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-white px-3 py-2 text-left text-sm text-ink"
              >
                <span className="truncate">
                  👤 <b>{user.displayName}</b>
                </span>
                <span className="font-mono text-xs text-ink-soft">UID {user.shortId}</span>
              </button>
            )}
            {status === 'offline' && (
              <p className="rounded-xl bg-white/80 p-2 text-xs text-ink">
                {t('auth.offlineBanner')}
              </p>
            )}
            <Button tone="paper" block onClick={() => setHelp(!help)} aria-expanded={help}>
              วิธีเล่น <span aria-hidden>{help ? '−' : '+'}</span>
            </Button>
          </div>
          {help && (
            <div className="how-to">
              เลือกอาชีพ วางแผนในแต่ละวัน และบริหารเงินกับ Heat ให้สมดุล อยู่รอดให้ครบ 30 วัน หรือเกษียณเมื่อพร้อม
              เงินสะอาดคือหัวใจของคะแนน และทุกการตัดสินใจอาจพาไปสู่ฉากจบที่ต่างกัน
            </div>
          )}
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
          <img src={sceneUrl('menu')} alt="แก๊งตัวละคร Chibi ในย่านเมืองยามเย็น" />
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
    </main>
  );
}
