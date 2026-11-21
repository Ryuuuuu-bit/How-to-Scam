import type { ScamMethod } from '../src/types/content';

// วิธีหาเงิน — Phase 1 มี 3 วิธี (ระดับ 1–2) ที่เหลือมาใน Phase 4
export const methods: ScamMethod[] = [
  {
    id: 'fake_shop',
    level: 1,
    mechanic: 'none',
    cost: 500,
    income: [1_500, 4_000],
    heat: [3, 7],
    karma: -1,
    name: { th: 'ขายของออนไลน์ไม่ส่งของ' },
    desc: {
      th: 'เปิดร้าน "ช้อปเพลินเกินคุ้ม" ขายหม้อทอดไร้อากาศราคา 99 บาท ส่งไปแต่กล่องเปล่ากับกลิ่นความผิดหวัง',
    },
  },
  {
    id: 'romance',
    level: 1,
    mechanic: 'romance',
    cost: 300,
    income: [800, 1_500],
    heat: [2, 5],
    karma: -2,
    name: { th: 'หลอกรักออนไลน์' },
    desc: {
      th: 'แต่งเป็นวิศวกรแท่นขุดเจาะน้ำมันกลางทะเลทราย (ซึ่งไม่มีทะเล) ส่งสติกเกอร์ดอกกุหลาบทุกเช้า ยิ่งคุยต่อเนื่องยิ่งได้เยอะ ทิ้งไว้สองวันเหยื่อหนี',
    },
  },
  {
    id: 'call_center',
    level: 2,
    mechanic: 'callCenter',
    cost: 3_000,
    income: [6_000, 15_000],
    heat: [8, 14],
    karma: -3,
    name: { th: 'คอลเซ็นเตอร์' },
    desc: {
      th: 'เช่าห้องแถวติดป้าย "บริษัท ไม่โกงแน่นอน จำกัด" อ่านโปรไฟล์เหยื่อ แล้วเลือกมุกให้ตรงจุดอ่อน',
    },
  },
];
