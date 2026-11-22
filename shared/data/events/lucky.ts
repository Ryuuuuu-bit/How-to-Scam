import type { GameEvent } from '../../src/types/content';

// ดวงดี
export const luckyEvents: GameEvent[] = [
  {
    id: 'celebrity_scandal',
    category: 'lucky',
    weight: 6,
    when: { heat: [20, 100], day: [3, 30] },
    title: { th: 'ดาราดังยักยอกเงินมูลนิธิ 1,000 ล้าน!' },
    body: {
      th: '"พี่ดาวเด่น ค้างฟ้า" ดาราเบอร์ต้นถูกแฉว่ายักยอกเงิน "มูลนิธิดาวค้างฟ้าเพื่อดาวค้างฟ้า" ไป 1,000 ล้าน ทั้งประเทศหันไปดูดราม่านี้หมด ไม่มีใครสนใจคุณเลยสักคน',
    },
    choices: [
      {
        text: { th: 'นั่งกินป๊อปคอร์นดูดราม่าเงียบ ๆ' },
        outcomes: [
          {
            text: { th: 'ตำรวจไซเบอร์ทั้งกองย้ายไปทำคดีดารา คุณหายใจโล่งขึ้นเยอะ' },
            effects: [{ kind: 'add', stat: 'heat', value: -25 }],
          },
        ],
      },
      {
        text: { th: 'เปิดไลฟ์วิจารณ์ดราม่า เก็บยอดวิว' },
        outcomes: [
          {
            text: {
              th: 'ไลฟ์ "ดาราโกงเงินมูลนิธิ รับไม่ได้!" ยอดวิวพุ่ง ไม่มีใครรู้ว่าคนไลฟ์ก็โกงเหมือนกัน',
            },
            effects: [
              { kind: 'add', stat: 'heat', value: -15 },
              { kind: 'add', stat: 'fame', value: 15 },
              { kind: 'add', stat: 'dirtyCash', value: [2_000, 6_000] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lonely_tycoon',
    category: 'lucky',
    weight: 5,
    when: { methods: ['romance'] },
    title: { th: 'เหยื่อรายใหม่เป็นเศรษฐีเหงา' },
    body: {
      th: 'เสี่ยสมหวัง เงินถุงเงินถัง วัย 66 ทักมาว่า "ไม่มีใครฟังเรื่องปลาคาร์ปของผมเลย" คุณเห็นโอกาส',
    },
    choices: [
      {
        text: { th: 'เล่นบทยาว ฟังเรื่องปลาคาร์ปทุกคืน' },
        outcomes: [
          {
            text: { th: 'คุณรู้จักปลาคาร์ปทั้ง 214 ตัวด้วยชื่อ เสี่ยผูกพันสุด ๆ' },
            effects: [
              { kind: 'romanceBond', value: 3 },
              { kind: 'add', stat: 'karma', value: -2 },
            ],
          },
        ],
      },
      {
        text: { th: 'ขอยืมก้อนใหญ่ทีเดียวจบ' },
        outcomes: [
          {
            text: { th: 'เสี่ยโอนให้ทันทีพร้อมรูปปลาคาร์ป แต่เริ่มสงสัยนิด ๆ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [20_000, 40_000] },
              { kind: 'add', stat: 'heat', value: 10 },
              { kind: 'romanceBond', value: -3 },
              { kind: 'add', stat: 'karma', value: -4 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lottery_hit',
    category: 'lucky',
    weight: 4,
    when: { day: [2, 30] },
    title: { th: 'หวยออกตรงเลขที่ใบ้มั่ว ๆ' },
    body: {
      th: 'เมื่อวานคุณโพสต์เลขที่เห็นบนป้ายทะเบียนรถขายลูกชิ้น วันนี้หวยออกตรงเป๊ะ เพจคุณมีคนแห่ไลก์',
    },
    choices: [
      {
        text: { th: 'ตั้งตัวเป็น "อาจารย์ใบ้แม่น" ขายเลขงวดหน้า' },
        outcomes: [
          {
            text: { th: 'คนแห่จ่ายค่าเลขเด็ด งวดหน้าก็ต้องฝากความหวังไว้กับทะเบียนรถลูกชิ้นเจ้าเดิม' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [5_000, 15_000] },
              { kind: 'add', stat: 'fame', value: 10 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'เก็บเงียบ ซื้อหวยเองบ้าง' },
        outcomes: [
          {
            weight: 1,
            text: { th: 'ถูกเองด้วย! เงินรางวัลเป็นเงินสะอาดล้วน ๆ ครั้งแรกในชีวิต' },
            effects: [{ kind: 'add', stat: 'cleanCash', value: 20_000 }],
          },
          {
            weight: 4,
            text: { th: 'ไม่ถูกสักตัว ป้ายรถขายลูกชิ้นหลอกคุณ' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: -2_000 }],
          },
        ],
      },
    ],
  },
  {
    id: 'viral_fake_review',
    category: 'lucky',
    weight: 5,
    when: { methods: ['fake_shop'] },
    title: { th: 'รีวิวปลอมของร้านดันไวรัล' },
    body: {
      th: 'รีวิว "หม้อทอดไร้อากาศ ทอดได้แม้กระทั่งความเศร้า" ที่คุณเขียนเองถูกแชร์หนึ่งแสนครั้ง ออเดอร์ไหลมาไม่หยุด',
    },
    choices: [
      {
        text: { th: 'รับออเดอร์ให้หมด' },
        outcomes: [
          {
            text: { th: 'กล่องเปล่าหมดสต็อก ต้องสั่งกล่องเปล่าเพิ่ม' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [10_000, 25_000] },
              { kind: 'add', stat: 'heat', value: 15 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปิดรับก่อนดังเกินตัว' },
        outcomes: [
          {
            text: { th: 'ขึ้นป้าย "สินค้าหมด เพราะดีเกินไป" ได้เงินพอประมาณ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: 5_000 },
              { kind: 'add', stat: 'heat', value: 3 },
            ],
          },
        ],
      },
    ],
  },
];
