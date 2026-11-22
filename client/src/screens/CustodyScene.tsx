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
    setAnswer(previous => previous.length < code.length ? [...previous, n] : previous);
  }
  return <section className="custody-card">
    <div className={'custody-art ' + (cell ? 'cell-art' : 'dream-art')}>
      <span className="custody-tag">{cell ? 'บันทึกประจำวัน' : 'เกมจำภาพของส้มซ่า'}</span>
      {!cell && <div className="dream-door"><Art id="char:orange_cat" size={94} /></div>}
      {cell && photo && <div className="booking-photo"><Art id={'char:' + state.characterId} size={76} /><span>คดีวันที่ {state.day}</span></div>}
      <h2>{cell ? 'คืนแรกหลังลูกกรง' : page === 'remember' ? '① จำภาพจากซ้ายไปขวา' : '② แตะภาพตามที่จำไว้'}</h2>
    </div>
    <div className="custody-copy">
      {cell && <><p>{available ? 'ส้มซ่าคาบการ์ดสามใบมาวางหน้าห้องขัง “จำให้ได้นะ เดี๋ยวส้มคว่ำไพ่ ถ้าจิ้มถูกทั้งสามใบ ส้มพากลับตลาดเอง”' : 'แมวส้มจองหมอนใบเดียวในห้องไปแล้ว คืนนี้คุณเลยได้ทั้งเตียง… ยกเว้นตรงหัว'}</p>
        {available && <><Button tone="grape" block onClick={() => setPage('remember')}>เล่นเกมจำภาพเพื่อออกจากคุก</Button><small>ตอบถูกได้เล่นต่อวันที่ {Math.min(state.day + 1, content.config.maxDays)} เงินสกปรกถูกยึด เงินสะอาดเหลือ ฿{Math.round(state.cleanCash * contentKeep / 100).toLocaleString('th-TH')} และ Heat เหลือ 45 ถ้าตอบผิด รอบนี้จบในคุก</small></>}
        {photo ? <p role="status">“รูปนี้ใช้ยื่นสมัครงานได้ไหมครับ” ทั้งห้องเงียบ… ได้ยินแต่เสียงแมวกรน</p> :
          <Button tone="sun" block onClick={() => setPhoto(true)}>ถ่ายรูปติดแฟ้มคดี</Button>}
        <Button tone="paper" block onClick={() => dispatch({ t: 'custodyVerdict', answer: null })}>จบรอบในคุก</Button></>}
      {page === 'remember' && <><p>ดูได้จนกว่าจะพร้อม พอกดคว่ำไพ่แล้ว ให้แตะรูปเรียงตามที่เห็น รูปซ้ำก็แตะซ้ำได้</p>
        <ol className="dream-stamps">{code.map((n,i) => <li key={i}><small>ใบที่ {i+1}</small><b>{stamps[n]!.icon}</b>{stamps[n]!.name}</li>)}</ol>
        <Button tone="grape" block onClick={() => setPage('play')}>จำแล้ว · คว่ำไพ่</Button></>}
      {page === 'play' && <><p aria-live="polite">{answer.length === 3 ? 'ครบแล้ว ตรวจลำดับก่อนส่งคำตอบ' : 'เลือกภาพที่ ' + (answer.length+1) + ' จาก 3'}</p>
        <ol className="dream-stamps answer-slots" aria-label="คำตอบของคุณ">{code.map((_,i) => {
          const picked = stamps[answer[i] ?? -1];
          return <li key={i} aria-current={answer.length === i ? 'step' : undefined}><small>ใบที่ {i+1}</small><b>{picked?.icon ?? '·'}</b>{picked?.name ?? 'ว่าง'}</li>;
        })}</ol>
        <div className="dream-stamps">{stamps.map((s,n) => <button key={s.name} disabled={answer.length === 3} onClick={() => stamp(n)}><b>{s.icon}</b>{s.name}</button>)}</div>
        {answer.length > 0 && <Button tone="paper" block onClick={() => setAnswer(answer.slice(0,-1))}>ลบใบล่าสุด</Button>}
        {answer.length === 3 && <Button tone="grape" block onClick={() => dispatch({ t: 'custodyVerdict', answer })}>ส่งคำตอบ</Button>}</>}
    </div>
  </section>;
}
