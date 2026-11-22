import { useState } from 'react';
import { newGame, step, type Action, type GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { Button } from '../components/ui';
import { EscapePhase } from './EscapePhase';
import { CatDesk } from './CatDesk';
import { CallPhase } from './phases';
import { describeResult, type ResultLine } from '../game/results';
import { ResultSheet } from '../components/ResultSheet';

export function ScenePreview() {
  const [state, setState] = useState<GameState | null>(null);
  const [result, setResult] = useState('');
  const [calls, setCalls] = useState(0);
  const [callResult, setCallResult] = useState<ResultLine[]>([]);
  function startCall() {
    const initial = newGame('caller-preview-' + calls, 'ex_insurance', content);
    initial.gangLevel = 2;
    const plan = step(initial, { t: 'choosePlan', methodId: 'call_center' }, content);
    setState(step(plan, { t: 'confirmInvest' }, content));
    setResult('');
    setCalls(n => n + 1);
  }
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
    if (state.phase === 'call') {
      setCallResult(next.lastResults.map(r => describeResult(r, next)).filter((line): line is ResultLine => line !== null));
      setState(null);
      return;
    }
    if (next.phase === 'escape') { setState(next); return; }
    if (action.t === 'custodyVerdict' && action.answer) {
      setResult(next.end ? 'ลำดับภาพไม่ตรง · รอบนี้จบในคุก' : 'จำถูกทั้งสามใบ! ส้มพากลับตลาด · Heat ' + next.heat);
      setState(null);
      return;
    }
    setResult(next.end ? 'ปิดคดี · จบรอบในห้องขัง' : action.t === 'eventChoice'
      ? 'ส้มซ่าจัดให้แล้ว · เงินสกปรก ฿' + next.dirtyCash.toLocaleString('th-TH') + ' · Heat ' + next.heat
      : 'หนีสำเร็จ · เล่นต่อได้ · Heat ' + next.heat);
    setState(null);
  }
  return <main className="mx-auto grid max-w-lg gap-3 p-4">
    {callResult.length > 0 && <ResultSheet lines={callResult} onClose={() => setCallResult([])} />}
    {state ? <>{state.phase === 'escape' && <EscapePhase state={state} dispatch={play} />}
      {state.phase === 'call' && <div className="decision-panel !m-0 !w-full !p-0"><CallPhase state={state} dispatch={play} /></div>}
      {state.phase === 'event' && <CatDesk choose={choiceIdx => play({ t: 'eventChoice', choiceIdx })} />}
      <Button tone="paper" onClick={() => setState(null)}>กลับหน้าเลือกฉาก</Button></> :
      <><h1 className="font-display text-2xl font-bold text-white">ลองเล่นเหตุการณ์</h1>
        {result && <p role="status" className="rounded-xl bg-paper p-3 text-ink">{result}</p>}
        <Button tone="mint" onClick={startCall}>ลองสุ่มคนรับสาย</Button>
        <Button tone="sun" onClick={() => start('qte')}>หนีตำรวจ · วิ่งตามส้ม!</Button>
        <Button tone="grape" onClick={() => start('custody')}>ออกจากคุก · เกมจำภาพของส้มซ่า</Button>
        <Button tone="paper" onClick={() => start('desk')}>ส้มซ่าบนโต๊ะทำงาน</Button></>}
  </main>;
}
