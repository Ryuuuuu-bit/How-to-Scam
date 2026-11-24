import { useEffect, useRef, useState } from 'react';
import './live-counter.css';
import { audio } from '../audio/audio';

export function LiveCounter({ seller, onFinish }: { seller: boolean; onFinish: (cat: boolean) => void }) {
  const [stage, setStage] = useState<'ready' | 'live' | 'photo'>('ready');
  const [pan, setPan] = useState(18);
  const [left, setLeft] = useState(10);
  const sent = useRef(false);
  const cat = pan >= 55;
  useEffect(() => {
    audio.setScene('live');
    return () => audio.setScene('normal');
  }, []);
  const spotted = useRef(false);
  useEffect(() => {
    if (stage === 'live' && cat && !spotted.current) {
      spotted.current = true;
      audio.sfx('sfx_spotted', 'event');
    }
    if (stage === 'photo' && !cat) audio.sfx('sfx_sale', 'cash');
  }, [stage, cat]);
  useEffect(() => {
    if (stage !== 'live') return;
    const end = Date.now() + 10000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remaining);
      if (!remaining) setStage('photo');
    }, 100);
    return () => window.clearInterval(timer);
  }, [stage]);
  function finish() {
    if (sent.current) return;
    sent.current = true;
    onFinish(cat);
  }
  return <section className="live-counter" aria-label="เจ๊จัดกล้องไลฟ์">
    <header><small>ตลาดเย็น · ร้านหม้อทอด</small><h2>{stage === 'photo' ? 'ช็อตเด็ดประจำไลฟ์' : 'เจ๊จัดกล้องไลฟ์'}</h2></header>
    <div className={'live-shot ' + (stage === 'photo' ? 'live-print' : '')} style={{backgroundPosition: pan + '% center'}}>
      <div className="live-indicators"><b>{stage === 'photo' ? 'ภาพจากไลฟ์' : stage === 'ready' ? 'ก่อนออนแอร์' : '● LIVE'}</b>
        {stage === 'live' && <span>คนดู {8 + (10-left)*3 + (cat ? 45 : 0)} · {left} วิ</span>}</div>
      {stage !== 'photo' && <div className="live-focus" aria-hidden="true" />}
      {stage === 'live' && <input aria-label="แพนกล้อง ซ้ายหม้อทอด ขวาแมวส้ม" aria-valuetext={cat ? 'แมวส้ม' : 'หม้อทอด'} type="range" min="0" max="100" value={pan} onChange={e => setPan(+e.target.value)} />}
      <div className="live-comment">{cat ? '♡ ป้าติ๋ม · หม้อไว้ก่อนลูก ซูมน้องให้ป้าที' : seller ? 'เจ๊ · ใครเพิ่งเข้ามา ฝากดูหม้อให้เจ๊ด้วย แมวมันเล็งอยู่' : 'ป้าติ๋ม · หม้อกี่บาทลูก'}</div>
    </div>
    {stage === 'ready' && <><p>ตั้งกล้องขายหม้อทอดอยู่ดี ๆ หางส้ม ๆ ก็โผล่มาข้างโต๊ะ…</p>
      <button onClick={() => setStage('live')}>เริ่มไลฟ์ · 10 วิ</button>
      <button className="live-secondary" onClick={() => setStage('photo')}>ขายหม้อทอดเลย</button></>}
    {stage === 'live' && <><p>ลากกล้องซ้ายขวา หรือแตะเลือกว่าจะให้ใครเข้ากล้อง</p>
      <div className="live-subjects"><button aria-pressed={!cat} onClick={() => setPan(18)}>หม้อทอด · ฿500</button><button aria-pressed={cat} onClick={() => setPan(90)}>แมวส้ม · ชื่อเสียง +4</button></div>
      <button onClick={() => setStage('photo')}>เก็บช็อตนี้</button></>}
    {stage === 'photo' && <div aria-live="polite"><p><strong>{cat ? 'ชื่อเสียง +4' : 'ยอดขาย +฿500'}</strong><br/>{cat ? 'ป้าติ๋มส่งไลฟ์เข้ากลุ่มหมู่บ้าน พร้อมแคปชัน “ตัวนี้แหละที่เล่าให้ฟัง”' : 'ป้าติ๋มรับหม้อหนึ่งใบ แล้วทิ้งท้ายว่า “พรุ่งนี้พาแมวมาอีกนะลูก”'}</p>
      <button onClick={finish}>เล่นต่อ</button></div>}
  </section>;
}
