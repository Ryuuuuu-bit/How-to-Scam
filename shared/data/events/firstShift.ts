import type { GameEvent } from '../../src/types/content';

export const firstShift: GameEvent[] = [
  {
    id: 'soi_derby', category: 'silly', chainOnly: true, weight: 1, when: {},
    title: { th: 'ตัวสำรองมีสี่ขา' },
    body: { th: 'ทดเจ็บนาทีสุดท้าย หมาคาบบอลวิ่งเข้าโกล ทั้งสนามหันมาหาโต๊ะคุณ “ลูกนี้นับไหมพี่?”' },
    choices: [
      { text: { th: 'ยกไมค์ให้กรรมการ · Heat −2' }, outcomes: [{ text: { th: 'กรรมการเป่าหมดเวลา หมาคาบนกหวีดไปด้วย ทีนี้จบจริง' }, effects: [{ kind: 'add', stat: 'heat', value: -2 }] }] },
      { text: { th: 'ให้รางวัลดาวซัลโวสี่ขา · ชื่อเสียง +4' }, outcomes: [{ text: { th: 'แฟนบอลตะโกนขอเสื้อนักเตะ เจ้าของหมาถอดปลอกคอชูแทน' }, effects: [{ kind: 'add', stat: 'fame', value: 4 }] }] },
    ],
  },
  {
    id: 'soi_unboxing', category: 'silly', chainOnly: true, weight: 1, when: {},
    title: { th: 'กล่องใหญ่สมคำโฆษณา' },
    body: { th: 'ลูกค้าแกะกล่องกลางไลฟ์ เจออีกกล่อง อีกกล่อง แล้วก็อีกกล่อง คนดูเริ่มนับพร้อมกัน' },
    choices: [
      { text: { th: 'คืนเงินให้ลูกค้า ฿120 · กรรมดี +3' }, requires: { minDirtyCash: 120 }, outcomes: [{ text: { th: 'ลูกค้ารับเงินคืน แต่กอดกล่องไว้ “อันนี้ขอนะพี่ แมวที่บ้านจองแล้ว”' }, effects: [{ kind: 'add', stat: 'dirtyCash', value: -120 }, { kind: 'add', stat: 'karma', value: 3 }] }] },
      { text: { th: 'ให้แชตทายว่ามีกี่ชั้น · ชื่อเสียง +3' }, outcomes: [{ text: { th: 'คนทายถูกคนเดียวคือแม่ค้ากล่อง “พี่จำลูกค้าได้ เมื่อวานเหมาไปทั้งลัง”' }, effects: [{ kind: 'add', stat: 'fame', value: 3 }] }] },
    ],
  },
  {
    id: 'soi_cat_voice', category: 'silly', chainOnly: true, weight: 1, when: {},
    title: { th: 'นักพากย์โดนแมวแย่งไมค์' },
    body: { th: 'คุณกำลังพากย์ว่า “วันนี้เจ้านายให้กินแต่เม็ด” ส้มซ่าเดินมาเรอใส่ไมค์เต็ม ๆ เจ้าของถามว่าจะเก็บเทกนี้ไหม' },
    choices: [
      { text: { th: 'เก็บเสียงจริงลงคลิป · ชื่อเสียง +3' }, outcomes: [{ text: { th: 'คอมเมนต์แรกถามว่าใครพากย์เสียงเรอ เจ้าของตอบ “เจ้าตัวรับงานเองค่ะ”' }, effects: [{ kind: 'add', stat: 'fame', value: 3 }] }] },
      { text: { th: 'อัดเวอร์ชันเสียงสุภาพ · เงินสะอาด +฿100' }, outcomes: [{ text: { th: 'ลูกค้าโอนเพิ่มร้อยนึง ขอไฟล์เสียงเรอแยกด้วย จะเอาไว้ตั้งเป็นเสียงแจ้งเตือน' }, effects: [{ kind: 'add', stat: 'cleanCash', value: 100 }] }] },
    ],
  },
];
