import type { Festival, News } from '../src/types/content';

// เทศกาลตามปฏิทินไทย — แต่ละรอบเริ่มคนละเดือน จึงเจอเทศกาลไม่เหมือนกัน
export const festivals: Festival[] = [
  {
    id: 'songkran',
    from: [4, 10],
    to: [4, 17],
    modifiers: [
      { target: 'income', methodId: 'merit', pct: 30 },
      { target: 'heat', pct: -20 },
    ],
    name: { th: 'สงกรานต์ (ตำรวจเปียกหมด)' },
  },
  {
    id: 'kathin',
    from: [10, 15],
    to: [11, 15],
    modifiers: [{ target: 'income', methodId: 'merit', pct: 20 }],
    name: { th: 'ฤดูทอดกฐิน' },
  },
  {
    id: 'loy_krathong',
    from: [11, 10],
    to: [11, 20],
    modifiers: [{ target: 'income', methodId: 'romance', pct: 30 }],
    name: { th: 'ลอยกระทง (คนเหงาเยอะ)' },
  },
  {
    id: 'shopping_1111',
    from: [11, 9],
    to: [11, 12],
    modifiers: [{ target: 'income', methodId: 'fake_shop', pct: 60 }],
    name: { th: 'เทศกาลช้อป 11.11' },
  },
  {
    id: 'shopping_1212',
    from: [12, 10],
    to: [12, 13],
    modifiers: [{ target: 'income', methodId: 'fake_shop', pct: 50 }],
    name: { th: 'เทศกาลช้อป 12.12' },
  },
  {
    id: 'new_year',
    from: [12, 25],
    to: [1, 3],
    modifiers: [
      { target: 'income', pct: 15 },
      { target: 'heat', pct: 10 },
    ],
    name: { th: 'ปีใหม่ (ทุกคนใจป้ำ ตำรวจก็ตั้งด่าน)' },
  },
  {
    id: 'chinese_new_year',
    from: [2, 1],
    to: [2, 12],
    modifiers: [{ target: 'income', methodId: 'gambling', pct: 30 }],
    name: { th: 'ตรุษจีน (อั่งเปาเต็มกระเป๋า)' },
  },
  {
    id: 'valentine',
    from: [2, 12],
    to: [2, 15],
    modifiers: [{ target: 'income', methodId: 'romance', pct: 60 }],
    name: { th: 'วาเลนไทน์' },
  },
  {
    id: 'world_cup',
    from: [6, 10],
    to: [7, 15],
    modifiers: [{ target: 'income', methodId: 'gambling', pct: 50 }],
    name: { th: 'ฟุตบอลโลก' },
  },
  {
    id: 'rainy_flood',
    from: [9, 1],
    to: [10, 10],
    modifiers: [{ target: 'income', methodId: 'foundation', pct: 40 }],
    name: { th: 'หน้าน้ำท่วม (ยอดบริจาคพุ่ง)' },
  },
];

// ข่าวประจำสัปดาห์ — เปลี่ยนกติกาทั้งสัปดาห์ ทุกชื่อแต่งขึ้น
export const news: News[] = [
  {
    id: 'digital_wallet',
    weight: 4,
    modifiers: [{ target: 'heat', pct: 15 }],
    victimWealthPct: 40,
    title: { th: 'รัฐแจกเงินดิจิทัลคนละหมื่น' },
    body: { th: 'ทุกคนมีเงินในแอป เหยื่อรวยขึ้น 40% แต่ตำรวจไซเบอร์ก็เฝ้าแอปเป็นพิเศษ' },
  },
  {
    id: 'mule_crackdown',
    weight: 4,
    modifiers: [],
    launderSuccessPct: -15,
    title: { th: 'ตำรวจกวาดล้างบัญชีม้าทั่วประเทศ' },
    body: { th: 'ม้าวิ่งหนีกันวุ่น ฟอกเงินยากขึ้น โอกาสสำเร็จ -15%' },
  },
  {
    id: 'celebrity_arrest',
    weight: 3,
    modifiers: [{ target: 'heat', pct: -30 }],
    title: { th: 'ดาราดังโดนจับคาไลฟ์' },
    body: { th: 'สื่อทุกช่องตามข่าวดาราทั้งสัปดาห์ Heat ที่เพิ่มลดลง 30%' },
  },
  {
    id: 'ai_detector',
    weight: 3,
    modifiers: [
      { target: 'heat', methodId: 'call_center', pct: 40 },
      { target: 'heat', methodId: 'romance', pct: 40 },
    ],
    title: { th: 'ธนาคารเปิดตัว AI จับมิจฉาชีพ' },
    body: { th: 'ระบบใหม่ชื่อ "น้องจับไว" ทำงานได้ดีเกินคาด Heat คอลเซ็นเตอร์และหลอกรัก +40%' },
  },
  {
    id: 'crypto_hype',
    weight: 3,
    minLevel: 3,
    modifiers: [{ target: 'income', methodId: 'ponzi', pct: 50 }],
    title: { th: 'คริปโตขึ้นแรง ใคร ๆ ก็อยากรวย' },
    body: { th: 'ป้าข้างบ้านถามเรื่องเหรียญทุกเช้า แชร์ลูกโซ่รายได้ +50%' },
  },
  {
    id: 'viral_dance',
    weight: 3,
    modifiers: [
      { target: 'income', methodId: 'foundation', pct: 30 },
      { target: 'income', methodId: 'fake_shop', pct: 20 },
    ],
    title: { th: 'ท่าเต้นใหม่ไวรัลทั้งประเทศ' },
    body: { th: 'คนเล่นโซเชียลกันหนักมาก มูลนิธิ +30% ขายของ +20%' },
  },
  {
    id: 'election_week',
    weight: 2,
    modifiers: [{ target: 'heat', pct: -15 }],
    title: { th: 'สัปดาห์เลือกตั้ง' },
    body: { th: 'ตำรวจไปดูแลหน่วยเลือกตั้ง ทุกคนเถียงเรื่องการเมือง ไม่มีใครสนใจคุณ Heat -15%' },
  },
  {
    id: 'scam_awareness',
    weight: 3,
    modifiers: [{ target: 'income', pct: -20 }],
    title: { th: 'ทีวีทุกช่องรณรงค์รู้ทันมิจฉาชีพ' },
    body: { th: 'ป้า ๆ เริ่มวางสายใส่ ทุกวิธีรายได้ -20% (ข่าวดีของประเทศ ข่าวร้ายของคุณ)' },
  },
  {
    id: 'quiet_week',
    weight: 4,
    modifiers: [],
    title: { th: 'สัปดาห์ที่ไม่มีอะไรเกิดขึ้น' },
    body: { th: 'ข่าวหลักคือแมวติดต้นไม้ 3 วัน ทุกอย่างปกติ' },
  },
];
