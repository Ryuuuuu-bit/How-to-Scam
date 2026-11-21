import { useState } from 'react';
import { loadSavedRun, useGame } from './game/useGame';
import { CharacterSelect } from './screens/CharacterSelect';
import { EndScreen } from './screens/EndScreen';
import { MainMenu } from './screens/MainMenu';
import { PlayScreen } from './screens/PlayScreen';
import { ResultSheet } from './components/ResultSheet';
import { describeResult } from './game/results';

type Screen = 'menu' | 'character' | 'play';

export function App() {
  const game = useGame();
  const [screen, setScreen] = useState<Screen>('menu');
  const [saved, setSaved] = useState(loadSavedRun);

  if (screen === 'character') {
    return (
      <CharacterSelect
        onBack={() => setScreen('menu')}
        onStart={(id) => {
          game.start(id);
          setScreen('play');
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
    return <PlayScreen state={state} tick={game.tick} dispatch={game.dispatch} />;
  }

  return (
    <MainMenu
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
    />
  );
}

function EndIntro({ lines }: { lines: NonNullable<ReturnType<typeof describeResult>>[] }) {
  const [open, setOpen] = useState(true);
  return open ? <ResultSheet lines={lines} onClose={() => setOpen(false)} /> : null;
}
