import type { GameEvent } from '../../src/types/content';

// เหตุการณ์ตามปฏิทินไทย และเหตุการณ์ของวิธีโกงระดับสูง
export const seasonalEvents: GameEvent[] = [
  {
    id: 'songkran_phones',
    category: 'silly',
    weight: 9,
    when: { festivals: ['songkran'] },
    title: { th: 'น้ำสงกรานต์สาดโทรศัพท์แก๊งพัง 12 เครื่อง' },
    body: { th: 'เด็กข้างบ้านถือปืนฉีดน้ำขนาดเท่าบาซูก้าบุกเข้ามาอวยพร โทรศัพท์ทั้งแก๊งจมน้ำพร้อมกัน' },
    choices: [
      {
        text: { th: 'ออกไปเล่นน้ำด้วยเลย' },
        outcomes: [
          {
            text: { th: 'เปียกยันถุงเท้ากันทั้งแก๊ง วันนี้ถือว่าหยุดสงกรานต์ก็แล้วกัน' },
            effects: [
              { kind: 'add', stat: 'heat', value: -15 },
              { kind: 'loyalty', value: 10 },
              { kind: 'modifier', target: 'income', pct: -40, days: 1 },
            ],
          },
        ],
      },
      {
        text: { th: 'ซื้อเครื่องใหม่ยกโหล' },
        outcomes: [
          {
            text: { th: 'ร้านมือถือยิ้มแก้มปริ ขอบคุณที่อุดหนุน' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: -4_000 }],
          },
        ],
      },
    ],
  },
  {
    id: 'world_cup_strike',
    category: 'silly',
    weight: 8,
    when: { festivals: ['world_cup'], needsHenchman: true },
    title: { th: 'บอลโลกมา ลูกน้องทั้งแก๊งไม่ทำงาน' },
    body: { th: 'ลูกน้องเอาจอโทรทัศน์มาตั้งกลางห้องคอลเซ็นเตอร์ ทุกคนใส่เสื้อทีมชาติที่ตัวเองไม่ได้เชียร์' },
    choices: [
      {
        text: { th: 'นั่งดูด้วยกัน' },
        outcomes: [
          {
            text: { th: 'เชียร์จนเสียงแหบ งานไม่เดินแต่ทุกคนรักคุณ' },
            effects: [
              { kind: 'loyalty', value: 15 },
              { kind: 'modifier', target: 'income', pct: -40, days: 1 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปิดทีวี หักเงินคนที่ดู' },
        outcomes: [
          {
            text: { th: 'ลูกน้องเงียบ แล้วไปดูต่อในห้องน้ำ' },
            effects: [{ kind: 'loyalty', value: -20 }],
          },
        ],
      },
    ],
  },
  {
    id: 'payday_rush',
    category: 'lucky',
    weight: 6,
    once: false,
    when: { dates: [25, 26, 27, 28] },
    title: { th: 'เงินเดือนออก ทุกคนใจป้ำ' },
    body: { th: 'วันเงินเดือนออก คนทั้งประเทศรู้สึกรวยไปสามวัน ก่อนจะจนอีกยี่สิบเจ็ดวัน' },
    choices: [
      {
        text: { th: 'โหมงานเต็มที่' },
        outcomes: [
          {
            text: { th: 'ทุกช่องทางยอดดีผิดปกติ' },
            effects: [
              { kind: 'modifier', target: 'income', pct: 40, days: 1 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'สั่งชาบูให้ลูกน้องฉลอง' },
        outcomes: [
          {
            text: { th: 'ลูกน้องกินกันจนอิ่ม บอก “คราวหน้าเลี้ยงอีกนะเฮีย”' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -2_000 },
              { kind: 'loyalty', value: 15 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lottery_day_break',
    category: 'silly',
    weight: 6,
    once: false,
    when: { dates: [1, 16], needsHenchman: true },
    title: { th: 'หวยออกวันนี้ ลูกน้องขอเลิกงานไปลุ้น' },
    body: { th: 'บ่ายสามโมง ลูกน้องทุกคนจ้องจอถ่ายทอดสด กำสลากไว้แน่นยิ่งกว่ากำโทรศัพท์' },
    choices: [
      {
        text: { th: 'ปล่อยไปลุ้น' },
        outcomes: [
          {
            text: { th: 'ไม่มีใครถูก แต่ทุกคนรู้สึกว่าคุณใจดี' },
            effects: [{ kind: 'loyalty', value: 10 }],
          },
        ],
      },
      {
        text: { th: 'ห้ามดู ทำงานต่อ' },
        outcomes: [
          {
            text: { th: 'ลูกน้องแอบดูในมือถือแล้วโทรผิดเบอร์ทั้งบ่าย' },
            effects: [
              { kind: 'loyalty', value: -10 },
              { kind: 'add', stat: 'heat', value: 5 },
            ],
          },
        ],
      },
      {
        text: { th: '[หมอดู] ใบ้เลขให้ลูกน้องทุกคน' },
        requires: { characters: ['fortune_teller'] },
        outcomes: [
          {
            text: { th: 'ถูกเลขท้ายสองตัวสามคน ลูกน้องกราบอาจารย์ทั้งห้อง' },
            effects: [
              { kind: 'loyalty', value: 25 },
              { kind: 'add', stat: 'fame', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'loy_krathong_call',
    category: 'lucky',
    weight: 8,
    when: { festivals: ['loy_krathong'], usedMethods: ['romance'] },
    title: { th: 'เหยื่อหลอกรักอยากลอยกระทงด้วยกัน' },
    body: { th: 'เหยื่อขอวิดีโอคอลลอยกระทงด้วยกันคืนนี้ แต่ “วิศวกรแท่นขุดเจาะ” อย่างคุณอยู่กลางทะเลทราย' },
    choices: [
      {
        text: { th: 'ลอยกระทงในกะละมังหน้าห้อง' },
        outcomes: [
          {
            text: { th: 'เหยื่อซึ้งจนร้องไห้ บอกว่าไม่เคยมีใครทำแบบนี้ให้' },
            effects: [
              { kind: 'romanceBond', value: 3 },
              { kind: 'add', stat: 'karma', value: -3 },
            ],
          },
        ],
      },
      {
        text: { th: 'อ้างว่าพายุเข้า สัญญาณไม่มี' },
        outcomes: [
          {
            text: { th: 'เหยื่อเชื่อ แต่ลอยกระทงกับคนข้างบ้านแทน' },
            effects: [{ kind: 'romanceBond', value: -2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'new_year_checkpoint',
    category: 'unlucky',
    weight: 8,
    when: { festivals: ['new_year'] },
    title: { th: 'ด่านตรวจปีใหม่ทุกหัวมุม' },
    body: { th: 'ตำรวจตั้งด่านตรวจทุกซอยช่วงปีใหม่ รถตู้ของแก๊งที่บรรทุกซิมการ์ดเต็มคันต้องผ่านสามด่าน' },
    choices: [
      {
        text: { th: 'อ้อมไปทางทุ่งนา' },
        outcomes: [
          {
            text: { th: 'รถติดหล่มกลางนา ชาวนาช่วยเข็นแลกกับซิมหนึ่งแผง' },
            effects: [{ kind: 'modifier', target: 'income', pct: -25, days: 1 }],
          },
        ],
      },
      {
        text: { th: 'ขับผ่านด่านแบบมั่นใจ' },
        outcomes: [
          {
            weight: 2,
            text: { th: 'ตำรวจโบกให้ผ่าน เพราะมัวแต่ตรวจแอลกอฮอล์' },
            effects: [],
          },
          {
            weight: 1,
            text: { th: 'โดนเรียกตรวจ ซิมหล่นเต็มพื้น' },
            effects: [{ kind: 'add', stat: 'heat', value: 20 }],
          },
        ],
      },
    ],
  },
  {
    id: 'flood_donations',
    category: 'lucky',
    weight: 9,
    when: { usedMethods: ['foundation'], months: [8, 9, 10, 11] },
    title: { th: 'ข่าวน้ำท่วม ยอดบริจาคมูลนิธิพุ่ง' },
    body: { th: 'น้ำท่วมหลายจังหวัด คนไทยใจดีพร้อมช่วย และมูลนิธิของคุณก็อยู่ในผลค้นหาอันดับแรกพอดี' },
    choices: [
      {
        text: { th: 'เปิดรับบริจาคเต็มที่' },
        outcomes: [
          {
            text: { th: 'ยอดบริจาคไหลเข้า ×3 สองวัน ทั้งที่คุณยังไม่ได้ส่งถุงยังชีพสักถุง' },
            effects: [
              { kind: 'modifier', target: 'income', methodId: 'foundation', pct: 200, days: 2 },
              { kind: 'add', stat: 'karma', value: -12 },
            ],
          },
        ],
      },
      {
        text: { th: 'ส่งของช่วยผู้ประสบภัยจริงด้วย' },
        outcomes: [
          {
            text: { th: 'ของถึงมือผู้ประสบภัยจริง ยอดบริจาคก็ยังขึ้นเพราะมีรูปจริงไปโพสต์' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -8_000 },
              { kind: 'modifier', target: 'income', methodId: 'foundation', pct: 100, days: 2 },
              { kind: 'add', stat: 'karma', value: 15 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'foundation_receipts',
    category: 'unlucky',
    weight: 6,
    when: { methods: ['foundation'] },
    title: { th: 'ชาวเน็ตขอดูใบเสร็จมูลนิธิ' },
    body: { th: 'คอมเมนต์อันดับหนึ่งในเพจมูลนิธิเขียนว่า “ขอดูใบเสร็จหน่อยครับ” มีคนกดไลก์ 12,000 คน' },
    choices: [
      {
        text: { th: 'โพสต์ใบเสร็จร้านหมูกระทะ' },
        outcomes: [
          {
            text: { th: 'ชาวเน็ตซูมใบเสร็จแล้วเจอว่าสั่งหมูสามชาม “เพื่อผู้ประสบภัย”' },
            effects: [{ kind: 'add', stat: 'heat', value: 15 }],
          },
        ],
      },
      {
        text: { th: 'ปิดคอมเมนต์ทั้งเพจ' },
        outcomes: [
          {
            text: { th: 'ชาวเน็ตไปคอมเมนต์ที่เพจอื่นแทน แบบดังกว่าเดิม' },
            effects: [
              { kind: 'add', stat: 'fame', value: -10 },
              { kind: 'add', stat: 'heat', value: 6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'merit_speaker',
    category: 'silly',
    weight: 6,
    when: { methods: ['merit'] },
    title: { th: 'ลำโพงงานใหญ่กว่าเวที' },
    body: { th: 'ลำโพงที่เช่ามาสำหรับงานรื่นเริงดังจนกระจกบ้านข้าง ๆ สั่น ลุงบ้านตรงข้ามโทรแจ้งตำรวจสามรอบ' },
    choices: [
      {
        text: { th: 'ลดเสียงลงครึ่งหนึ่ง' },
        outcomes: [
          {
            text: { th: 'งานเงียบลง คนมาน้อยลง แต่ลุงหลับได้' },
            effects: [{ kind: 'modifier', target: 'income', methodId: 'merit', pct: -20, days: 1 }],
          },
        ],
      },
      {
        text: { th: 'เชิญลุงมาร่วมงานเป็นแขกเกียรติยศ' },
        outcomes: [
          {
            text: { th: 'ลุงร้องเพลงลูกทุ่งบนเวที 9 เพลง ลืมโทรแจ้งตำรวจรอบที่สี่' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -1_500 },
              { kind: 'add', stat: 'heat', value: -8 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'kathin_overflow',
    category: 'lucky',
    weight: 7,
    when: { methods: ['merit'], festivals: ['kathin', 'songkran'] },
    title: { th: 'งานแน่นจนที่จอดรถไม่พอ' },
    body: { th: 'ช่วงเทศกาล คนมาร่วมงานที่คุณจัดเยอะจนต้องเช่าลานจอดรถห้างข้าง ๆ เพิ่ม' },
    choices: [
      {
        text: { th: 'ขยายงานอีกวัน' },
        outcomes: [
          {
            text: { th: 'งานยืดไปอีกวัน รายได้ยืดตาม' },
            effects: [
              { kind: 'modifier', target: 'income', methodId: 'merit', pct: 50, days: 2 },
              { kind: 'add', stat: 'karma', value: -5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ให้เงินส่วนเกินกับโรงเรียนในชุมชนจริง ๆ' },
        outcomes: [
          {
            text: { th: 'เด็ก ๆ ได้หนังสือใหม่ทั้งห้องสมุด ครูส่งรูปมาขอบคุณ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -6_000 },
              { kind: 'add', stat: 'karma', value: 14 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'celebrity_slip',
    category: 'unlucky',
    weight: 6,
    when: { methods: ['gambling'] },
    title: { th: 'ดาราโปรโมตพูดเกินบท' },
    body: { th: 'ดาราที่จ้างมาไลฟ์โปรโมตเผลอพูดว่า “เว็บนี้ดีมาก ไม่เคยมีใครชนะเลยค่ะ” แล้วหัวเราะ' },
    choices: [
      {
        text: { th: 'ลบไลฟ์ทันที' },
        outcomes: [
          {
            text: { th: 'สายไปแล้ว คลิปถูกตัดไปทำมีม 300 แบบ' },
            effects: [{ kind: 'add', stat: 'heat', value: 18 }],
          },
        ],
      },
      {
        text: { th: 'บอกว่าเป็นมุกตลก “ไม่เคยมีใครชนะ...ความหล่อของเว็บเรา”' },
        outcomes: [
          {
            text: { th: 'มีคนเชื่อ 40% อีก 60% ยังทำมีมต่อ' },
            effects: [
              { kind: 'add', stat: 'heat', value: 8 },
              { kind: 'add', stat: 'fame', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gambling_real_winner',
    category: 'silly',
    weight: 5,
    when: { methods: ['gambling'] },
    title: { th: 'มีคนชนะรางวัลใหญ่จริง ๆ ครั้งแรกของเว็บ' },
    body: { th: 'ระบบผิดพลาด ลุงคนหนึ่งชนะแจ็กพอต 2 แสนบาท ลุงไลฟ์ร้องไห้ดีใจรอรับเงิน' },
    choices: [
      {
        text: { th: 'จ่ายจริง เอาไว้ทำโฆษณา' },
        outcomes: [
          {
            text: { th: 'คลิปลุงดีใจกลายเป็นโฆษณาที่ดีที่สุดของเว็บ' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [-20_000, -10_000] },
              { kind: 'add', stat: 'fame', value: 15 },
              { kind: 'modifier', target: 'income', methodId: 'gambling', pct: 40, days: 3 },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกว่าระบบล่ม' },
        outcomes: [
          {
            text: { th: 'ลุงไลฟ์ต่อ เปลี่ยนจากร้องไห้ดีใจเป็นร้องไห้โกรธ' },
            effects: [
              { kind: 'add', stat: 'heat', value: 15 },
              { kind: 'add', stat: 'karma', value: -5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ponzi_seminar_question',
    category: 'silly',
    weight: 6,
    when: { methods: ['ponzi'] },
    title: { th: 'สมาชิกถามว่า “ปลาทองคอยน์เอาไปทำอะไรได้”' },
    body: { th: 'ในงานสัมมนา คุณป้าแถวหน้ายกมือถามคำถามที่ไม่มีใครเคยถามมาก่อน ทั้งห้องเงียบ' },
    choices: [
      {
        text: { th: 'ตอบว่าเอาไปซื้อปลาทองได้' },
        outcomes: [
          {
            text: { th: 'ทั้งห้องปรบมือ ไม่มีใครถามต่อว่าปลาทองเอาไปทำอะไร' },
            effects: [{ kind: 'add', stat: 'fame', value: 5 }],
          },
        ],
      },
      {
        text: { th: 'เปิดเพลงปลุกใจดัง ๆ' },
        outcomes: [
          {
            text: { th: 'ทุกคนลุกเต้น ลืมคำถาม แต่ป้าแถวหน้าจดชื่อคุณไว้' },
            effects: [{ kind: 'add', stat: 'heat', value: 6 }],
          },
        ],
      },
    ],
  },
  {
    id: 'ponzi_whale',
    category: 'lucky',
    weight: 5,
    when: { methods: ['ponzi'], minLevel: 4 },
    title: { th: 'เสี่ยใหญ่อยากลงทุนก้อนโต' },
    body: { th: 'เสี่ยเจ้าของโรงงานน้ำปลาอยากลงทุนปลาทองคอยน์ก้อนใหญ่ “เพราะชื่อเป็นปลาเหมือนกัน”' },
    choices: [
      {
        text: { th: 'รับเงินเสี่ย' },
        outcomes: [
          {
            text: { th: 'เงินก้อนใหญ่เข้า และเสี่ยมีทนายประจำตัวสามคน' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: [80_000, 150_000] },
              { kind: 'add', stat: 'heat', value: 22 },
              { kind: 'add', stat: 'karma', value: -8 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปฏิเสธ เสี่ยดูอันตรายเกินไป' },
        outcomes: [
          {
            text: { th: 'เสี่ยไปลงทุนกับแก๊งอื่น ซึ่งโดนจับในอาทิตย์ถัดมา' },
            effects: [{ kind: 'add', stat: 'heat', value: -5 }],
          },
        ],
      },
    ],
  },
];
