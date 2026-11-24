import type { GameEvent } from '../../src/types/content';

// ต้องตัดสินใจ — ส่งผลต่อ Karma (ผู้เล่นไม่เห็นค่า แต่มีผลกับฉากจบ)
export const karmaEvents: GameEvent[] = [
  {
    id: 'grandma_savings',
    category: 'karma',
    weight: 5,
    when: { day: [5, 30] },
    title: { th: 'ยายจะโอนเงินเก็บทั้งชีวิตมาให้' },
    body: {
      th: 'ยายทองใบ วัย 82 พิมพ์มาช้า ๆ ว่า “ยายเก็บไว้ให้หลานเรียนหนังสือ แต่ถ้าพ่อหนุ่มบอกว่าจะช่วยให้มันงอกเงย ยายก็เชื่อ”',
    },
    choices: [
      {
        text: { th: 'รับไว้ทั้งหมด' },
        outcomes: [
          {
            text: { th: 'เงินเข้า คุณนั่งมองจอนานกว่าปกติ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [40_000, 60_000] },
              { kind: 'add', stat: 'karma', value: -15 },
              { kind: 'add', stat: 'heat', value: 10 },
            ],
          },
        ],
      },
      {
        text: { th: 'รับไว้แค่ครึ่งเดียว' },
        outcomes: [
          {
            text: { th: 'คุณพิมพ์ว่า “ยายเก็บไว้ใช้ครึ่งนึงนะ” แล้วก็นั่งอ่านประโยคนั้นซ้ำอยู่นาน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: 25_000 },
              { kind: 'add', stat: 'karma', value: -8 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกความจริง ขอให้ยายเก็บเงินไว้ให้หลาน' },
        outcomes: [
          {
            text: { th: 'ยายขอบใจแล้วส่งรูปหลานใส่ชุดนักเรียนมาให้ดู' },
            effects: [
              { kind: 'add', stat: 'karma', value: 15 },
              { kind: 'flag', flag: 'spared_grandma' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'foreign_gang_offer',
    category: 'karma',
    weight: 4,
    when: { day: [8, 30] },
    title: { th: 'แก๊งต่างประเทศชวนไปทำงาน' },
    body: {
      th: 'บริษัท “โกลบอลโกงเนชันแนล” ส่งข้อเสนอ: เงินเดือนสูง มีที่พัก ออกค่าเดินทาง ไม่ต้องมีประสบการณ์ แค่ส่งพาสปอร์ตมาก่อน',
    },
    choices: [
      {
        text: { th: 'ไปเลย เงินดี' },
        outcomes: [
          {
            text: {
              th: 'ไปถึงโดนยึดพาสปอร์ต ทำงานคัดแยกซิมการ์ดวันละ 20 ชั่วโมง หนีกลับมาได้ด้วยเงินครึ่งเดียว',
            },
            effects: [
              { kind: 'mul', stat: 'dirtyCash', value: 0.5 },
              { kind: 'add', stat: 'heat', value: -20 },
              { kind: 'add', stat: 'karma', value: -5 },
              { kind: 'flag', flag: 'went_abroad' },
            ],
          },
        ],
      },
      {
        text: { th: 'ปฏิเสธ ทำงานเล็ก ๆ ในประเทศดีกว่า' },
        outcomes: [
          {
            text: { th: 'คุณบล็อกไลน์ เขาส่งข้อเสนอมาใหม่จากอีก 14 บัญชี' },
            effects: [{ kind: 'add', stat: 'karma', value: 3 }],
          },
        ],
      },
      {
        text: { th: 'ส่งข้อมูลแก๊งให้ตำรวจ' },
        outcomes: [
          {
            text: { th: 'ตำรวจขอบคุณ และเริ่มสงสัยว่าทำไมคุณรู้เรื่องนี้เยอะจัง' },
            effects: [
              { kind: 'add', stat: 'karma', value: 10 },
              { kind: 'add', stat: 'heat', value: 10 },
              { kind: 'flag', flag: 'tipped_police' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sick_child_victim',
    category: 'karma',
    weight: 6,
    when: { methods: ['call_center'] },
    title: { th: 'เหยื่อบอกว่าเงินนี้คือค่ารักษาลูก' },
    body: {
      th: 'หลังวางสาย เหยื่อโทรกลับมาร้องไห้ว่าเงินที่โอนไปคือค่าผ่าตัดลูก ลูกน้องในห้องหันมามองคุณพร้อมกัน',
    },
    choices: [
      {
        text: { th: 'โอนคืนให้' },
        outcomes: [
          {
            text: { th: 'คุณโอนคืน แล้วบอกลูกน้องว่า “ระบบมันเออเรอร์”' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [-8_000, -3_000] },
              { kind: 'add', stat: 'karma', value: 10 },
              { kind: 'loyalty', value: 10 },
            ],
          },
        ],
      },
      {
        text: { th: 'ทำเป็นไม่ได้ยิน' },
        outcomes: [
          {
            text: { th: 'คุณเปิดเพลงดังขึ้น แต่เสียงนั้นยังอยู่ในหัว' },
            effects: [
              { kind: 'add', stat: 'karma', value: -10 },
              { kind: 'loyalty', value: -10 },
            ],
          },
        ],
      },
    ],
  },
];
