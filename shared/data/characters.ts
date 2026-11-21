import type { Character } from '../src/types/content';

// ตัวละครเริ่มต้น — โบนัสของ gambling / merit จะมีผลเมื่อวิธีนั้นมาใน Phase 4
export const characters: Character[] = [
  {
    id: 'ex_insurance',
    bonus: { methodId: 'call_center', pct: 20 },
    name: { th: 'อดีตเซลส์ประกัน' },
    desc: { th: 'พูดได้ 3 ชั่วโมงไม่หายใจ เคยขายประกันชีวิตให้ตุ๊กแก คอลเซ็นเตอร์ +20%' },
  },
  {
    id: 'gamer_kid',
    bonus: { methodId: 'gambling', pct: 20 },
    name: { th: 'เด็กติดเกม' },
    desc: { th: 'นอนวันละ 2 ชั่วโมง ที่เหลือกดกาชา เข้าใจจิตใจนักพนันดีที่สุด เว็บพนัน +20%' },
  },
  {
    id: 'temple_kid',
    bonus: { methodId: 'merit', pct: 20 },
    name: { th: 'ลูกศิษย์วัดสายเทา' },
    desc: {
      th: 'โตมากับงานวัด รู้ว่างานไหนคนใจบุญเยอะ แต่ดันเอาความรู้ไปใช้ผิดทาง งานบุญ +20%',
    },
  },
];
