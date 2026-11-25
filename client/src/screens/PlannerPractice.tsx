import { useReducer } from 'react';
import { newGame, step } from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { content } from '../game/content';
import { PlayScreen } from './PlayScreen';
import { EndScreen } from './EndScreen';
import { fmt } from '../i18n';
import { Button } from '../components/ui';

function begin() {
  return { state: newGame('planner-practice', 'phone_tech', content), actions: [] as Action[] };
}

function advance(run: { state: GameState; actions: Action[] }, action: Action | 'reset') {
  if (action === 'reset') return begin();
  return { state: step(run.state, action, content), actions: [...run.actions, action] };
}

export function PlannerPractice() {
  const [run, dispatch] = useReducer(advance, undefined, begin);
  const done = run.state.day > 1;
  return <>
    <nav className="practice-nav" aria-label="โหมดทดลอง"><strong>ลองเล่น 1 วัน</strong>
      <a href="/">กลับเกมหลัก</a>
    </nav>
    {run.state.phase === 'ended' ? <EndScreen practice state={run.state} actions={run.actions}
      onAgain={() => dispatch('reset')} onMenu={() => window.location.assign('/')} />
    : done ? <main className="practice-end">
      <h1 className="font-display text-3xl">จบวันทดลองแล้ว</h1>
      <p>เงินสะอาด ฿{fmt(run.state.cleanCash)} · เงินสกปรก ฿{fmt(run.state.dirtyCash)} · Heat {run.state.heat}</p>
      <Button tone="sun" onClick={() => dispatch('reset')}>ลองงานอื่น</Button>
      <a className="practice-link" href="/">กลับไปเล่นเกมหลัก</a>
    </main> : <PlayScreen state={run.state} tick={run.actions.length} dispatch={dispatch} actions={run.actions} />}
  </>;
}
