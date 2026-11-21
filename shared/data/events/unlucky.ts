import type { GameEvent } from '../../src/types/content';

// ดวงซวย
export const unluckyEvents: GameEvent[] = [
  {
    id: 'social_detective',
    category: 'unlucky',
    weight: 6,
    when: { heat: [30, 100] },
    title: { th: 'นักสืบโซเชียลเริ่มขุด' },
    body: {
      th: 'เพจ "ขุดไม่หยุด สืบไม่พัก" โพสต์รูปเงาหัวคุณในกระจกรถ พร้อมแคปชัน "ใครรู้จักหัวทรงนี้บ้าง"',
    },
    choices: [
      {
        text: { th: 'ตัดผมทรงใหม่แล้วเปลี่ยนชื่อเพจหนี' },
        outcomes: [
          {
            text: { th: 'ช่างตัดผมพลาด ทรงใหม่ยิ่งเด่นกว่าเดิม แต่อย่างน้อยไม่ใช่ทรงเดิม' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -3_000 },
              { kind: 'add', stat: 'heat', value: -10 },
            ],
          },
        ],
      },
      {
        text: { th: 'ไลฟ์แก้ข่าวทั้งน้ำตา' },
        outcomes: [
          {
            text: { th: 'ร้องไห้ได้สมจริง ชาวเน็ตครึ่งหนึ่งสงสาร' },
            effects: [
              { kind: 'add', stat: 'heat', value: -15 },
              { kind: 'add', stat: 'fame', value: 5 },
            ],
          },
          {
            text: { th: 'ร้องไม่ออก แอบหยอดน้ำตาเทียมแล้วโดนซูมเห็นขวด' },
            effects: [
              { kind: 'add', stat: 'heat', value: 20 },
              { kind: 'add', stat: 'fame', value: -10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'henchman_snitch',
    category: 'unlucky',
    weight: 5,
    when: { needsHenchman: true, heat: [20, 100] },
    title: { th: 'ลูกน้องจะซัดทอด' },
    body: {
      th: 'ลูกน้องโดนเรียกไปถามเรื่องอื่น แต่ดันเผลอเล่าเรื่องคุณให้ตำรวจฟังเป็นตอนๆ เหมือนละครหลังข่าว',
    },
    choices: [
      {
        text: { th: 'ขึ้นค่าแรงปิดปาก' },
        outcomes: [
          {
            text: { th: 'ลูกน้องเปลี่ยนเรื่องเล่าเป็นละครพีเรียดแทน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -5_000 },
              { kind: 'loyalty', value: 20 },
            ],
          },
        ],
      },
      {
        text: { th: 'ไล่ออกทันที' },
        outcomes: [
          {
            text: { th: 'ลูกน้องเดินออกไปพร้อมเล่าตอนจบให้ตำรวจฟัง' },
            effects: [{ kind: 'loseHenchman' }, { kind: 'add', stat: 'heat', value: 15 }],
          },
        ],
      },
    ],
  },
  {
    id: 'frozen_mule',
    category: 'unlucky',
    weight: 5,
    when: { minDirtyCash: 5_000 },
    title: { th: 'ธนาคารอายัดบัญชีม้า' },
    body: {
      th: 'ธนาคาร "ไทยใจถึงพึ่งได้" ส่ง SMS ว่าบัญชีที่ยืมชื่อลุงข้างบ้านมาใช้ถูกอายัด ลุงก็เพิ่งรู้ว่ามีบัญชีนี้',
    },
    choices: [
      {
        text: { th: 'ยอมรับชะตากรรม' },
        outcomes: [
          {
            text: { th: 'เงินในบัญชีนั้นหายไปเกือบครึ่ง' },
            effects: [{ kind: 'mul', stat: 'dirtyCash', value: 0.6 }],
          },
        ],
      },
      {
        text: { th: 'โทรไปตื๊อคอลเซ็นเตอร์ธนาคาร' },
        outcomes: [
          {
            weight: 3,
            text: { th: 'รอสาย 4 ชั่วโมง เพลงรอสายติดหูจนฝันถึง แถมระบบบันทึกเสียงคุณไว้' },
            effects: [
              { kind: 'mul', stat: 'dirtyCash', value: 0.5 },
              { kind: 'add', stat: 'heat', value: 10 },
            ],
          },
          {
            weight: 1,
            text: { th: 'พนักงานกดผิดปุ่ม ปลดอายัดให้ซะงั้น' },
            effects: [],
          },
        ],
      },
    ],
  },
  {
    id: 'cyber_cop_call',
    category: 'unlucky',
    weight: 7,
    when: { methods: ['call_center'] },
    title: { th: 'โทรไปเจอตำรวจไซเบอร์' },
    body: {
      th: 'ปลายสายตอบว่า "สวัสดีครับ กองปราบโกงออนไลน์ยินดีรับสาย" ลูกน้องในห้องเงียบกริบจนได้ยินเสียงแอร์',
    },
    choices: [
      {
        text: { th: 'แกล้งทำเป็นโทรผิด สั่งพิซซ่า' },
        outcomes: [
          {
            text: { th: 'ตำรวจถามว่าเอาหน้าอะไร คุณตอบไม่ทัน' },
            effects: [{ kind: 'add', stat: 'heat', value: 12 }],
          },
        ],
      },
      {
        text: { th: 'วางสายแล้วโยนซิมลงชักโครก' },
        outcomes: [
          {
            text: { th: 'ชักโครกตัน ต้องจ้างช่างประปามาเห็นซิมเต็มท่อ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -1_500 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ชวนตำรวจมาร่วมแก๊ง' },
        outcomes: [
          {
            weight: 9,
            text: { th: 'ตำรวจขอบคุณสำหรับคำสารภาพที่ชัดเจนมาก' },
            effects: [{ kind: 'add', stat: 'heat', value: 35 }],
          },
          {
            weight: 1,
            text: { th: 'ตำรวจคิดว่าคุณเล่นมุก หัวเราะแล้ววางสาย' },
            effects: [{ kind: 'add', stat: 'fame', value: 5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'customer_mob',
    category: 'unlucky',
    weight: 5,
    when: { methods: ['fake_shop'], heat: [15, 100] },
    title: { th: 'ลูกค้ารวมตัวตั้งกลุ่มผู้เสียหาย' },
    body: {
      th: 'กลุ่ม "ผู้เสียหายหม้อทอดไร้อากาศ" มีสมาชิก 800 คน และเริ่มนัดกันไปถ่ายรูปหน้าบ้านที่คุณใช้เป็นที่อยู่ร้าน (ซึ่งเป็นบ้านคนอื่น)',
    },
    choices: [
      {
        text: { th: 'คืนเงินบางส่วน ทำเป็นขอโทษ' },
        outcomes: [
          {
            text: { th: 'ลูกค้าบางคนให้อภัย บางคนขอคืนกล่องเปล่าด้วย' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [-6_000, -3_000] },
              { kind: 'add', stat: 'heat', value: -10 },
              { kind: 'add', stat: 'karma', value: 2 },
            ],
          },
        ],
      },
      {
        text: { th: 'บล็อกทุกคน' },
        outcomes: [
          {
            text: { th: 'บล็อกไป 800 คน คนที่ 801 คือนักข่าว' },
            effects: [{ kind: 'add', stat: 'heat', value: 12 }],
          },
        ],
      },
    ],
  },
];
