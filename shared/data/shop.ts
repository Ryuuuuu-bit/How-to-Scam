import type { ShopItem } from '../src/types/content';

// daily = ซื้อในขั้น "ลงทุน" มีผลเฉพาะวันนั้น
// henchman = จ้างลูกน้อง (อยู่ถาวร จ่ายค่าจ้างทุกวัน)
// permanent = ร้านอัปเกรดท้ายวัน
export const shopItems: ShopItem[] = [
  {
    id: 'sim_pack',
    kind: 'daily',
    price: 300,
    maxStack: 3,
    heatPct: -10,
    name: { th: 'ซิมลายการ์ตูนแพ็กสาม' },
    desc: { th: 'เปลี่ยนเบอร์บ่อยจนจำเบอร์ตัวเองไม่ได้ Heat วันนี้ -10% ต่อแพ็ก' },
  },
  {
    id: 'ads',
    kind: 'daily',
    price: 1_000,
    maxStack: 3,
    incomePct: 15,
    name: { th: 'ยิงแอดแบบมั่วๆ' },
    desc: { th: 'จ้างเพจ "คนไทยชอบของถูก" โปรโมต รายได้วันนี้ +15% ต่อครั้ง' },
  },
  {
    id: 'celebrity_promo',
    kind: 'daily',
    price: 6_000,
    maxStack: 1,
    minLevel: 3,
    methodId: 'gambling',
    incomePct: 60,
    heatPct: 25,
    name: { th: 'จ้างดาราโปรโมต' },
    desc: {
      th: 'จ้าง "คุณหลิว เสียงหวาน" ไลฟ์ชวนเล่นเว็บ รายได้เว็บพนันวันนี้ +60% แต่ Heat +25% เพราะดาราชอบพูดเกินบท',
    },
  },
  {
    id: 'henchman',
    kind: 'henchman',
    price: 2_000,
    maxStack: 3,
    incomePct: 15,
    wage: 500,
    name: { th: 'จ้างลูกน้อง' },
    desc: {
      th: 'รับสมัครจากกลุ่ม "หางานด่วน ไม่ต้องคิดเยอะ" รายได้ +5–15% ค่าจ้างวันละ 500 ถ้าความภักดีต่ำอาจซัดทอด',
    },
  },
  {
    id: 'new_phone',
    kind: 'permanent',
    price: 8_000,
    maxStack: 2,
    incomePct: 10,
    name: { th: 'มือถือจอไม่แตก' },
    desc: { th: 'ครั้งแรกในชีวิตที่ได้ใช้มือถือจอไม่แตก รายได้ +10% ถาวร' },
  },
  {
    id: 'lucky_lawyer',
    kind: 'permanent',
    price: 15_000,
    maxStack: 1,
    heatPct: -15,
    name: { th: 'ทนายเสี่ยงดวง' },
    desc: { th: 'จบนิติจากมหาวิทยาลัยที่ไม่มีใครเคยได้ยินชื่อ Heat ที่เพิ่ม -15% ถาวร' },
  },
  {
    id: 'rename_page',
    kind: 'permanent',
    price: 4_000,
    maxStack: 5,
    heatNow: 15,
    name: { th: 'เปลี่ยนชื่อเพจใหม่' },
    desc: { th: 'จาก "ช้อปเพลิน" เป็น "ช้อปเพลินเพลิน" ชาวเน็ตงงไปพักนึง Heat -15 ทันที' },
  },
];
