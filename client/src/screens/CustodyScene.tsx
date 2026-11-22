import { useState } from 'react';
import { dreamSequence, type Action, type GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { Art, Button } from '../components/ui';
import './custody.css';

const stamps = [{ icon: '🐟', name: 'ปลาทู' }, { icon: '🐾', name: 'อุ้งเท้า' }, { icon: '🌙', name: 'พระจันทร์' }];
const contentKeep = content.config.caughtCleanKeepPct;

export function CustodyScene({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [page, setPage] = useState<'cell' | 'remember' | 'play'>('cell');
  const [answer, setAnswer] = useState<number[]>([]);
  const [photo, setPhoto] = useState(false);
  const code = dreamSequence(state);
  const available = !state.flags.includes('dream_escape') && !state.flags.includes('surrendered');
  const cell = page === 'cell';
  function stamp(n: number) {
    if (answer.length === code.length) return;
    const next = [...answer, n];
    setAnswer(next);
    if (next.length === code.length) dispatch({ t: 'custodyVerdict', answer: next });
  }
  return <section className="custody-card">
    <div className={'custody-art ' + (cell ? 'cell-art' : 'dream-art')}>
      <span className="custody-tag">{cell ? 'บันทึกประจำวัน' : 'ความฝันของแมวส้ม'}</span>
      {!cell && <div className="dream-door"><Art id="char:orange_cat" size={94} /></div>}
      {cell && photo && <div className="booking-photo"><Art id={'char:' + state.characterId} size={76} /><span>คดีวันที่ {state.day}</span></div>}
      <h2>{cell ? 'คืนแรกหลังลูกกรง' : 'แหกคุกมิติแมว'}</h2>
    </div>
    <div className="custody-copy">
      {cell && <><p>{available ? 'คุณเพิ่งได้เตียงริมหน้าต่าง แมวส้มก็มานอนทับหมอน พอเคลิ้มหลับ มันกระซิบว่า “อยากออกทางประตูแมวมะ?”' : 'แมวส้มจองหมอนใบเดียวในห้องไปแล้ว คืนนี้คุณเลยได้ทั้งเตียง… ยกเว้นตรงหัว'}</p>
        {photo ? <p role="status">“รูปนี้ใช้ยื่นสมัครงานได้ไหมครับ” ทั้งห้องเงียบ… ได้ยินแต่เสียงแมวกรน</p> :
          <Button tone="sun" block onClick={() => setPhoto(true)}>ถ่ายรูปติดแฟ้มคดี</Button>}
        {available && <><Button tone="grape" block onClick={() => setPage('remember')}>ตามแมวเข้าไปในฝัน</Button><small>ลองได้ครั้งเดียวต่อรอบ จำถูกแล้วไปต่ออีกวัน (สูงสุดวันที่ {content.config.maxDays}) เงินสกปรกถูกยึด เงินสะอาดเหลือ ฿{Math.round(state.cleanCash * contentKeep / 100).toLocaleString('th-TH')} และ Heat เหลือ 45</small></>}
        <Button tone="paper" block onClick={() => dispatch({ t: 'custodyVerdict', answer: null })}>ดูบทสรุปคดี</Button></>}
      {page === 'remember' && <><p>แมวส้มประทับตราสามดวงบนประตูเมฆ จำจากซ้ายไปขวาแล้วกดตามให้ครบ ถ้าผิด คุณจะตื่นในห้องขัง</p>
        <ol className="dream-stamps">{code.map((n,i) => <li key={i}><b>{stamps[n]!.icon}</b>{stamps[n]!.name}</li>)}</ol>
        <Button tone="grape" block onClick={() => setPage('play')}>จำได้แล้ว พลิกป้ายเลย</Button></>}
      {page === 'play' && <><p aria-live="polite">ตราดวงที่ {Math.min(answer.length+1,3)} จาก 3 · {answer.length ? answer.map(n => stamps[n]!.name).join(' → ') : 'เริ่มจากดวงซ้ายสุด'}</p>
        <div className="dream-stamps">{stamps.map((s,n) => <button key={s.name} onClick={() => stamp(n)}><b>{s.icon}</b>{s.name}</button>)}</div></>}
    </div>
  </section>;
}
