import { useState } from 'react';
import { newGame, step, type Action, type GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { Button } from '../components/ui';
import { EscapePhase } from './EscapePhase';
import { CatDesk } from './CatDesk';

export function ScenePreview() {
  const [state, setState] = useState<GameState | null>(null);
  const [result, setResult] = useState('');
  function start(scene: 'qte' | 'custody' | 'desk') {
    const s = newGame('scene-preview', 'orange_cat', content);
    s.cleanCash = 800;
    s.heat = 80;
    if (scene === 'desk') {
      s.phase = 'event';
      s.pendingEvents = ['cat_keyboard'];
    } else {
      s.phase = 'escape';
      s.escape = { step: scene, routeId: 'market', bonus: 0 };
    }
    setResult('');
    setState(s);
  }
  function play(action: Action) {
    if (!state) return;
    const next = step(state, action, content);
    if (next.phase === 'escape') { setState(next); return; }
    setResult(next.end ? 'ปิดคดี · จบรอบในห้องขัง' : action.t === 'eventChoice'
      ? 'ส้มซ่าจัดให้แล้ว · เงินสกปรก ฿' + next.dirtyCash.toLocaleString('th-TH') + ' · Heat ' + next.heat
      : 'หนีสำเร็จ · เล่นต่อได้ · Heat ' + next.heat);
    setState(null);
  }
  return <main className="mx-auto grid max-w-lg gap-3 p-4">
    {state ? <>{state.phase === 'escape' ? <EscapePhase state={state} dispatch={play} /> : <CatDesk choose={choiceIdx => play({ t: 'eventChoice', choiceIdx })} />}
      <Button tone="paper" onClick={() => setState(null)}>กลับหน้าเลือกฉาก</Button></> :
      <><h1 className="font-display text-2xl font-bold text-white">ลองเล่นเหตุการณ์</h1>
        {result && <p role="status" className="rounded-xl bg-paper p-3 text-ink">{result}</p>}
        <Button tone="sun" onClick={() => start('qte')}>หนีตำรวจ · วิ่งตามส้ม!</Button>
        <Button tone="grape" onClick={() => start('custody')}>คืนแรกหลังลูกกรง · แหกคุกมิติแมว</Button>
        <Button tone="paper" onClick={() => start('desk')}>ส้มซ่าบนโต๊ะทำงาน</Button></>}
  </main>;
}
