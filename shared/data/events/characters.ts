import type { GameEvent } from '../../src/types/content';

// เหตุการณ์เฉพาะอาชีพ — เล่นคนละอาชีพเจอเรื่องไม่เหมือนกัน
export const characterEvents: GameEvent[] = [
  {
    id: 'gamer_sleep',
    category: 'silly',
    weight: 9,
    once: false,
    when: { characters: ['gamer_kid'], minWorkStreak: 5 },
    title: { th: 'หลับคาคีย์บอร์ด' },
    body: {
      th: 'ทำงานติดกันมาหลายวัน ตื่นมาอีกทีหน้าผากมีรอยปุ่ม WASD และเพิ่งรู้ว่าพิมพ์ "ฟฟฟฟฟ" ส่งให้เหยื่อไป 400 ข้อความ',
    },
    choices: [
      {
        text: { th: 'นอนต่อให้เต็มอิ่ม' },
        outcomes: [
          {
            text: { th: 'หลับยาว 14 ชั่วโมง ตื่นมาสดชื่น ตำรวจก็ลืมคุณไปบ้าง' },
            effects: [
              { kind: 'add', stat: 'heat', value: -10 },
              { kind: 'modifier', target: 'income', pct: -30, days: 1 },
            ],
          },
        ],
      },
      {
        text: { th: 'กินกาแฟสามแก้วแล้วลุยต่อ' },
        outcomes: [
          {
            text: { th: 'ใจสั่นจนกดโอนเงินผิดเพิ่มอีกสองรายการ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [-3_000, -1_000] },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'live_dance_request',
    category: 'lucky',
    weight: 6,
    when: { characters: ['live_seller'], methods: ['fake_shop'] },
    title: { th: 'คนดูขอให้เต้นก่อนปิดการขาย' },
    body: { th: 'คนดูไลฟ์ 3,000 คนพิมพ์พร้อมกันว่า "เต้นก่อนค่อยโอน" ไฟริงไลต์ส่องหน้าคุณรอคำตอบ' },
    choices: [
      {
        text: { th: 'เต้นสุดตัว' },
        outcomes: [
          {
            text: { th: 'ท่าเต้นของคุณไวรัลกว่าสินค้า ยอดโอนพุ่ง' },
            effects: [
              { kind: 'add', stat: 'fame', value: 10 },
              { kind: 'add', stat: 'dirtyCash', value: [3_000, 8_000] },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกว่าเจ็บหลัง' },
        outcomes: [
          {
            text: { th: 'คนดูออกจากไลฟ์ไปครึ่งหนึ่ง เหลือแต่บอท' },
            effects: [{ kind: 'add', stat: 'fame', value: -5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'live_freeze',
    category: 'unlucky',
    weight: 6,
    when: { characters: ['live_seller'], minFame: 15 },
    title: { th: 'ไลฟ์ค้างตอนหยิบกล่องเปล่า' },
    body: { th: 'สัญญาณเน็ตหลุดพอดีตอนคุณหยิบกล่องเปล่าใส่ถุง ภาพค้างอยู่อย่างนั้น 2 นาทีเต็ม มีคนแคปไปแล้ว 600 คน' },
    choices: [
      {
        text: { th: 'บอกว่าเป็น "กล่องอากาศบริสุทธิ์รุ่นพรีเมียม"' },
        outcomes: [
          {
            weight: 2,
            text: { th: 'มีคนสั่งกล่องอากาศเพิ่ม 40 กล่อง วงการนี้ไม่มีอะไรเป็นไปไม่ได้' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: [2_000, 5_000] }],
          },
          {
            weight: 3,
            text: { th: 'ไม่มีใครเชื่อ คลิปไปถึงเพจข่าว' },
            effects: [{ kind: 'add', stat: 'heat', value: 18 }],
          },
        ],
      },
      {
        text: { th: 'ปิดไลฟ์ หายไปสามวัน' },
        outcomes: [
          {
            text: { th: 'กระแสซาลง แต่ร้านก็เงียบตาม' },
            effects: [
              { kind: 'add', stat: 'heat', value: -5 },
              { kind: 'cooldown', methodId: 'fake_shop', days: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'phone_repair_victim',
    category: 'karma',
    weight: 6,
    when: { characters: ['phone_tech'], day: [3, 30] },
    title: { th: 'มือถือของเหยื่อมาให้ซ่อม' },
    body: {
      th: 'ลุงคนหนึ่งเอามือถือมาซ่อม หน้าจอเต็มไปด้วยแชตที่โดนหลอกโอนเงิน ลุงถามว่า "ซ่อมให้เงินกลับมาได้ไหม"',
    },
    choices: [
      {
        text: { th: 'ช่วยลุงเก็บหลักฐานแล้วพาไปแจ้งความ' },
        outcomes: [
          {
            text: { th: 'ลุงขอบใจจนน้ำตาซึม ตำรวจเริ่มจำหน้าคุณได้ในฐานะคนดี (ชั่วคราว)' },
            effects: [
              { kind: 'add', stat: 'karma', value: 12 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'เปลี่ยนแบตให้ แล้วทำเป็นไม่เห็น' },
        outcomes: [
          {
            text: { th: 'ได้ค่าแบต 450 บาท กับความรู้สึกแปลกๆ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: 450 },
              { kind: 'add', stat: 'karma', value: -4 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tarot_police',
    category: 'silly',
    weight: 7,
    when: { characters: ['fortune_teller'] },
    title: { th: 'เปิดไพ่ได้ไพ่ตำรวจ 3 ใบติด' },
    body: { th: 'อาจารย์เปิดไพ่ดูดวงตัวเองตอนเช้า ออกไพ่ "ตำรวจ" สามใบติด ซึ่งในสำรับไม่มีไพ่ใบนี้' },
    choices: [
      {
        text: { th: 'เชื่อไพ่ หยุดงานสองวัน' },
        outcomes: [
          {
            text: { th: 'นั่งสมาธิดูละคร Heat ลดลงพอสมควร' },
            effects: [
              { kind: 'add', stat: 'heat', value: -20 },
              { kind: 'modifier', target: 'income', pct: -50, days: 2 },
            ],
          },
        ],
      },
      {
        text: { th: 'ไม่เชื่อไพ่ตัวเอง' },
        outcomes: [
          {
            text: { th: 'ลูกค้าถามว่าอาจารย์ยังไม่เชื่อไพ่ แล้วจะให้เขาเชื่อได้ยังไง' },
            effects: [
              { kind: 'add', stat: 'heat', value: 8 },
              { kind: 'add', stat: 'fame', value: -5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lottery_client_hit',
    category: 'lucky',
    weight: 8,
    when: { characters: ['fortune_teller'], dates: [1, 2, 16, 17] },
    title: { th: 'เลขที่ใบ้ให้ลูกค้าดันออก' },
    body: { th: 'เมื่อวานใบ้เลขจากเบอร์รองเท้าตัวเอง วันนี้หวยออกตรง ลูกค้ามาต่อคิวหน้าบ้านตั้งแต่ตีห้า' },
    choices: [
      {
        text: { th: 'ขึ้นค่าครูสามเท่า' },
        outcomes: [
          {
            text: { th: 'ได้เงินเยอะจนต้องซื้อกระเป๋าใบใหม่ไว้ใส่' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [8_000, 20_000] },
              { kind: 'add', stat: 'fame', value: 15 },
              { kind: 'add', stat: 'heat', value: 10 },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกลูกค้าว่าฟลุก อย่าเชื่อมาก' },
        outcomes: [
          {
            text: { th: 'ลูกค้ายิ่งเชื่อว่าอาจารย์ถ่อมตัว ทุกอย่างเลยแย่ลงในทางที่ดี' },
            effects: [
              { kind: 'add', stat: 'karma', value: 5 },
              { kind: 'add', stat: 'fame', value: 8 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'coach_seminar',
    category: 'lucky',
    weight: 7,
    when: { characters: ['rich_coach'], day: [2, 22] },
    title: { th: 'เปิดคอร์ส "รวยใน 7 วัน" รุ่นใหม่' },
    body: { th: 'ห้องสัมมนาโรงแรมเต็ม ทุกคนใส่เสื้อเหลืองเหมือนกัน รอฟังเคล็ดลับที่โค้ชก็ไม่รู้' },
    choices: [
      {
        text: { th: 'เปิดรับเต็มห้อง' },
        outcomes: [
          {
            text: { th: 'ขายคอร์สหมดใน 4 นาที สอนให้ "เชื่อมั่น" 7 วัน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [20_000, 45_000] },
              { kind: 'add', stat: 'heat', value: 12 },
              { kind: 'add', stat: 'karma', value: -6 },
              { kind: 'schedule', eventId: 'coach_students_return', inDays: 7 },
            ],
          },
        ],
      },
      {
        text: { th: 'สอนฟรีเรื่องออมเงิน (ของจริง)' },
        outcomes: [
          {
            text: { th: 'ผู้เข้าร่วมงงมาก แต่บางคนเริ่มจดบัญชีรายจ่ายจริงๆ' },
            effects: [
              { kind: 'add', stat: 'karma', value: 10 },
              { kind: 'add', stat: 'fame', value: -10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'coach_students_return',
    category: 'unlucky',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'ลูกศิษย์รุ่นแรกกลับมา' },
    body: { th: 'ครบ 7 วันแล้ว ลูกศิษย์ทั้งรุ่นยังไม่รวย ยืนเรียงแถวหน้าบ้านพร้อมป้ายผ้า' },
    choices: [
      {
        text: { th: 'อธิบายว่ายังเชื่อมั่นไม่พอ ต้องลงคอร์สต่อ' },
        outcomes: [
          {
            weight: 1,
            text: { th: 'ครึ่งหนึ่งซื้อคอร์สต่อ อีกครึ่งเดินไปโรงพัก' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [10_000, 20_000] },
              { kind: 'add', stat: 'heat', value: 25 },
              { kind: 'add', stat: 'karma', value: -8 },
            ],
          },
        ],
      },
      {
        text: { th: 'คืนเงินบางส่วน' },
        outcomes: [
          {
            text: { th: 'ป้ายผ้าถูกม้วนเก็บ เหลือแค่โพสต์บ่นในกลุ่ม' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -12_000 },
              { kind: 'add', stat: 'heat', value: -5 },
              { kind: 'add', stat: 'karma', value: 6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'star_comeback',
    category: 'karma',
    weight: 6,
    when: { characters: ['fallen_star'], day: [8, 28] },
    title: { th: 'ผู้จัดละครชวนคัมแบ็ก' },
    body: {
      th: 'ผู้จัดเก่าโทรมาชวนเล่นละครหลังข่าวเรื่องใหม่ บทพระเอกที่เป็นมิจฉาชีพกลับใจ ค่าตัวน้อยกว่าที่คุณโกงได้ในวันเดียว',
    },
    choices: [
      {
        text: { th: 'รับบท ตั้งใจจะเลิกโกง' },
        outcomes: [
          {
            text: { th: 'กองถ่ายเริ่มเดือนหน้า คุณเริ่มท่องบทว่า "ผมผิดไปแล้ว"' },
            effects: [
              { kind: 'add', stat: 'karma', value: 15 },
              { kind: 'add', stat: 'fame', value: 20 },
              { kind: 'flag', flag: 'comeback' },
            ],
          },
        ],
      },
      {
        text: { th: 'ปฏิเสธ ค่าตัวน้อยไป' },
        outcomes: [
          {
            text: { th: 'ผู้จัดถอนหายใจ แล้วไปชวนดาราอีกคนที่ก็โกงเหมือนกัน' },
            effects: [{ kind: 'add', stat: 'karma', value: -3 }],
          },
        ],
      },
    ],
  },
  {
    id: 'banker_ex_boss',
    category: 'unlucky',
    weight: 6,
    when: { characters: ['ex_banker'] },
    title: { th: 'อดีตหัวหน้าโทรมาถามสารทุกข์' },
    body: { th: 'อดีตหัวหน้าสาขาโทรมาถามว่า "ช่วงนี้ทำอะไรอยู่" พร้อมเสียงพิมพ์คีย์บอร์ดเบาๆ ด้านหลัง' },
    choices: [
      {
        text: { th: 'บอกว่าเปิดร้านหมูกระทะ' },
        outcomes: [
          {
            text: { th: 'หัวหน้าบอกว่าจะพาทีมไปกินเสาร์นี้ คุณต้องรีบหาหมูจริง' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: -2_500 }],
          },
        ],
      },
      {
        text: { th: 'แกล้งทำเป็นสัญญาณหลุด' },
        outcomes: [
          {
            text: { th: 'หัวหน้าส่งข้อความตามมาว่า "สัญญาณหลุดตรงคำว่าฟอกพอดีเลยนะ"' },
            effects: [{ kind: 'add', stat: 'heat', value: 12 }],
          },
        ],
      },
    ],
  },
  {
    id: 'auntie_neighbors_unite',
    category: 'unlucky',
    weight: 9,
    when: { characters: ['share_auntie'], karma: [-9999, -25] },
    title: { th: 'เพื่อนบ้านรวมตัวกันแฉ' },
    body: { th: 'ป้าๆ ในซอยตั้งกลุ่มไลน์ใหม่ชื่อ "วงแชร์นี้ไม่มีเธอ" และเริ่มแชร์หลักฐานกันตั้งแต่ตีห้า' },
    choices: [
      {
        text: { th: 'จัดเลี้ยงขนมจีนทั้งซอยขอโทษ' },
        outcomes: [
          {
            text: { th: 'ขนมจีนอร่อยจนครึ่งซอยใจอ่อน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -6_000 },
              { kind: 'add', stat: 'heat', value: -10 },
              { kind: 'add', stat: 'karma', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ย้ายไปอยู่ซอยอื่น' },
        outcomes: [
          {
            text: { th: 'ซอยใหม่มีป้าหัวหน้าวงแชร์อยู่แล้ว และป้าคนนั้นดุกว่า' },
            effects: [
              { kind: 'add', stat: 'heat', value: 15 },
              { kind: 'add', stat: 'dirtyCash', value: -3_000 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'auntie_funeral',
    category: 'silly',
    weight: 6,
    when: { characters: ['share_auntie'], day: [5, 30] },
    title: { th: 'งานศพในซอย ทุกคนถามเรื่องเงินแชร์' },
    body: { th: 'ไปร่วมงานศพเจ้าของบ้านหัวมุม แขกทุกคนเดินมาถามว่า "งวดหน้าเปียได้เมื่อไหร่"' },
    choices: [
      {
        text: { th: 'บอกว่าเปิดวงใหม่หลังงาน' },
        outcomes: [
          {
            text: { th: 'ได้สมาชิกใหม่ 9 คนในงานศพ ซึ่งไม่ใช่เรื่องที่ควรภูมิใจ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [5_000, 12_000] },
              { kind: 'add', stat: 'karma', value: -6 },
            ],
          },
        ],
      },
      {
        text: { th: 'ช่วยล้างจานทั้งงานแทน' },
        outcomes: [
          {
            text: { th: 'ป้าๆ ชมว่าเป็นคนดี และลืมถามเรื่องเงินไปหนึ่งวัน' },
            effects: [
              { kind: 'add', stat: 'karma', value: 4 },
              { kind: 'add', stat: 'heat', value: -5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cat_keyboard',
    category: 'silly',
    weight: 8,
    once: false,
    when: { characters: ['orange_cat'] },
    title: { th: 'เดินบนคีย์บอร์ดตอนโอนเงิน' },
    body: { th: 'ส้มซ่าเดินผ่านคีย์บอร์ดระหว่างที่แอปธนาคารเปิดค้างอยู่ ตัวเลขเปลี่ยนไปหลายหลัก' },
    choices: [
      {
        text: { th: 'นอนทับคีย์บอร์ดต่อ' },
        outcomes: [
          {
            text: { th: 'โอนผิดไปหาร้านอาหารแมว ได้อาหารแมวมา 40 กระสอบ' },
            effects: [{ kind: 'mul', stat: 'dirtyCash', value: 0.8 }],
          },
          {
            text: { th: 'บังเอิญกดรับโปรโมชันคืนเงินคืนมาซะงั้น' },
            effects: [{ kind: 'mul', stat: 'dirtyCash', value: 1.3 }],
          },
        ],
      },
      {
        text: { th: 'ปัดแก้วน้ำตกโต๊ะแทน' },
        outcomes: [
          {
            text: { th: 'คอมดับ ตำรวจไซเบอร์ที่กำลังส่องอยู่หาไม่เจอ' },
            effects: [{ kind: 'add', stat: 'heat', value: -12 }],
          },
        ],
      },
    ],
  },
  {
    id: 'cat_police_pet',
    category: 'lucky',
    weight: 7,
    when: { characters: ['orange_cat'], heat: [40, 100] },
    title: { th: 'ตำรวจมาค้นบ้าน เจอแต่แมว' },
    body: { th: 'ตำรวจบุกค้นห้อง เจอแมวส้มนอนหงายท้องบนกองซิม ตำรวจทุกนายนั่งลงลูบพุงแมว' },
    choices: [
      {
        text: { th: 'ร้องเหมียวอ้อนสุดชีวิต' },
        outcomes: [
          {
            text: { th: 'ตำรวจถ่ายรูปไปลงกลุ่มคนรักแมว แล้วลืมว่ามาทำอะไร' },
            effects: [
              { kind: 'add', stat: 'heat', value: -30 },
              { kind: 'add', stat: 'fame', value: 10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'caretaker_call',
    category: 'karma',
    weight: 6,
    when: { characters: ['temple_kid'], day: [6, 30] },
    title: { th: 'ลุงเฝ้าวัดที่เลี้ยงมาโทรหา' },
    body: { th: 'ลุงคนเฝ้าวัดที่เลี้ยงคุณมาตั้งแต่เด็กโทรมาถามว่า "กินข้าวหรือยัง งานใหม่เป็นยังไงบ้าง"' },
    choices: [
      {
        text: { th: 'โกหกว่างานดีมาก' },
        outcomes: [
          {
            text: { th: 'ลุงดีใจ คุณวางสายแล้วนั่งเงียบไปนาน' },
            effects: [{ kind: 'add', stat: 'karma', value: -5 }],
          },
        ],
      },
      {
        text: { th: 'เล่าความจริง' },
        outcomes: [
          {
            text: { th: 'ลุงไม่ด่า แค่บอกว่า "ถ้าจะกลับตัว ประตูบ้านเปิดอยู่เสมอ"' },
            effects: [
              { kind: 'add', stat: 'karma', value: 15 },
              { kind: 'flag', flag: 'promised_family' },
            ],
          },
        ],
      },
    ],
  },
];
