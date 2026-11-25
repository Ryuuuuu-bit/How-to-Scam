import { useEffect, useRef, useState } from 'react';
import { content } from '../game/content';
import { sceneUrl } from '../assets/art';
import { Art, Button } from '../components/ui';
import './how-to-play.css';

const chapters = [
  {
    id: 'start',
    label: 'เริ่มรอบ',
    title: 'เลือกตัวละครกับระยะเวลา',
    scene: 'plan',
    sceneAlt: 'ตัวละครรวมตัวกันในห้องวางแผนเหนือถนนในเมือง',
    marker: 'ก่อนเข้าซอย',
    note: '30 / 60 / 90 วัน · ตัวละครเริ่มต้น 3 ตัว',
    body: 'ทุกคนเริ่มด้วยอดีตเซลส์ประกัน เด็กติดเกม และลูกศิษย์วัด แต่ละตัวมีจุดเด่น จุดอ่อน และงานที่ถนัดไม่เหมือนกัน รอบ 30 วันเหมาะกับการเริ่มต้น ส่วนรอบ 60 และ 90 วันจะมีทางเลือกชีวิตเพิ่มเข้ามาตอนกลางเรื่อง',
    tips: [
      {
        icon: 'icon:audition',
        title: 'อยากได้ตัวละครเพิ่ม?',
        text: 'อีก 8 ตัวรับเข้าแก๊งได้ด้วยเงินใต้ดิน หรือผ่านออดิชั่นในรอบเดียวแล้วได้ฟรี ดูโจทย์ออดิชั่นได้ในหน้าเลือกอาชีพ',
      },
      {
        icon: 'icon:day',
        title: 'ลองก่อนซื้อ',
        text: 'Daily Challenge สุ่มตัวละครให้ทุกคนเล่นตัวเดียวกัน บางวันจะได้เล่นตัวที่ยังไม่มีในแก๊ง',
      },
    ],
  },
  {
    id: 'plan',
    label: 'วางแผน',
    title: 'ตอนเช้า: เลือกงานของวันนี้',
    scene: 'invest',
    sceneAlt: 'โต๊ะวางแผนลงทุนก่อนเริ่มงาน',
    marker: 'ก่อนกดเริ่มงาน',
    note: 'ดูต้นทุน รายได้ และ Heat',
    body: 'แตะการ์ดงานเพื่อดูต้นทุน รายได้ที่คาดไว้ และ Heat แล้วค่อยเลือกของเสริมก่อนลงมือ งานคอลเซ็นเตอร์ต้องเลือกบทพูดให้ตรงกับจุดอ่อนของเหยื่อ ส่วนงานอื่นจะลุ้นผลทันที',
    tips: [
      {
        icon: 'icon:dirty',
        title: 'เช็กเงินก่อนเริ่ม',
        text: 'แตะ “ทุนรวม” เพื่อดูราคาของ เงินที่จะเหลือ และรายได้ที่คาดไว้ จะเริ่มมือเปล่าก็ได้',
      },
      {
        icon: 'icon:lock',
        title: 'ปลดล็อกงานใหม่',
        text: 'เปิด “ปลดล็อกถัดไป” เพื่อดูว่าต้องถึงอาชญากรรม Lv. เท่าไรจึงจะใช้แต่ละแผนได้ Lv. นี้เป็นของในรอบนั้น เริ่มรอบใหม่ก็เริ่มนับใหม่',
      },
      {
        icon: 'icon:fame',
        title: 'เลือกสายอาชีพ',
        text: 'ทำงานเดิมครบ 3 กะ (งานที่ตัวละครถนัดแค่ 2 กะ) จะเลือกสายออกหน้าหรือสายคุมกิจการได้ แต่ละสายมีโบนัสและภารกิจปิดท้ายของตัวเอง',
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
    body: 'แถบผลในหน้าเล่นบอกว่าได้เงินเท่าไรและ Heat เปลี่ยนแค่ไหน ถ้าเจอเหตุการณ์สุ่ม ให้อ่านสถานการณ์ก่อนเลือกคำตอบ บางตัวเลือกต้องมีเงิน ชื่อเสียง หรือลูกน้องก่อนถึงจะกดได้',
    tips: [
      {
        icon: 'icon:dirty',
        title: 'อ่านยอดสุทธิ',
        text: 'ดูช่องยอดสุทธิ จะรู้ว่าหักต้นทุนแล้วเงินในกระเป๋าเพิ่มหรือลดเท่าไร',
      },
      {
        icon: 'icon:news',
        title: 'อ่านข่าวที่มีผลกับเกม',
        text: 'ข่าวประจำสัปดาห์และเทศกาลมีผลกับรายได้หรือความเสี่ยง ส่วนข่าวรายวันเล่าว่าเมื่อวานเกิดอะไรขึ้น',
      },
    ],
  },
  {
    id: 'shop',
    label: 'จบวัน',
    title: 'ฟอกเงิน แล้วช้อปก่อนนอน',
    scene: 'shop',
    sceneAlt: 'บรรยากาศร้านในเมืองที่ใช้เป็นฉากร้านอัปเกรด',
    marker: 'ก่อนนอน',
    note: 'เงินสะอาดมีผลต่อคะแนน',
    body: 'ก่อนเลือกการ์ดฟอกเงิน ดูว่าโอกาสสำเร็จเท่าไร โดนหักเท่าไร และ Heat จะขึ้นแค่ไหน จากนั้นแวะร้านอัปเกรดท้ายวันก่อนกด “เข้านอน จบวันนี้”',
    tips: [
      {
        icon: 'icon:clean',
        title: 'เงินสองช่องต่างกันยังไง?',
        text: 'HUD แสดงเงินสกปรกกับเงินสะอาดแยกกัน เงินสะอาดคือคะแนนตอนจบรอบ และไม่โดนยึดตอนสารวัตรบุก',
      },
      {
        icon: 'icon:market',
        title: 'ตลาดมืดกับดีลเถื่อน',
        text: 'ตลาดมืดสุ่มของใหม่ 3 ชิ้นทุกคืน ของหายากโผล่มานาน ๆ ที จองไว้คืนพรุ่งนี้ได้หนึ่งชิ้นในราคา ฿300 เฮียโต้งมีดีลลดครึ่งราคาคืนละชิ้น แต่ใบเสร็จจะไปโผล่บนบอร์ดคดี เว้นแต่เฮียจะเป็นพวกเดียวกับคุณ',
      },
      {
        icon: 'shop:new_phone',
        title: 'แอปมือถือกับห้องลับ',
        text: 'แอปซื้อครั้งเดียวใช้ได้ทั้งรอบ เช่นแอปสายในโรงพักที่เตือนก่อนโดนบุก ห้องลับย้ายได้สามขั้น แต่ละขั้นจ้างลูกน้องได้เพิ่มหรือกันสารวัตรได้ดีขึ้น',
      },
    ],
  },
  {
    id: 'soi',
    label: 'ซอยจำได้',
    title: 'ทั้งซอยจำคุณได้',
    scene: 'ev_auntie_neighbors_unite',
    sceneAlt: 'เพื่อนบ้านในซอยมารวมตัวกัน',
    marker: 'ใหม่ในรุ่น 1.0',
    note: 'แผนที่ซอย · เพื่อนบ้าน · ของประจำสถานที่',
    body: 'ทำงานที่เดิมครบ 4 กะ ซอยจะขอให้คุณตัดสินใจว่าที่นั่นจะเป็นสายนายทุน สายชุมชน หรือสายดัง ทางที่เลือกเปลี่ยนหน้าตาสถานที่ เปลี่ยนรายได้ และปลดของประจำสถานที่ชิ้นนั้นในร้านอัปเกรด เพื่อนบ้านจำได้ว่าคุณช่วยใครหรือทิ้งใคร และบางคนจะนัดคุยเรื่องสำคัญตอนเช้า',
    tips: [
      {
        icon: 'icon:festival',
        title: 'เปิดแอปในมือถือ',
        text: 'แตะ “แผนที่ซอย” ใต้ HUD เพื่อดูสถานที่ ความสัมพันธ์กับเพื่อนบ้าน และแอปที่ติดตั้งไว้',
      },
      {
        icon: 'icon:reform',
        title: 'เพื่อนบ้านเป็นพวกหรือศัตรู',
        text: 'เพื่อนบ้านที่ชอบคุณมากพอจะช่วยเรื่องต่าง ๆ เช่นเฮียโต้งปิดดีลให้เงียบ ส่วนคนที่ไม่ชอบอาจไปเล่าให้สารวัตรฟัง',
      },
    ],
  },
  {
    id: 'heat',
    label: 'คุม Heat',
    title: 'สารวัตร Heat และการหนี',
    scene: 'escape',
    sceneAlt: 'ฉากเหตุการณ์หนีตำรวจในเมือง',
    marker: 'ระดับการถูกจับตา',
    note: 'Heat 100 เปิดฉากหนีตำรวจ',
    body: `สารวัตรหมูกระทะปักหมุดหลักฐานบนบอร์ดคดีทุกครั้งที่คุณเสียงดังเกินไป พอหลักฐานหนักพอเขาจะบุกค้นและยึดเงินสกปรกไปบางส่วน ถ้า Heat ถึง 100 จะต้องวิ่งหนี ประคองรอบให้ถึงวันสุดท้ายของรอบที่เลือก หรือเกษียณเมื่อพร้อม เส้นทางระหว่างรอบมีผลต่อฉากจบ`,
    tips: [
      {
        icon: 'icon:police',
        title: 'เดินเกมกับสารวัตร',
        text: 'ตอนวางแผนเช้า เปิด “บอร์ดคดี” เพื่อทำลายหลักฐาน วางเบาะแสปลอม หรือป้อนข่าวแก๊งคู่แข่งได้วันละครั้ง',
      },
      {
        icon: 'icon:rest',
        title: 'พักเพื่อให้ Heat ลด',
        text: `ระหว่างวางแผน กด “พักวันนี้” เพื่อลด Heat ลง ${content.config.heatDecayQuietDay} หน่วย ของบางชิ้นในร้านช่วยให้ลดได้มากขึ้น`,
      },
      {
        icon: 'icon:bribe',
        title: 'ตอนวิ่งต้องกดอะไร?',
        text: 'เลือกชุดปลอมตัวกับเส้นทางก่อน พอถึงช่วงวิ่ง ให้แตะตัวละครทันทีที่โผล่มา ถ้าโดนจับยังมีโอกาสสู้คดีในห้องสอบสวน',
      },
    ],
  },
  {
    id: 'meta',
    label: 'หลังจบรอบ',
    title: 'ค่าหัว เงินใต้ดิน และตลาดใต้ดิน',
    scene: 'underground_market',
    sceneAlt: 'ตลาดใต้ดินลับใต้ลานจอดรถ มีเวทีออดิชั่นและคนนับเงิน',
    marker: 'ทุกรอบที่จบ',
    note: 'รอดหรือโดนจับ ก็ได้ของติดตัว',
    body: 'จบรอบแล้วคุณจะได้สองอย่าง ค่าหัวคือยศถาวรที่โตขึ้นเรื่อย ๆ ตามผลงาน ส่วนเงินใต้ดินคือเงินไว้ใช้ในตลาดใต้ดิน ทั้งสองอย่างคิดจากจำนวนวันที่อยู่รอด คะแนน และจำนวนงานที่เคยลอง',
    tips: [
      {
        icon: 'icon:bounty',
        title: 'ค่าหัว',
        text: 'ค่าหัวยิ่งสูง ยศยิ่งดัง และปลดตัวละครพิเศษได้ (พี่เก่งบ้าพลัง ทนายสายเทา อดีตนักโทษ) ค่าหัวไม่มีวันลด ใช้จ่ายไม่ได้',
      },
      {
        icon: 'icon:undermoney',
        title: 'เงินใต้ดิน',
        text: 'ใช้รับตัวละครใหม่เข้าแก๊ง หรือซื้อฉากเมนูกับสกินได้ทันทีโดยไม่ต้องรอค่าหัวถึง ของแต่งไม่มีผลกับค่าสถานะหรือคะแนน',
      },
      {
        icon: 'icon:audition',
        title: 'ออดิชั่น',
        text: 'ตัวละครที่ต้องซื้อแต่ละตัวมีโจทย์ เช่น ทำงานที่เขาถนัดครบตามจำนวนกะในรอบเดียว เล่นตัวไหนก็ได้ ทำครบแล้วได้ตัวนั้นฟรีตอนจบรอบ',
      },
      {
        icon: 'icon:medal',
        title: 'สะสมอย่างอื่นด้วย',
        text: 'หอฉากจบเก็บทุกตอนจบที่เคยเห็น เหรียญความสำเร็จบอกเป้าหมายแปลก ๆ ให้ลอง และกระดานคะแนนแยกตามรอบ 30 / 60 / 90 วันและ Daily',
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
