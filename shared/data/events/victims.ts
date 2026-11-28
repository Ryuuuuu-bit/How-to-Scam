import type { GameEvent } from '../../src/types/content';

// เหยื่อกลับมาหา (กติกา 1.2): นัดจาก engine/comeback.ts หลังหลอกสำเร็จ 2–5 วัน
// ทุกเรื่องเป็นมุกที่แต่งขึ้น และสอนสัญญาณอันตรายจริงไปด้วย
export const victimEvents: GameEvent[] = [
  {
    id: 'victim_report',
    category: 'karma',
    weight: 0,
    once: false,
    chainOnly: true,
    when: {},
    title: { th: 'เหยื่อเดินเข้าโรงพัก' },
    body: {
      th: 'คนที่โดนคุณหลอกเมื่อหลายวันก่อนไม่ได้เงียบ เขาพรินต์แชตทั้งหมดใส่แฟ้มสีฟ้า เดินเข้าโรงพักพร้อมสลิปโอนเงิน และถามร้อยเวรว่า "แจ้งความออนไลน์ได้ไหมคะ หรือต้องรอเป็นข่าวก่อน"',
    },
    choices: [
      {
        text: { th: 'โอนคืนครึ่งหนึ่ง ขอให้ถอนแจ้งความ' },
        outcomes: [
          {
            text: { th: 'เขารับเงินคืนแล้วถอนเรื่อง แต่ยังเก็บแฟ้มสีฟ้าไว้ในลิ้นชัก "เผื่อไว้"' },
            effects: [
              { kind: 'refund', pct: 50 },
              { kind: 'add', stat: 'karma', value: 3 },
              { kind: 'add', stat: 'heat', value: -4 },
            ],
          },
        ],
      },
      {
        text: { th: 'เงียบ ทำเป็นไม่รู้เรื่อง' },
        outcomes: [
          {
            weight: 3,
            text: { th: 'บันทึกแจ้งความของเขาไปวางบนโต๊ะสารวัตร พร้อมเลขบัญชีที่คุณใช้รับเงิน' },
            effects: [
              { kind: 'evidence', evidence: 'victim', weight: 2 },
              { kind: 'add', stat: 'heat', value: 6 },
            ],
          },
          {
            weight: 1,
            text: { th: 'ร้อยเวรรับเรื่องแล้ววางไว้ใต้กองเอกสาร คุณรอดไปอีกวัน แต่เลขคดีมีชื่อคุณแล้ว' },
            effects: [{ kind: 'add', stat: 'heat', value: 3 }],
          },
        ],
      },
      {
        text: { th: 'ปิดบัญชีม้า ย้ายเงินหนีทันที' },
        outcomes: [
          {
            text: { th: 'บัญชีปิดทัน แต่ค่าเปิดบัญชีใหม่กับค่าคนกลางกินเงินไปก้อนหนึ่ง' },
            effects: [
              { kind: 'refund', pct: 30 },
              { kind: 'add', stat: 'heat', value: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'victim_warning',
    category: 'unlucky',
    weight: 0,
    once: false,
    chainOnly: true,
    when: {},
    title: { th: 'กลุ่มเตือนภัยติดดาวคุณ' },
    body: {
      th: 'เหยื่อรายเดิมตั้งกลุ่ม "เตือนภัยร้านนี้ รู้ทันก่อนโอน" สมาชิกขึ้นสามพันคนในคืนเดียว มีแคปจอแชตคุณปักหมุดไว้บนสุด พร้อมคำอธิบายว่า "สังเกตไหม ราคาถูกผิดปกติ เร่งให้โอน ไม่ยอมนัดรับของ"',
    },
    choices: [
      {
        text: { th: 'ปิดเพจ เปลี่ยนชื่อใหม่ (฿1,200)' },
        outcomes: [
          {
            text: { th: 'เพจใหม่ชื่อสุภาพกว่าเดิม แต่ลูกค้าเก่าบางคนจำโลโก้ได้อยู่ดี' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -1_200 },
              { kind: 'jobModifier', pct: -10, days: 2 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปล่อยไว้ เดี๋ยวคนก็ลืม' },
        outcomes: [
          {
            text: { th: 'คนไม่ลืม กลุ่มขึ้นแท็กชื่องานคุณทุกโพสต์ ลูกค้าหายไปเกินครึ่ง' },
            effects: [{ kind: 'jobModifier', pct: -40, days: 5 }],
          },
        ],
      },
      {
        text: { th: 'สมัครเข้ากลุ่มแล้วโพสต์แก้ต่าง' },
        outcomes: [
          {
            weight: 1,
            text: { th: 'คุณแก้ต่างเนียนจนแอดมินขอโทษ กลุ่มเงียบไปเอง' },
            effects: [
              { kind: 'add', stat: 'fame', value: 2 },
              { kind: 'add', stat: 'karma', value: -2 },
            ],
          },
          {
            weight: 2,
            text: { th: 'คุณลืมเปลี่ยนบัญชีก่อนโพสต์ ชื่อจริงขึ้นหน้าแรกของกลุ่ม' },
            effects: [
              { kind: 'evidence', evidence: 'exposed', weight: 1 },
              { kind: 'jobModifier', pct: -40, days: 5 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'victim_hunter',
    category: 'silly',
    weight: 0,
    once: false,
    chainOnly: true,
    when: {},
    title: { th: 'นักล่าสแกมเมอร์ทักมา' },
    body: {
      th: 'เบอร์แปลกโทรมา "ติดต่อจากศูนย์ตรวจสอบธุรกรรมค่ะ บัญชีของคุณพัวพันการฟอกเงิน ต้องโอนเงินทั้งหมดไปบัญชีปลอดภัยภายในสามสิบนาที ห้ามวางสาย ห้ามบอกใคร" น้ำเสียงคุ้นหูเหมือนเหยื่อเก่าของคุณเอง',
    },
    choices: [
      {
        text: { th: 'รีบโอนไปบัญชีปลอดภัยตามที่บอก' },
        outcomes: [
          {
            text: {
              th: 'บัญชีปลอดภัยปลอดภัยมาก สำหรับเขา เหยื่อเก่าไลฟ์ขอบคุณ "ทุนการศึกษา" จากคุณ คนดูหัวเราะทั้งไลฟ์',
            },
            effects: [
              { kind: 'mul', stat: 'dirtyCash', value: 0.7 },
              { kind: 'add', stat: 'fame', value: 3 },
              { kind: 'flag', flag: 'met_baiter' },
            ],
          },
        ],
      },
      {
        text: { th: 'วางสาย แล้วโทรเช็กเบอร์ธนาคารเอง' },
        outcomes: [
          {
            text: {
              th: 'ธนาคารยืนยันว่าไม่มีบัญชีปลอดภัยแบบนั้น คุณจำได้ว่าสัญญาณครบทุกข้อ: เร่งเวลา ห้ามวางสาย ห้ามบอกใคร ให้โอนเงิน',
            },
            effects: [
              { kind: 'add', stat: 'karma', value: 1 },
              { kind: 'flag', flag: 'sharp_ears' },
            ],
          },
        ],
      },
      {
        text: { th: 'หลอกกลับ ไลฟ์ด่าสด' },
        outcomes: [
          {
            weight: 1,
            text: { th: 'ไลฟ์ปังกว่างานไหนที่เคยทำ คนดูไม่รู้ว่าใครโกงใครก่อน แต่กดหัวใจให้รัวๆ' },
            effects: [
              { kind: 'add', stat: 'fame', value: 6 },
              { kind: 'add', stat: 'heat', value: 6 },
            ],
          },
          {
            weight: 1,
            text: { th: 'เขาตัดต่อคลิปตอนคุณหลุดปากเล่าวิธีหลอกคนอื่น แล้วส่งให้สารวัตรเป็นของขวัญ' },
            effects: [
              { kind: 'evidence', evidence: 'witness', weight: 1 },
              { kind: 'add', stat: 'fame', value: 3 },
              { kind: 'add', stat: 'heat', value: 8 },
            ],
          },
        ],
      },
    ],
  },
];
