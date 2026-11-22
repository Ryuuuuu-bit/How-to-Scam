import { useEffect, useRef, useState } from 'react';
import { content } from '@hts/shared/data';
import { sceneUrl } from '../assets/art';
import { Art, Button } from '../components/ui';
import './how-to-play.css';

const chapters = [
  {
    id: 'plan',
    label: 'วางแผน',
    title: 'วันแรกเริ่มยังไงดี?',
    scene: 'plan',
    sceneAlt: 'ตัวละครรวมตัวกันในห้องวางแผนเหนือถนนในเมือง',
    marker: 'ก่อนกดเริ่มงาน',
    note: 'ดูต้นทุน รายได้ และ Heat',
    body: 'ลองพากย์คลิปแมวถ้าอยากได้เงินสะอาด หรือไปลุ้นข้างสนามกับโต๊ะบอลลีกปากซอย แตะการ์ดงานเพื่อดูรายละเอียดก่อนเลือกของเสริม',
    tips: [
      {
        icon: 'icon:dirty',
        title: 'เช็กเงินก่อนเริ่ม',
        text: 'แตะ “ทุนรวม” เพื่อดูราคาของ เงินที่จะเหลือ และรายได้ที่คาดไว้ จะเริ่มมือเปล่าก็ได้',
      },
      {
        icon: 'icon:lock',
        title: 'ดูสิ่งที่จะปลดล็อก',
        text: 'เปิด “ปลดล็อกถัดไป” เพื่อดูว่าต้องถึงอาชญากรรม Lv. เท่าไรจึงจะใช้แต่ละแผนได้',
      },
    ],
  },
  {
    id: 'result',
    label: 'อ่านผล',
    title: 'ดูผล แล้วรับมือเรื่องวุ่น',
    scene: 'ev_runaway_rooster',
    sceneAlt: 'ฉากเหตุการณ์ไก่ชนหลุดที่เกิดขึ้นระหว่างวัน',
    marker: 'หลังลงมือ',
    note: 'รับเงิน · Heat เปลี่ยน · เหตุการณ์สุ่ม',
    body: 'แถบผลในหน้าเล่นบอกว่าได้เงินเท่าไรและ Heat เปลี่ยนแค่ไหน ถ้าเจอเหตุการณ์สุ่ม ให้อ่านสถานการณ์ก่อนเลือกคำตอบ',
    tips: [
      {
        icon: 'icon:dirty',
        title: 'อ่านยอดสุทธิ',
        text: 'ดูช่องยอดสุทธิ จะรู้ว่าหักต้นทุนแล้วเงินในกระเป๋าเพิ่มหรือลดเท่าไร',
      },
      {
        icon: 'icon:news',
        title: 'อ่านข่าวที่มีผลกับเกม',
        text: 'ข่าวประจำสัปดาห์มีผลกับรายได้หรือความเสี่ยง ส่วนข่าวรายวันเล่าว่าเมื่อวานเกิดอะไรขึ้น',
      },
    ],
  },
  {
    id: 'shop',
    label: 'จบวัน',
    title: 'จัดการเงินก่อนปิดวัน',
    scene: 'shop',
    sceneAlt: 'บรรยากาศร้านในเมืองที่ใช้เป็นฉากร้านอัปเกรด',
    marker: 'ก่อนนอน',
    note: 'เงินสะอาดมีผลต่อคะแนน',
    body: 'ก่อนเลือกการ์ดฟอกเงิน ดูว่าโอกาสสำเร็จเท่าไร โดนหักเท่าไร และ Heat จะขึ้นแค่ไหน แล้วค่อยตัดสินใจว่าจะซื้ออัปเกรดหรือเก็บเงินไว้',
    tips: [
      {
        icon: 'icon:clean',
        title: 'เงินสองช่องต่างกันยังไง?',
        text: 'HUD แสดงเงินสกปรกกับเงินสะอาดแยกกัน โดยเงินสะอาดช่วยเพิ่มคะแนนตอนจบรอบ',
      },
      {
        icon: 'icon:day',
        title: 'ไปต่อเมื่อพร้อม',
        text: 'กด “เข้านอน จบวันนี้” เมื่อจัดการร้านอัปเกรดเสร็จ',
      },
    ],
  },
  {
    id: 'heat',
    label: 'คุม Heat',
    title: 'คุม Heat ให้อยู่รอด',
    scene: 'escape',
    sceneAlt: 'ฉากเหตุการณ์หนีตำรวจในเมือง',
    marker: 'ระดับการถูกจับตา',
    note: 'Heat 100 เปิดฉากหนีตำรวจ',
    body: `ประคองรอบให้ถึงวันที่ ${content.config.maxDays} หรือเลือกเกษียณเมื่อพร้อม เส้นทางและการตัดสินใจระหว่างรอบมีผลต่อฉากจบ`,
    tips: [
      {
        icon: 'icon:rest',
        title: 'พักเพื่อให้ Heat ลด',
        text: `ระหว่างวางแผน กด “พักวันนี้” เพื่อลด Heat ลง ${content.config.heatDecayQuietDay} หน่วย`,
      },
      {
        icon: 'icon:police',
        title: 'ตอนวิ่งต้องกดอะไร?',
        text: 'เลือกชุดปลอมตัวกับเส้นทางก่อน พอถึงช่วงวิ่ง ให้แตะตัวละครทันทีที่โผล่มา',
      },
    ],
  },
] as const;

export function HowToPlay({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const chapter = chapters[index] ?? chapters[0];
  const last = index === chapters.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [index]);

  return (
    <main className="tutorial-screen" data-chapter={chapter.id}>
      <div className="tutorial-wrap">
        <header className="tutorial-topbar">
          <button className="tutorial-back" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> กลับเมนู
          </button>
          <span
            className="tutorial-progress"
            aria-label={`บทที่ ${index + 1} จาก ${chapters.length}`}
          >
            บทที่ {index + 1}/{chapters.length}
          </span>
        </header>

        <h1 className="tutorial-title">
          วิธีเล่น <span>How to Scam</span>
        </h1>
        <nav className="tutorial-nav" aria-label="เลือกบทวิธีเล่น">
          {chapters.map((item, i) => (
            <button
              type="button"
              key={item.id}
              aria-current={index === i ? 'step' : undefined}
              onClick={() => setIndex(i)}
            >
              <span aria-hidden="true">{i + 1}</span> {item.label}
            </button>
          ))}
        </nav>

        <article className="tutorial-case" key={chapter.id} aria-labelledby="tutorial-chapter">
          <figure className="tutorial-visual">
            <img src={sceneUrl(chapter.scene)} alt={chapter.sceneAlt} />
            <figcaption>
              <span>{chapter.marker}</span>
              <strong>{chapter.note}</strong>
            </figcaption>
          </figure>
          <div className="tutorial-copy">
            <div>
              <h2 id="tutorial-chapter" tabIndex={-1} ref={heading}>
                {chapter.title}
              </h2>
              <p className="tutorial-summary">{chapter.body}</p>
            </div>
            <ul className="tutorial-tips">
              {chapter.tips.map((tip) => (
                <li key={tip.title}>
                  <span className="tutorial-tip-icon">
                    <Art id={tip.icon} size={28} />
                  </span>
                  <div>
                    <h3>{tip.title}</h3>
                    <p>{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="tutorial-actions">
              {index > 0 && (
                <Button tone="paper" onClick={() => setIndex(index - 1)}>
                  ย้อนบท
                </Button>
              )}
              <Button tone="sun" onClick={last ? onBack : () => setIndex(index + 1)}>
                {last ? 'อ่านจบ · กลับเมนู' : 'บทถัดไป'} <span aria-hidden="true">→</span>
              </Button>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}
