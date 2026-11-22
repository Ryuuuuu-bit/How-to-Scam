import { useState } from 'react';
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
import { PresenceProvider } from './components/OnlineCount';
import { api } from './net/api';
import { AuthProvider, useAuth } from './net/auth';
import { t } from './i18n';
import { WardrobeScreen } from './screens/WardrobeScreen';

type Screen =
  | 'menu'
  | 'character'
  | 'play'
  | 'leaderboard'
  | 'dailyBoard'
  | 'daily'
  | 'achievements'
  | 'wardrobe';

export function App() {
  if (new URLSearchParams(window.location.search).get('preview') === 'origins') return <><OriginPreview /><AudioControls /></>;
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

  /** ออนไลน์: ขอ seed จาก server เพื่อให้ส่งคะแนนได้ / ออฟไลน์: สุ่มเอง */
  const startRun = async (characterId: string) => {
    setStarting(true);
    let server: { runId: string; seed: string } | undefined;
    if (auth.status === 'ready') {
      try {
        server = await api.startRun(characterId);
      } catch {
        server = undefined;
      }
    }
    game.start(characterId, server);
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

  if (screen === 'wardrobe') return <WardrobeScreen onBack={() => setScreen('menu')} />;

  if (screen === 'daily') {
    return (
      <DailyScreen
        onBack={() => setScreen('menu')}
        onBoard={() => setScreen('dailyBoard')}
        onPlay={(r) => {
          game.clearSave();
          setSaved(null);
          game.start(r.characterId, { runId: r.runId, seed: r.seed });
          setScreen('play');
        }}
      />
    );
  }

  if (screen === 'character') {
    return (
      <CharacterSelect
        onBack={() => setScreen('menu')}
        onStart={(id) => {
          if (!starting) void startRun(id);
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
              setSaved(null);
              setScreen('menu');
            }}
            onAgain={() => setScreen('character')}
          />
          {finalLines.length > 0 && <EndIntro key={game.tick} lines={finalLines} />}
        </>
      );
    }
    return (
      <PlayScreen
        state={state}
        tick={game.tick}
        dispatch={game.dispatch}
        actions={game.run.actions}
      />
    );
  }

  return (
    <>
      <MainMenu
        onWardrobe={() => setScreen('wardrobe')}
        saved={saved}
        onNew={() => {
          game.clearSave();
          setSaved(null);
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
