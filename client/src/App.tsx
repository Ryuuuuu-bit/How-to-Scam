import type { Duration } from '@hts/shared';
import { useEffect, useState } from 'react';
import { PlannerPractice } from './screens/PlannerPractice';
import { LiveCounter } from './screens/LiveCounter';
import { ScenePreview } from './screens/ScenePreview';
import { OriginPreview } from './screens/OriginPreview';
import { loadSavedRun, useGame } from './game/useGame';
import { CharacterSelect } from './screens/CharacterSelect';
import { EndScreen } from './screens/EndScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { DailyScreen } from './screens/DailyScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MainMenu } from './screens/MainMenu';
import { PlayScreen } from './screens/PlayScreen';
import { ProfileSheet } from './screens/ProfileSheet';
import { ResultSheet } from './components/ResultSheet';
import { describeResult } from './game/results';
import { AudioControls } from './components/AudioControls';
import { ConfirmPopup } from './components/PopupControls';
import { PresenceProvider } from './components/OnlineCount';
import { api } from './net/api';
import { AuthProvider, useAuth } from './net/auth';
import { t } from './i18n';
import { WardrobeScreen } from './screens/WardrobeScreen';
import { MarketScreen } from './screens/MarketScreen';
import { EndingsGallery } from './screens/EndingsGallery';
import { HomeScreen } from './screens/HomeScreen';
import { currentLoadout, loadPick } from './game/loadout';
import { CardCollector } from './components/Collection';
import { CollectionScreen } from './screens/CollectionScreen';
import { progressFor } from './game/meta';
import './components/phone.css';

type Screen =
  | 'menu'
  | 'character'
  | 'play'
  | 'leaderboard'
  | 'dailyBoard'
  | 'daily'
  | 'achievements'
  | 'wardrobe'
  | 'market'
  | 'endings'
  | 'home'
  | 'collection';

export function App() {
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (preview === 'planner') return <AuthProvider><PlannerPractice /><AudioControls /></AuthProvider>;
  if (preview === 'origins' || preview === 'retirement' || preview === 'soinews') return <><OriginPreview page={preview} /><AudioControls /></>;
  if (new URLSearchParams(window.location.search).get('preview') === 'scenes') return <><ScenePreview /><AudioControls /></>;
  if (new URLSearchParams(window.location.search).get('preview') === 'live') {
    return <><main><LiveCounter seller onFinish={() => window.location.assign('/')} /></main><AudioControls /></>;
  }
  return (
    <AuthProvider>
      <PresenceProvider>
        <Gate />
      </PresenceProvider>
      <AudioControls />
    </AuthProvider>
  );
}

/** ต้องเข้าสู่ระบบ (Google/Guest) หรือเลือกเล่นออฟไลน์ก่อน */
function Gate() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="font-display anim-pop text-lg">{t('auth.loading')}</p>
      </main>
    );
  }
  if (status === 'signedOut') return <LoginScreen />;
  return <GameScreens />;
}

function GameScreens() {
  const game = useGame();
  const auth = useAuth();
  const [screen, setScreen] = useState<Screen>('menu');
  const [saved, setSaved] = useState(loadSavedRun);
  const [profile, setProfile] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(false);
  const [pendingDaily, setPendingDaily] = useState<Awaited<ReturnType<typeof api.dailyStart>> | null>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);

  /** ออนไลน์: ขอ seed จาก server เพื่อให้ส่งคะแนนได้ / ออฟไลน์: สุ่มเอง */
  const startRun = async (characterId: string, days: Duration) => {
    setStarting(true);
    setStartError(false);
    let server: { runId: string; seed: string } | undefined;
    if (auth.status === 'ready') {
      try {
        server = await api.startRun(characterId, days, loadPick(auth.user?.uid));
      } catch {
        setStarting(false);
        setStartError(true);
        return;
      }
    }
    // ออฟไลน์: บ้านกับชุดติดไปกับ seed ที่สุ่มเอง
    game.start(characterId, server, days, currentLoadout(progressFor(auth.user).owned, auth.user?.uid));
    setStarting(false);
    setScreen('play');
  };

  if (screen === 'leaderboard' || screen === 'dailyBoard') {
    return (
      <LeaderboardScreen
        initialBoard={screen === 'dailyBoard' ? 'daily' : 'top'}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'achievements') {
    return <AchievementsScreen onBack={() => setScreen('menu')} />;
  }

  if (screen === 'wardrobe') return <WardrobeScreen onBack={() => setScreen('menu')} onMarket={() => setScreen('market')} />;
  if (screen === 'market') return <MarketScreen onBack={() => setScreen('menu')} />;
  if (screen === 'home') return <HomeScreen onBack={() => setScreen('menu')} onPlay={() => setScreen('character')} onCollection={() => setScreen('collection')} />;
  if (screen === 'collection') return <CollectionScreen onBack={() => setScreen('menu')} />;
  if (screen === 'endings') return <EndingsGallery onBack={() => setScreen('menu')} />;

  if (screen === 'daily') {
    return (
      <><DailyScreen
        onBack={() => setScreen('menu')}
        onBoard={() => setScreen('dailyBoard')}
        onPlay={(r) => {
          const previous = loadSavedRun();
          if (previous && previous.runId === r.runId && previous.seed === r.seed &&
              previous.characterId === r.characterId) game.resume(previous);
          else if (previous) { setPendingDaily(r); return; }
          else game.start(r.characterId, { runId: r.runId, seed: r.seed });
          setScreen('play');
        }}
      />
      {pendingDaily && <ConfirmPopup title="เปลี่ยนไปเล่นภารกิจประจำวัน?"
        description="ภารกิจประจำวันจะใช้ช่องเซฟของรอบเดิม หากต้องการกลับไปเล่นรอบเดิม ให้เลือกยกเลิก"
        confirmLabel="เปลี่ยนรอบ" icon="icon:day"
        onCancel={() => setPendingDaily(null)}
        onConfirm={() => {
          game.start(pendingDaily.characterId, pendingDaily);
          setPendingDaily(null);
          setScreen('play');
        }} />}</>
    );
  }

  if (screen === 'character') {
    return (
      <CharacterSelect
        starting={starting}
        startError={startError}
        onBack={() => { setStartError(false); setScreen('menu'); }}
        onStart={(id, days) => {
          if (!starting) void startRun(id, days);
        }}
      />
    );
  }

  if (screen === 'play' && game.run) {
    const { state } = game.run;
    if (state.phase === 'ended') {
      // แสดงผลหนีไม่รอดก่อน แล้วค่อยเข้าฉากจบ
      const finalLines = state.lastResults
        .filter((r) => r.kind === 'escape')
        .map((r) => describeResult(r, state))
        .filter((l) => l !== null);
      return (
        <>
          <EndScreen
            state={state}
            runId={game.run.runId}
            actions={game.run.actions}
            onMenu={() => {
              game.quit();
              setSaved(loadSavedRun());
              setScreen('menu');
            }}
            onAgain={() => { setSaved(loadSavedRun()); setScreen('character'); }}
            onMarket={() => {
              game.quit();
              setSaved(loadSavedRun());
              setScreen('market');
            }}
            onHome={() => {
              game.quit();
              setSaved(loadSavedRun());
              setScreen('home');
            }}
          />
          {finalLines.length > 0 && <EndIntro key={game.tick} lines={finalLines} />}
          <CardCollector state={state} />
        </>
      );
    }
    return (
      <>
        <PlayScreen
          state={state}
          tick={game.tick}
          dispatch={game.dispatch}
          actions={game.run.actions}
        />
        <CardCollector state={state} />
      </>
    );
  }

  return (
    <>
      <MainMenu
        onWardrobe={() => setScreen('wardrobe')}
        onHome={() => setScreen('home')}
        onCollection={() => setScreen('collection')}
        onMarket={() => setScreen('market')}
        onEndings={() => setScreen('endings')}
        saved={saved}
        onNew={() => {
          setScreen('character');
        }}
        onContinue={() => {
          if (saved) {
            game.resume(saved);
            setScreen('play');
          }
        }}
        onLeaderboard={auth.status === 'ready' ? () => setScreen('leaderboard') : undefined}
        onProfile={auth.status === 'ready' ? () => setProfile(true) : undefined}
        onDaily={auth.status === 'ready' ? () => setScreen('daily') : undefined}
        onAchievements={() => setScreen('achievements')}
      />
      {profile && <ProfileSheet onClose={() => setProfile(false)} />}
    </>
  );
}

function EndIntro({ lines }: { lines: NonNullable<ReturnType<typeof describeResult>>[] }) {
  const [open, setOpen] = useState(true);
  return open ? <ResultSheet lines={lines} onClose={() => setOpen(false)} /> : null;
}
