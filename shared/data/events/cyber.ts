import type { GameEvent } from '../../src/types/content';

// ตำรวจไซเบอร์ปลอมตัว / ล่อซื้อ / เหยื่อหลอกกลับ / ทางกลับใจ — มุกล้วนๆ ไม่ใช่วิธีหลบหรือสอนโกง
export const cyberEvents: GameEvent[] = [
  {
    id: 'cyber_sting_order',
    category: 'unlucky',
    weight: 6,
    when: { methods: ['fake_shop'], heat: [35, 100] },
    title: { th: 'ลูกค้าสั่งหม้อทอด 300 ใบ' },
    body: {
      th: 'ลูกค้าชื่อ “คุณสมชาย ใจดีมาก” สั่งหม้อทอดไร้น้ำมัน 300 ใบ โอนครบทันที แล้วขอที่อยู่โกดังจริงเพื่อ “แวะไปรับเอง พร้อมเพื่อน ๆ อีกยี่สิบคน”',
    },
    choices: [
      {
        text: { th: 'รับเงิน ส่งที่อยู่โกดังไปเลย' },
        outcomes: [
          {
            text: { th: 'เงินเข้า! แต่เพื่อนยี่สิบคนของคุณสมชายใส่เสื้อกั๊กเหมือนกันหมด' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [8_000, 15_000] },
              { kind: 'schedule', eventId: 'cyber_sting_raid', inDays: 1 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปฏิเสธ บอกว่าของหมดถาวร' },
        outcomes: [
          {
            text: { th: 'คุณสมชายส่งสติกเกอร์ร้องไห้มา 40 ตัว แล้วออฟไลน์ไปเงียบ ๆ' },
            effects: [{ kind: 'add', stat: 'heat', value: -3 }],
          },
        ],
      },
      {
        text: { th: '[ช่างซ่อมมือถือ] เช็กก่อนว่าเครื่องลูกค้าเป็นของใคร' },
        requires: { characters: ['phone_tech'] },
        outcomes: [
          {
            text: { th: 'เครื่องของคุณสมชายมีแอปชื่อ “ทะเบียนผู้ต้องสงสัย” คุณปิดร้านทันที' },
            effects: [
              { kind: 'add', stat: 'heat', value: -10 },
              { kind: 'add', stat: 'karma', value: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cyber_sting_raid',
    category: 'unlucky',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'คุณสมชายมารับของแล้ว' },
    body: {
      th: 'หน้าโกดังมีรถตู้จอดเรียงห้าคัน คุณสมชายโบกมือทักพร้อมหมายค้น โกดังข้างในมีแต่กล่องเปล่า กับแมวที่คุณเลี้ยงไว้ไล่หนู',
    },
    choices: [
      {
        text: { th: 'แกล้งเป็นพนักงานรับจ้างแพ็กของ' },
        outcomes: [
          {
            weight: 2,
            text: { th: 'ตำรวจเชื่อครึ่งเดียว แต่ยึดกล่องเปล่าไปทั้งหมด' },
            effects: [{ kind: 'add', stat: 'heat', value: 20 }],
          },
          {
            text: { th: 'แมวเดินมาคลอเคลียขาคุณ ตำรวจรู้ทันทีว่าใครเจ้าของ' },
            effects: [{ kind: 'add', stat: 'heat', value: 35 }],
          },
        ],
      },
      {
        text: { th: 'หนีออกประตูหลังพร้อมแมว' },
        outcomes: [
          {
            text: { th: 'หนีพ้น แต่ต้องปิดร้านออนไลน์ไปหลายวัน' },
            effects: [
              { kind: 'add', stat: 'heat', value: 10 },
              { kind: 'cooldown', methodId: 'fake_shop', days: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cyber_deal',
    category: 'karma',
    weight: 5,
    when: { heat: [65, 100], day: [6, 28], flagsNone: ['informant'] },
    title: { th: 'ชายใส่เสื้อลายดอกขอนั่งด้วย' },
    body: {
      th: 'ที่ร้านข้าวมันไก่ ชายแปลกหน้ากระซิบว่า “ผมตำรวจไซเบอร์ เราไม่ได้อยากได้ตัวคุณ เราอยากได้แก๊งต่างประเทศที่ใหญ่กว่า ช่วยเราไหม”',
    },
    choices: [
      {
        text: { th: 'ตกลง เป็นพยานช่วยจับแก๊งใหญ่' },
        outcomes: [
          {
            text: { th: 'ตำรวจตั้งชื่อรหัสให้ว่า “ข้าวมันไก่” เรื่องของคุณเขาจะพักไว้ก่อน แต่เงินสกปรกครึ่งหนึ่งต้องคืนเหยื่อ' },
            effects: [
              { kind: 'flag', flag: 'informant' },
              { kind: 'add', stat: 'heat', value: -40 },
              { kind: 'add', stat: 'karma', value: 12 },
              { kind: 'mul', stat: 'dirtyCash', value: 0.5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปฏิเสธ แล้วแย่งจ่ายค่าข้าวให้เขา' },
        outcomes: [
          {
            text: { th: 'เขายิ้ม รับข้าวไป แล้วจดเลขทะเบียนรถคุณ' },
            effects: [{ kind: 'add', stat: 'heat', value: 10 }],
          },
        ],
      },
    ],
  },
  {
    id: 'cyber_informant_mission',
    category: 'karma',
    weight: 6,
    when: { flagsAll: ['informant'], day: [8, 30] },
    title: { th: 'ภารกิจของ “ข้าวมันไก่”' },
    body: {
      th: 'ตำรวจขอให้คุณแกล้งสมัครงานกับแก๊งต่างประเทศ เพื่อหาว่าหัวหน้าเป็นใคร หัวหน้าตัวจริงคือชายที่ใส่รองเท้าแตะทองคำ',
    },
    choices: [
      {
        text: { th: 'ทำตามแผน ช่วยให้จับได้ทั้งแก๊ง' },
        outcomes: [
          {
            text: { th: 'จับได้ยกแก๊ง เหยื่อหลายร้อยคนได้เงินคืน ตำรวจให้คุณถือป้าย (ไม่มีชื่อ) ถ่ายรูปด้วย' },
            effects: [
              { kind: 'flag', flag: 'gang_busted' },
              { kind: 'add', stat: 'karma', value: 15 },
              { kind: 'add', stat: 'heat', value: -20 },
            ],
          },
        ],
      },
      {
        text: { th: 'แอบเตือนแก๊งต่างประเทศ ขอส่วนแบ่ง' },
        outcomes: [
          {
            text: { th: 'แก๊งให้เงินคุณจริง เป็นเงินปลอมทั้งปึก ตำรวจก็รู้ทัน' },
            effects: [
              { kind: 'flag', flag: 'informant', remove: true },
              { kind: 'add', stat: 'heat', value: 40 },
              { kind: 'add', stat: 'karma', value: -15 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'romance_reverse',
    category: 'unlucky',
    weight: 5,
    when: { methods: ['romance'], usedMethods: ['romance'], day: [3, 30] },
    title: { th: 'เหยื่อหลอกรักหลอกกลับ' },
    body: {
      th: '“ที่รัก” ที่คุณแชตด้วยมาหนึ่งสัปดาห์ บอกว่ามีหุ้นปลาทองบินได้ รับประกันกำไร 300% ต่อวัน ขอแค่โอนค่าสมัครก่อน',
    },
    choices: [
      {
        text: { th: 'โอนไปลองดู เผื่อรวยจริง' },
        outcomes: [
          {
            text: { th: 'ที่รักหายไปพร้อมเงิน ทิ้งไว้แค่สติกเกอร์หัวใจแตก' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -6_000 },
              { kind: 'flag', flag: 'met_baiter' },
              { kind: 'romanceBond', value: -10 },
            ],
          },
        ],
      },
      {
        text: { th: 'ส่งมุกเดิมของตัวเองกลับไปบ้าง' },
        outcomes: [
          {
            text: { th: 'มิจฉาชีพสองคนแชตหลอกกันวนไปสามชั่วโมง สุดท้ายตกลงเปิดคอร์สสอนด้วยกัน (แต่ไม่มีใครโอน)' },
            effects: [
              { kind: 'add', stat: 'fame', value: 6 },
              { kind: 'romanceBond', value: -10 },
            ],
          },
        ],
      },
      {
        text: { th: 'ส่งลิงก์แจ้งความออนไลน์ให้เขาดู' },
        outcomes: [
          {
            text: { th: 'อีกฝ่ายบล็อกทันที คุณรู้สึกแปลก ๆ ที่ทำเรื่องถูกต้องครั้งแรก' },
            effects: [
              { kind: 'add', stat: 'karma', value: 5 },
              { kind: 'flag', flag: 'met_baiter' },
              { kind: 'romanceBond', value: -10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'baiter_stream',
    category: 'silly',
    weight: 4,
    when: { flagsAll: ['met_baiter'], day: [4, 30] },
    title: { th: 'คลิปคุณติดเทรนด์' },
    body: {
      th: 'ยูทูบเบอร์สายแกล้งมิจฉาชีพเอาเสียงคุณไปทำคลิป “มิจฉาชีพร้องไห้กลางสาย” ยอดวิวสามล้าน คอมเมนต์อันดับหนึ่งคือ “เสียงคุ้น ๆ เหมือนลุงข้างบ้าน”',
    },
    choices: [
      {
        text: { th: 'คอมเมนต์ขอโทษใต้คลิปแบบไม่ระบุตัว' },
        outcomes: [
          {
            text: { th: 'มีคนตอบว่า “ถ้าเสียใจจริงก็เลิกซะ” คุณคิดเรื่องนี้ทั้งคืน' },
            effects: [
              { kind: 'add', stat: 'karma', value: 6 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ติดต่อขอร่วมงานกับยูทูบเบอร์คนนั้น' },
        outcomes: [
          {
            text: { th: 'เขาตอบว่า “ถ้าวันไหนกลับใจ มาเป็นแขกรับเชิญได้” แล้วส่งอีโมจิกุญแจมือมา' },
            effects: [
              { kind: 'flag', flag: 'baiter_contact' },
              { kind: 'add', stat: 'karma', value: 3 },
            ],
          },
        ],
      },
      {
        text: { th: 'เปลี่ยนเสียงด้วยแอปแปลงเสียงเป็นการ์ตูน' },
        outcomes: [
          {
            text: { th: 'ตอนนี้ทุกสายของคุณเป็นเสียงชิปมังก์ เหยื่อหัวเราะจนลืมโอน' },
            effects: [{ kind: 'add', stat: 'fame', value: 4 }],
          },
        ],
      },
    ],
  },
];
