import type { GameEvent } from '../../src/types/content';

// เหตุการณ์ล้อข่าวและชีวิตประจำวัน (ชื่อทั้งหมดแต่งขึ้น)
export const newsEvents: GameEvent[] = [
  {
    id: 'deepfake_cat',
    category: 'unlucky',
    weight: 5,
    when: { heat: [20, 100], day: [3, 30] },
    title: { th: 'คลิปดีปเฟกหน้าคุณหลุด' },
    body: { th: 'มีคนใช้ AI ทำคลิปหน้าคุณสารภาพความผิด แต่ AI ทำออกมาหน้าเหมือนแมวส้มใส่แว่น' },
    choices: [
      {
        text: { th: 'แถลงว่าไม่ใช่ตัวเอง' },
        outcomes: [
          {
            text: { th: 'คนส่วนใหญ่เชื่อ เพราะคุณไม่มีหนวดแมว' },
            effects: [{ kind: 'add', stat: 'heat', value: -5 }],
          },
        ],
      },
      {
        text: { th: 'ยอมรับว่าเป็นแมวจริง' },
        outcomes: [
          {
            text: { th: 'กลายเป็นมีมประจำสัปดาห์ ชื่อเสียงพุ่ง ตำรวจงง' },
            effects: [{ kind: 'add', stat: 'fame', value: 15 }],
          },
        ],
      },
    ],
  },
  {
    id: 'fake_slip_victim',
    category: 'silly',
    weight: 5,
    when: { methods: ['fake_shop'] },
    title: { th: 'เหยื่อส่งสลิปปลอมมาหลอกคุณ' },
    body: { th: 'ลูกค้าที่สั่งหม้อทอดไร้อากาศส่งสลิปมา ตัวเลขยอดโอนเป็นรูปดอกไม้ ชื่อผู้รับคือ "บัญชีของคุณแน่นอน"' },
    choices: [
      {
        text: { th: 'ส่งกล่องเปล่าให้ตามปกติ' },
        outcomes: [
          {
            text: { th: 'โกงกันไปมา ไม่มีใครได้อะไร จักรวาลสมดุลชั่วคราว' },
            effects: [],
          },
        ],
      },
      {
        text: { th: 'ชมฝีมือ แล้วจ้างทำโลโก้เพจ' },
        outcomes: [
          {
            text: { th: 'ได้โลโก้ใหม่สวยมาก เพจดูน่าเชื่อถือขึ้นอีกระดับ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -800 },
              { kind: 'add', stat: 'fame', value: 6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'whitening_cream_drama',
    category: 'lucky',
    weight: 5,
    when: { day: [2, 30] },
    title: { th: 'ดาราไลฟ์ขายครีม "ขาวใน 7 วิ"' },
    body: {
      th: 'ดาราสาว "น้องเพชรเม็ดงาม" ไลฟ์ขายครีมที่อ้างว่าขาวใน 7 วินาที ทั้งประเทศถกกันว่า 7 วินาทีนับจากตอนไหน',
    },
    choices: [
      {
        text: { th: 'หลบเงียบตอนคนกำลังดูดราม่า' },
        outcomes: [
          {
            text: { th: 'ไม่มีใครสนใจคุณเลยทั้งวัน' },
            effects: [{ kind: 'add', stat: 'heat', value: -15 }],
          },
        ],
      },
      {
        text: { th: 'ทำคลิปแซะดารา' },
        outcomes: [
          {
            text: { th: 'คลิปแซะดังพอสมควร คนจำชื่อเพจคุณได้มากขึ้น' },
            effects: [
              { kind: 'add', stat: 'fame', value: 12 },
              { kind: 'add', stat: 'heat', value: -5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mindset_camp',
    category: 'lucky',
    weight: 4,
    when: { minLevel: 2, minFame: 10 },
    title: { th: 'ค่าย "รวยด้วยพลังความคิด" ชวนเป็นวิทยากร' },
    body: {
      th: 'ค่ายอบรมที่ให้ผู้เข้าร่วมตะโกน "ฉันรวยแล้ว" วันละ 500 ครั้ง อยากให้คุณขึ้นพูดในฐานะ "ผู้ประสบความสำเร็จ"',
    },
    choices: [
      {
        text: { th: 'รับค่าตัวแล้วขึ้นพูด' },
        outcomes: [
          {
            text: { th: 'คุณพูดเรื่อง "ความมั่นใจ" 2 ชั่วโมงโดยไม่มีเนื้อหาสักประโยค และได้รับเสียงปรบมือ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: 15_000 },
              { kind: 'add', stat: 'fame', value: 10 },
              { kind: 'add', stat: 'karma', value: -3 },
            ],
          },
        ],
      },
      {
        text: { th: 'ขึ้นเวทีแล้วพูดความจริงว่าไม่มีทางรวยลัด' },
        outcomes: [
          {
            text: { th: 'ไมค์ถูกตัดกลางคัน แต่ผู้ฟังสามคนเดินออกไปพร้อมรอยยิ้ม' },
            effects: [
              { kind: 'add', stat: 'karma', value: 10 },
              { kind: 'add', stat: 'heat', value: 8 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'runaway_rooster',
    category: 'silly',
    weight: 5,
    when: {},
    title: { th: 'ไก่ชนของลุงข้างบ้านหนีมาที่ห้อง' },
    body: {
      th: 'ไก่ตัวใหญ่บินเข้ามาทางหน้าต่าง เหยียบโทรศัพท์โทรออกไปหาเหยื่อเองสามสาย และพูดได้ดีกว่าลูกน้องบางคน',
    },
    choices: [
      {
        text: { th: 'ช่วยลุงจับไก่คืน' },
        outcomes: [
          {
            text: { th: 'ลุงขอบใจ ให้ไข่ไก่มาหนึ่งแผง' },
            effects: [{ kind: 'add', stat: 'karma', value: 3 }],
          },
        ],
      },
      {
        text: { th: 'รับไก่เข้าแก๊ง' },
        outcomes: [
          {
            text: { th: 'ไก่ได้ตำแหน่ง "หัวหน้าฝ่ายปลุก" ทั้งแก๊งตื่นตีสี่ทุกวัน' },
            effects: [
              { kind: 'flag', flag: 'rooster_member' },
              { kind: 'add', stat: 'fame', value: 3 },
              { kind: 'modifier', target: 'income', pct: 10, days: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'victim_relative',
    category: 'karma',
    weight: 5,
    when: { day: [8, 30] },
    title: { th: 'เหยื่อรายใหม่คือหลานของคนที่เคยช่วยคุณ' },
    body: { th: 'ระหว่างหลอกเหยื่อรายใหม่ คุณเห็นรูปโปรไฟล์ เป็นหลานของป้าร้านข้าวที่เคยให้ข้าวคุณกินฟรีสมัยตกงาน' },
    choices: [
      {
        text: { th: 'หลอกต่อ งานคืองาน' },
        outcomes: [
          {
            text: { th: 'ได้เงิน และได้ความรู้สึกบางอย่างที่ไม่อยากได้' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [6_000, 10_000] },
              { kind: 'add', stat: 'karma', value: -12 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปล่อยไป ทำเป็นสายหลุด' },
        outcomes: [
          {
            text: { th: 'คุณวางสาย แล้วไปสั่งข้าวร้านป้าเป็นการขอบคุณ' },
            effects: [{ kind: 'add', stat: 'karma', value: 7 }],
          },
        ],
      },
      {
        text: { th: 'เตือนเขาว่ามีมิจฉาชีพโทรหา' },
        outcomes: [
          {
            text: { th: 'เขาขอบคุณ และไปเตือนคนทั้งครอบครัวต่อ' },
            effects: [
              { kind: 'add', stat: 'karma', value: 12 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'landlord_raise',
    category: 'unlucky',
    weight: 5,
    when: { minDirtyCash: 10_000 },
    title: { th: 'เจ้าของห้องเช่าขึ้นค่าเช่า' },
    body: { th: 'เจ้าของห้องเช่าเห็นคุณสั่งอาหารเดลิเวอรีวันละ 9 รอบ เลยขึ้นค่าเช่า "ตามสภาพเศรษฐกิจของผู้เช่า"' },
    choices: [
      {
        text: { th: 'จ่ายเงียบ ๆ' },
        outcomes: [
          {
            text: { th: 'เจ้าของห้องยิ้ม และเริ่มสงสัยว่าคุณทำงานอะไร' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -3_000 },
              { kind: 'add', stat: 'heat', value: 3 },
            ],
          },
        ],
      },
      {
        text: { th: 'ย้ายห้องหนี' },
        outcomes: [
          {
            text: { th: 'ย้ายไปห้องใหม่ที่ไม่มีใครรู้จัก (ยกเว้นไรเดอร์ทั้ง 9 เจ้า)' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -5_000 },
              { kind: 'add', stat: 'heat', value: -10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rival_gang',
    category: 'unlucky',
    weight: 5,
    when: { minLevel: 2 },
    title: { th: 'แก๊งคู่แข่ง "สามแสบไซเบอร์" แย่งเหยื่อ' },
    body: { th: 'แก๊งคู่แข่งใช้มุกเดียวกับคุณทุกคำ แต่ตัดราคาครึ่งหนึ่ง เหยื่อเริ่มงงว่าใครหลอกใคร' },
    choices: [
      {
        text: { th: 'ตัดราคาสู้' },
        outcomes: [
          {
            text: { th: 'สงครามราคาเริ่มขึ้น ไม่มีใครชนะนอกจากเหยื่อ (ซึ่งก็ไม่ได้ชนะ)' },
            effects: [{ kind: 'modifier', target: 'income', pct: -20, days: 3 }],
          },
        ],
      },
      {
        text: { th: 'ท้าแข่งร้องคาราโอเกะ ใครแพ้ย้ายถิ่น' },
        outcomes: [
          {
            text: { th: 'คุณร้องเพลงลูกทุ่งได้ 98 คะแนน แก๊งคู่แข่งยอมย้ายไปอีกอำเภอ' },
            effects: [
              { kind: 'add', stat: 'fame', value: 10 },
              { kind: 'modifier', target: 'income', pct: 15, days: 3 },
            ],
          },
          {
            text: { th: 'คุณได้ 41 คะแนน เครื่องคาราโอเกะยังตำหนิว่า "ควรฝึกเพิ่ม"' },
            effects: [{ kind: 'modifier', target: 'income', pct: -30, days: 3 }],
          },
        ],
      },
      {
        text: { th: 'แจ้งเบาะแสแก๊งคู่แข่งให้ตำรวจ' },
        outcomes: [
          {
            text: { th: 'แก๊งคู่แข่งโดนจับ ตำรวจขอบคุณ และถามต่อว่าคุณรู้ได้ยังไง' },
            effects: [
              { kind: 'add', stat: 'heat', value: 12 },
              { kind: 'add', stat: 'karma', value: 6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'teen_hacker',
    category: 'lucky',
    weight: 4,
    when: { minLevel: 2 },
    title: { th: 'เด็ก ม.5 แฮกเพจคุณ แล้วขอสมัครงาน' },
    body: { th: 'เด็กมัธยมเจาะเพจคุณได้ในห้านาที แล้วส่งข้อความมาว่า "พี่ครับ รับเด็กฝึกงานไหม"' },
    choices: [
      {
        text: { th: 'รับเข้าแก๊ง' },
        outcomes: [
          {
            text: { th: 'ได้ลูกน้องเก่งเทคโนโลยี แต่ต้องรอเลิกเรียนทุกวัน' },
            effects: [
              { kind: 'gainHenchman', loyalty: 60 },
              { kind: 'add', stat: 'karma', value: -6 },
            ],
          },
        ],
      },
      {
        text: { th: 'ส่งกลับไปตั้งใจเรียน' },
        outcomes: [
          {
            text: { th: 'คุณแนะนำให้ไปแข่งโอลิมปิกคอมพิวเตอร์ เด็กตอบ "โอเคครับพี่"' },
            effects: [{ kind: 'add', stat: 'karma', value: 10 }],
          },
        ],
      },
    ],
  },
  {
    id: 'loan_app_spam',
    category: 'silly',
    weight: 4,
    when: { day: [2, 30] },
    title: { th: 'แอปกู้เงินปลอมส่ง SMS มาหาคุณ' },
    body: { th: 'SMS แจ้งว่า "คุณได้รับอนุมัติเงินกู้ 5 แสน โอนค่าธรรมเนียม 999 ก่อน" มิจฉาชีพมาหลอกมิจฉาชีพ' },
    choices: [
      {
        text: { th: 'ตอบกลับด้วยมุกพัสดุจระเข้' },
        outcomes: [
          {
            text: { th: 'ปลายทางเงียบไปสามวัน แล้วส่งสติกเกอร์ยกมือไหว้มา' },
            effects: [{ kind: 'add', stat: 'fame', value: 3 }],
          },
        ],
      },
      {
        text: { th: 'ส่งเบอร์ให้ตำรวจไซเบอร์' },
        outcomes: [
          {
            text: { th: 'ตำรวจรับเรื่องและขอบคุณ ทั้งที่คุณก็อยู่ในลิสต์ถัดไป' },
            effects: [
              { kind: 'add', stat: 'karma', value: 4 },
              { kind: 'add', stat: 'heat', value: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tour_zero_baht',
    category: 'lucky',
    weight: 4,
    when: { minLevel: 2, minDirtyCash: 20_000 },
    title: { th: 'ทัวร์ศูนย์เหรียญชวนร่วมทุน' },
    body: { th: 'บริษัททัวร์ "เที่ยวฟรีจ่ายทีหลัง" ชวนร่วมทุน พานักท่องเที่ยวไปร้านขายหมอนยางพาราวันละ 11 ร้าน' },
    choices: [
      {
        text: { th: 'ร่วมทุน' },
        outcomes: [
          {
            weight: 2,
            text: { th: 'หมอนขายดีเกินคาด ได้ส่วนแบ่งก้อนโต' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: [10_000, 25_000] }],
          },
          {
            weight: 1,
            text: { th: 'บริษัททัวร์หายไปพร้อมหมอนและเงินคุณ' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: -15_000 }],
          },
        ],
      },
      {
        text: { th: 'ไม่ร่วม หมอนเยอะเกินไป' },
        outcomes: [
          {
            text: { th: 'คุณนอนหลับสบายบนหมอนธรรมดา' },
            effects: [{ kind: 'add', stat: 'heat', value: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'scam_center_rescue',
    category: 'karma',
    weight: 4,
    when: { flagsAll: ['went_abroad'] },
    title: { th: 'เพื่อนร่วมงานที่ติดอยู่ต่างประเทศขอความช่วยเหลือ' },
    body: { th: 'เพื่อนที่คุณเจอตอนโดนหลอกไปทำงานต่างประเทศส่งข้อความมาว่ายังติดอยู่ ขอให้ช่วยติดต่อเจ้าหน้าที่' },
    choices: [
      {
        text: { th: 'ติดต่อสถานทูตและเจ้าหน้าที่ให้' },
        outcomes: [
          {
            text: { th: 'เพื่อนได้กลับบ้านในสองสัปดาห์ แม่ของเขาโทรมาขอบคุณทั้งน้ำตา' },
            effects: [
              { kind: 'add', stat: 'karma', value: 20 },
              { kind: 'add', stat: 'heat', value: 10 },
            ],
          },
        ],
      },
      {
        text: { th: 'ทำเป็นไม่ได้อ่าน' },
        outcomes: [
          {
            text: { th: 'ข้อความขึ้นว่า "อ่านแล้ว" ซึ่งคุณไม่ได้ตั้งใจ' },
            effects: [{ kind: 'add', stat: 'karma', value: -10 }],
          },
        ],
      },
    ],
  },
];
