import { useState } from 'react';
import { Button } from '../components/ui';
import './custody.css';

export function CatDesk({ choose }: { choose: (index: number) => void }) {
  const [spot, setSpot] = useState(25);
  const glass = spot >= 55;
  return <section className="custody-card">
    <div className="custody-art cat-desk"><span className="custody-tag">โต๊ะทำงานของส้มซ่า</span>
      <span className="desk-paw" style={{left: spot+'%'}}>🐾</span>
      <input className="desk-range" type="range" min="0" max="100" value={spot} aria-label="เลื่อนอุ้งเท้า ซ้ายคีย์บอร์ด ขวาแก้วน้ำ" onChange={e => setSpot(+e.target.value)} />
    </div>
    <div className="custody-copy"><h2 className="font-display text-xl font-bold">ใครบอกให้เปิดคอมทิ้งไว้</h2><p>เลื่อนอุ้งเท้าส้มซ่าบนโต๊ะ จิ้มคีย์บอร์ดก็ลุ้นยอดเงิน ปัดแก้วน้ำก็จบงานไวหน่อย</p>
      <div className="dream-stamps"><button aria-pressed={!glass} onClick={() => setSpot(25)}>⌨️ คีย์บอร์ด</button><button aria-pressed={glass} onClick={() => setSpot(78)}>🥛 แก้วน้ำ</button></div>
      <Button block tone="sun" onClick={() => choose(glass ? 1 : 0)}>{glass ? 'ปัดแก้วเลย · Heat −12' : 'นอนทับเลย · ลุ้นเงินสกปรก −20% หรือ +30%'}</Button>
    </div></section>;
}
