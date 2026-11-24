import type { GameEvent } from '../../src/types/content';

// มุกกวน
export const sillyEvents: GameEvent[] = [
  {
    id: 'called_mom',
    category: 'silly',
    weight: 5,
    when: {},
    title: { th: 'โทรผิดไปหาแม่ตัวเอง' },
    body: { th: 'กดเบอร์มั่วตามรายชื่อ ปลายสายตอบว่า “ไอ้ตัวเล็ก กินข้าวยัง”' },
    choices: [
      {
        text: { th: 'เล่นต่อ “แม่ครับ พัสดุแม่มีจระเข้”' },
        outcomes: [
          {
            text: { th: 'แม่ด่ายาวสี่สิบนาที แล้วถามต่อว่ากินข้าวยัง' },
            effects: [{ kind: 'add', stat: 'karma', value: 1 }],
          },
          {
            text: { th: 'แม่โอนมาให้ 500 พร้อมข้อความ “ซื้อข้าวกินนะลูก” คุณรู้สึกแย่มาก' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: 500 },
              { kind: 'add', stat: 'karma', value: -3 },
            ],
          },
        ],
      },
      {
        text: { th: 'สารภาพกับแม่ว่าทำอาชีพอะไร' },
        outcomes: [
          {
            text: { th: 'แม่เงียบไปนาน แล้วบอกว่า “กลับบ้านมากินข้าวก่อน แล้วค่อยคุยกัน”' },
            effects: [
              { kind: 'add', stat: 'karma', value: 5 },
              { kind: 'add', stat: 'heat', value: 3 },
              { kind: 'flag', flag: 'mom_knows' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'scammer_vs_scammer',
    category: 'silly',
    weight: 5,
    when: {},
    title: { th: 'โทรไปเจอมิจฯ ด้วยกัน' },
    body: {
      th: 'คุยไปสองชั่วโมง ทั้งสองฝ่ายพยายามขอให้อีกฝ่ายโอน “ค่าธรรมเนียมปลดล็อกรางวัล” ก่อน',
    },
    choices: [
      {
        text: { th: 'สู้ต่อ ใครใจแข็งกว่าชนะ' },
        outcomes: [
          {
            text: { th: 'เขาใจแข็งกว่า คุณเผลอโอนให้เพราะเหนื่อย' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: [-3_000, -1_000] }],
          },
          {
            text: { th: 'คุณชนะ เขาโอนมาพร้อมสติกเกอร์ยกมือไหว้' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: [1_000, 3_000] }],
          },
        ],
      },
      {
        text: { th: 'ชวนตั้งสหภาพแรงงานมิจฉาชีพ' },
        outcomes: [
          {
            text: { th: 'ได้เพื่อนใหม่ ประชุมสหภาพครั้งแรกล่มเพราะทุกคนโกงค่าห้องประชุม' },
            effects: [
              { kind: 'add', stat: 'fame', value: 5 },
              { kind: 'flag', flag: 'scammer_union' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'goldfish_funeral',
    category: 'silly',
    weight: 4,
    when: { day: [4, 30] },
    title: { th: 'ปลาทองมงคลประจำแก๊งตายหมด' },
    body: {
      th: 'ปลาทอง “เฮงเฮง” “รวยรวย” และ “ไม่โดนจับ” ที่เลี้ยงไว้เรียกโชค ลอยหงายพร้อมกันตอนเช้า ลูกน้องบอกว่าเป็นลางร้าย',
    },
    choices: [
      {
        text: { th: 'จัดงานศพปลาทองยิ่งใหญ่' },
        outcomes: [
          {
            text: { th: 'มีคนมาร่วมงาน 200 คน ไลฟ์มีคนดูเยอะกว่าไลฟ์ขายของ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -2_000 },
              { kind: 'add', stat: 'fame', value: 10 },
            ],
          },
        ],
      },
      {
        text: { th: 'แอบซื้อปลาใหม่มาใส่แทน' },
        outcomes: [
          {
            text: { th: 'ลูกน้องจับได้ว่าตัวใหม่สีส้มกว่า ขวัญเสียกันทั้งแก๊ง รายได้ตก 2 วัน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -300 },
              { kind: 'modifier', target: 'income', pct: -20, days: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'uncle_filter',
    category: 'silly',
    weight: 5,
    when: { methods: ['romance'] },
    title: { th: 'วิดีโอคอลแต่ลืมเปิดฟิลเตอร์หนุ่มหล่อ' },
    body: {
      th: 'เหยื่อกดวิดีโอคอลมากะทันหัน คุณรับสายด้วยหน้าจริงที่ยังไม่ได้ล้างหน้า แถมใส่เสื้อกล้ามลายตาราง',
    },
    choices: [
      {
        text: { th: 'บอกว่าเป็นพี่ชายฝาแฝด' },
        outcomes: [
          {
            weight: 3,
            text: { th: 'เหยื่อเชื่อ แถมฝากความคิดถึงไปถึงคุณ' },
            effects: [],
          },
          {
            weight: 2,
            text: { th: 'เหยื่อถามว่าทำไมฝาแฝดใส่เสื้อตัวเดียวกับในรูปโปรไฟล์' },
            effects: [{ kind: 'romanceBond', value: -3 }],
          },
        ],
      },
      {
        text: { th: 'ทำหน้าแข็ง ค้างไว้ให้เหมือนเน็ตหลุด' },
        outcomes: [
          {
            text: { th: 'ภาพค้างตอนกำลังแคะหู เหยื่อแคปเก็บไว้' },
            effects: [
              { kind: 'romanceBond', value: -1 },
              { kind: 'add', stat: 'heat', value: 3 },
            ],
          },
        ],
      },
    ],
  },
];
