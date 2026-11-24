import type { GameEvent } from '../../src/types/content';

// เหตุการณ์ต่อเนื่อง (เลือกวันนี้ มีผลอีกหลายวัน) และตัวละครประจำที่กลับมาเรื่อยๆ
export const storyEvents: GameEvent[] = [
  {
    id: 'counter_live', category: 'silly', weight: 1, when: { methods: ['fake_shop'] },
    title: { th: 'เจ๊จัดกล้องไลฟ์' },
    body: { th: 'เจ๊ฝากถือกล้อง หม้อทอดอยู่ทางซ้าย ส่วนทางขวา… หางใครน่ะ?' },
    choices: [
      { text: { th: 'ถ่ายหม้อทอด' }, liveCat: 'sale', outcomes: [{
        text: { th: 'ปิดยอดหม้อทอดได้แล้ว!' }, effects: [{ kind: 'add', stat: 'dirtyCash', value: 500 }],
      }] },
      { text: { th: 'ตามส้มซ่า' }, liveCat: 'stay', outcomes: [{
        text: { th: 'คนดูฝากถาม “พรุ่งนี้น้องไลฟ์กี่โมงคะ”' }, effects: [{ kind: 'add', stat: 'fame', value: 4 }],
      }] },
    ],
  },
  {
    id: 'cf_orange_cat',
    category: 'silly',
    weight: 45,
    when: { neighborhoodEdition: true, characters: ['live_seller'], methods: ['fake_shop'] },
    title: { th: 'ลูกค้าขอเอฟแมว' },
    body: { th: 'เจ๊ชูหม้อทอดขึ้นกล้อง “เหลือใบสุดท้ายแล้วค่ะ ใครรับพิมพ์เอฟ!” ส้มซ่าเดินตัดหน้ากล้องพอดี ยอดคนดูพุ่งจาก 8 เป็น 80 คน แชตเด้งขึ้นมา “เอฟตัวส้มค่ะ”' },
    choices: [
      {
        text: { th: 'อุ้มส้มซ่าออกจากกล้อง' },
        liveCat: 'lift',
        outcomes: [{
          text: { th: 'เจ๊: “แมวไม่ขายค่ะ” ลูกค้า: “งั้นผ่านค่ะ” คนดูจาก 80 เหลือ 8 เจ๊วางหม้อทอดแล้วหันไปมองแมว' },
          effects: [{ kind: 'add', stat: 'heat', value: -2 }],
        }],
      },
      {
        text: { th: 'ให้ส้มซ่านั่งขายด้วย' },
        liveCat: 'stay',
        outcomes: [{
          text: { th: 'คนดูทะลุร้อย เจ๊พลิกหม้อทอดให้ดูทุกมุม แชตถามอยู่เรื่องเดียว “เจ๊คะ ขอดูอุ้งเท้าอีกที”' },
          effects: [{ kind: 'add', stat: 'fame', value: 4 }],
        }],
      },
    ],
  },
  {id:'nat_receipt',category:'silly',weight:28,when:{recruit:'intern_nat'},title:{th:'น้องนัทขอเบิกค่าเทปกาว'},body:{th:'เด็กฝึกงานยื่นใบเสร็จยาวถึงพื้น เขาซื้อเทปกาวมาซ่อมเครื่องพิมพ์ใบเสร็จที่หยุดพิมพ์ไม่ได้'},choices:[
    {text:{th:'อนุมัติค่าซ่อมให้เด็ก'},outcomes:[{text:{th:'นัทแปะปุ่มหยุดสำเร็จ ทั้งโต๊ะปรบมือให้'},effects:[{kind:'add',stat:'dirtyCash',value:-100},{kind:'loyalty',value:6}]}]},
    {text:{th:'เอาใบเสร็จไปประกวดว่าว'},outcomes:[{text:{th:'ว่าวใบเสร็จคว้ารางวัลขวัญใจตลาด'},effects:[{kind:'add',stat:'fame',value:4}]}]}]},
  {id:'tuk_mic',category:'silly',weight:28,when:{recruit:'host_tuk'},title:{th:'พี่ตุ๊กลืมปิดไมค์'},body:{th:'เสียงซุบซิบเรื่องกับข้าวดังไปถึงหน้าปากซอย คนเริ่มเอาจานมาต่อคิว'},choices:[
    {text:{th:'จัดรายการขอเพลงไปเลย'},outcomes:[{text:{th:'คนทั้งซอยร้องตาม รถสายตรวจก็จอดฟัง'},effects:[{kind:'add',stat:'fame',value:8},{kind:'add',stat:'heat',value:4}]}]},
    {text:{th:'ส่งป้ายพักโฆษณาให้พี่ตุ๊ก'},outcomes:[{text:{th:'พี่ตุ๊กโค้งให้หม้อข้าวแล้วค่อยปิดไมค์'},effects:[{kind:'add',stat:'heat',value:-3}]}]}]},
  // ---- ลูกน้องตกหลุมรักเหยื่อ (3 ตอน) ----
  {
    id: 'henchman_love_1',
    category: 'silly',
    weight: 5,
    when: { needsHenchman: true, usedMethods: ['romance'], day: [4, 24] },
    title: { th: 'ลูกน้องตกหลุมรักเหยื่อหลอกรัก' },
    body: { th: 'ลูกน้องที่ช่วยพิมพ์แชตหลอกรักเริ่มพิมพ์จากใจ วันนี้ส่งกลอนแปดไปให้เหยื่อเองโดยไม่มีใครสั่ง' },
    choices: [
      {
        text: { th: 'ห้ามเด็ดขาด งานคืองาน' },
        outcomes: [
          {
            text: { th: 'ลูกน้องหน้าหงอยทั้งวัน พิมพ์ช้าลงครึ่งหนึ่ง' },
            effects: [{ kind: 'loyalty', value: -15 }],
          },
        ],
      },
      {
        text: { th: 'อวยพร ปล่อยให้รักกันไป' },
        outcomes: [
          {
            text: { th: 'ลูกน้องยิ้มทั้งวัน และเริ่มหาข้อมูลชุดเจ้าบ่าว' },
            effects: [
              { kind: 'loyalty', value: 15 },
              { kind: 'schedule', eventId: 'henchman_love_2', inDays: 3 },
            ],
          },
        ],
      },
      {
        text: { th: 'ให้ลูกน้องสารภาพความจริงกับเหยื่อ' },
        outcomes: [
          {
            text: { th: 'เหยื่อโกรธ แต่ขอบคุณที่บอก แล้วบล็อกทั้งแก๊ง' },
            effects: [
              { kind: 'add', stat: 'karma', value: 8 },
              { kind: 'romanceBond', value: -10 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'henchman_love_2',
    category: 'karma',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'ลูกน้องขอลาออกไปแต่งงาน' },
    body: { th: 'ลูกน้องยื่นใบลาออกเขียนด้วยปากกาหมึกซึม บอกว่าจะเริ่มชีวิตใหม่กับคนที่เคยเป็นเหยื่อ' },
    choices: [
      {
        text: { th: 'ให้ลาออก พร้อมเงินขวัญถุง' },
        outcomes: [
          {
            text: { th: 'ลูกน้องกอดคุณแน่นแล้วเดินจากไป บอกว่าจะส่งการ์ดมา' },
            effects: [
              { kind: 'loseHenchman' },
              { kind: 'add', stat: 'dirtyCash', value: -3_000 },
              { kind: 'add', stat: 'karma', value: 6 },
              { kind: 'schedule', eventId: 'henchman_love_3', inDays: 4 },
            ],
          },
        ],
      },
      {
        text: { th: 'ไม่ให้ลา ยังมีงานค้าง' },
        outcomes: [
          {
            text: { th: 'ตัวนั่งอยู่โต๊ะ แต่ใจลูกน้องเดินไปถึงโรงพักแล้ว' },
            effects: [{ kind: 'loyalty', value: -35 }],
          },
        ],
      },
    ],
  },
  {
    id: 'henchman_love_3',
    category: 'silly',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'การ์ดแต่งงานมาถึง' },
    body: { th: 'การ์ดแต่งงานสีชมพูเขียนว่า “ขอเชิญเป็นเพื่อนเจ้าบ่าว” สถานที่จัดงาน: หอประชุมข้างสถานีตำรวจ' },
    choices: [
      {
        text: { th: 'ไปงาน ใส่สูทเต็มยศ' },
        outcomes: [
          {
            text: { th: 'ตำรวจครึ่งห้องหันมามอง หน้าอย่างคุ้น! พอดีเจ้าบ่าวเริ่มกล่าวขอบคุณ ทุกคนเลยหันไปซับน้ำตา' },
            effects: [
              { kind: 'add', stat: 'karma', value: 5 },
              { kind: 'add', stat: 'fame', value: 5 },
              { kind: 'add', stat: 'heat', value: 12 },
            ],
          },
        ],
      },
      {
        text: { th: 'ฝากซองไปแทน' },
        outcomes: [
          {
            text: { th: 'บ่าวสาวส่งรูปมาขอบคุณ ในรูปมีคุณติดอยู่ในป้ายไวนิลด้านหลัง' },
            effects: [{ kind: 'add', stat: 'dirtyCash', value: -2_000 }],
          },
        ],
      },
    ],
  },
  // ---- สารวัตรหมูกระทะ (ตัวละครประจำ) ----
  {
    id: 'inspector_1',
    category: 'unlucky',
    weight: 5,
    when: { day: [5, 24], heat: [25, 100] },
    title: { th: 'สารวัตรหมูกระทะมานั่งร้าน' },
    body: {
      th: '“สารวัตรหมูกระทะ” ตำรวจที่ขึ้นชื่อเรื่องจับโกงและกินหมูเก่ง มานั่งร้านหมูกระทะที่คุณใช้บังหน้า สั่งหมูสามชุด',
    },
    choices: [
      {
        text: { th: 'ปิ้งหมูให้อย่างดี' },
        outcomes: [
          {
            text: { th: 'สารวัตรชมว่าหมูนุ่ม และบอกว่าจะมาใหม่' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -1_000 },
              { kind: 'flag', flag: 'inspector_fan' },
              { kind: 'schedule', eventId: 'inspector_2', inDays: 4 },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกว่าหมูหมด' },
        outcomes: [
          {
            text: { th: 'สารวัตรมองเตาที่ยังร้อน แล้วจดอะไรบางอย่างลงสมุด' },
            effects: [
              { kind: 'add', stat: 'heat', value: 10 },
              { kind: 'schedule', eventId: 'inspector_2', inDays: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'inspector_2',
    category: 'unlucky',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'สารวัตรหมูกระทะกลับมาพร้อมลูกน้อง 6 คน' },
    body: {
      th: 'สารวัตรกลับมาอีกรอบ คราวนี้พาลูกน้องมาเต็มโต๊ะ ทุกคนถามคำถามเดียวกันว่า “ร้านนี้ลูกค้าน้อย ทำไมรวยจัง”',
    },
    choices: [
      {
        text: { th: 'เลี้ยงฟรีทั้งโต๊ะ' },
        outcomes: [
          {
            text: { th: 'ทุกคนอิ่ม และลืมคำถามไปชั่วคราว' },
            effects: [
              { kind: 'add', stat: 'dirtyCash', value: -5_000 },
              { kind: 'add', stat: 'heat', value: -15 },
            ],
          },
        ],
      },
      {
        text: { th: 'ปิดร้านกะทันหัน “แก๊สหมด”' },
        outcomes: [
          {
            text: { th: 'สารวัตรหยิบถังแก๊สที่เต็มเปี่ยมขึ้นมาดู แล้วยิ้ม' },
            effects: [{ kind: 'add', stat: 'heat', value: 22 }],
          },
        ],
      },
      {
        text: { th: '[ช่างมือถือ] เสนอซ่อมวิทยุสื่อสารให้ฟรี' },
        requires: { characters: ['phone_tech'] },
        outcomes: [
          {
            text: { th: 'วิทยุทั้งโรงพักใช้ได้ดีขึ้น สารวัตรเลยเปลี่ยนเรื่องคุยเป็นเรื่องเสาอากาศ' },
            effects: [{ kind: 'add', stat: 'heat', value: -25 }],
          },
        ],
      },
      {
        text: { th: '[ทนาย] ให้ทนายเสี่ยงดวงตอบแทน' },
        requires: { upgrades: ['lucky_lawyer'] },
        outcomes: [
          {
            text: { th: 'ทนายพูดศัพท์กฎหมายที่ไม่มีอยู่จริงจนสารวัตรงง' },
            effects: [{ kind: 'add', stat: 'heat', value: -18 }],
          },
        ],
      },
    ],
  },
  // ---- เจ๊ข่าวไว นักข่าวสายสืบ ----
  {
    id: 'reporter_aunt',
    category: 'unlucky',
    weight: 4,
    when: { minFame: 20, day: [4, 25] },
    title: { th: 'เจ๊ข่าวไวขอสัมภาษณ์' },
    body: { th: '“เจ๊ข่าวไว” นักข่าวสายสืบที่ไม่เคยพลาดข่าว ยื่นไมค์มาตรงหน้า “ช่วยเล่าที่มาของความรวยหน่อยค่ะ”' },
    choices: [
      {
        text: { th: 'ใส่วิกปลอมตัวเป็นอีกคน' },
        outcomes: [
          {
            text: { th: 'วิกหลุดตอนลมพัด กล้องจับได้พอดี' },
            effects: [{ kind: 'add', stat: 'heat', value: 15 }],
          },
          {
            text: { th: 'เจ๊ข่าวไวเชื่อ และสัมภาษณ์ “คนรู้จักของคุณ” อย่างละเอียด' },
            effects: [{ kind: 'add', stat: 'fame', value: 5 }],
          },
        ],
      },
      {
        text: { th: 'ให้ข่าวว่ารวยจากขายต้นไม้ด่าง' },
        outcomes: [
          {
            text: { th: 'ข่าวออกอากาศ คนแห่มาซื้อต้นไม้ที่คุณไม่มี' },
            effects: [
              { kind: 'add', stat: 'fame', value: 10 },
              { kind: 'schedule', eventId: 'reporter_followup', inDays: 5 },
            ],
          },
        ],
      },
      {
        text: { th: 'ส่งลูกน้องที่อยากดังออกกล้อง' },
        interview: 'henchman',
        requires: { minHenchmen: 1 },
        outcomes: [{
          text: { th: 'ลูกน้องยืดอกรับไมค์ แต่สะดุดตรงคำถามว่าบริษัททำอะไร เจ๊วงคำตอบไว้ลงฉบับเช้า' },
          effects: [{ kind: 'add', stat: 'fame', value: 12 }, { kind: 'add', stat: 'heat', value: 8 }],
        }],
      },
      {
        text: { th: 'อุ้มแมวส้มมาให้สัมภาษณ์แทน' },
        interview: 'cat',
        outcomes: [{
          text: { th: 'แมวงับฟองน้ำหุ้มไมค์แล้วหลับ คนดูส่งรูปปลาทูเข้ารายการ เจ๊จองหน้าหนึ่งฉบับเช้าให้ทันที' },
          effects: [{ kind: 'add', stat: 'fame', value: 4 }, { kind: 'add', stat: 'heat', value: -3 }],
        }],
      },
    ],
  },
  {
    id: 'reporter_followup',
    category: 'unlucky',
    weight: 1,
    chainOnly: true,
    when: {},
    title: { th: 'เจ๊ข่าวไวตามมาเจอว่าไม่มีต้นไม้สักต้น' },
    body: { th: 'เจ๊ข่าวไวไปขอดูสวนต้นไม้ด่าง เจอแต่ต้นพลูด่างหนึ่งกระถางที่ซื้อจากตลาดนัดเมื่อวาน' },
    choices: [
      {
        text: { th: 'บอกว่าเพิ่งขายหมดเมื่อเช้า' },
        outcomes: [
          {
            text: { th: 'ข่าวภาคค่ำพาดหัวว่า “ต้นไม้ล่องหน”' },
            effects: [{ kind: 'add', stat: 'heat', value: 20 }],
          },
        ],
      },
      {
        text: { th: '[ทนาย] ส่งทนายขู่ฟ้อง' },
        requires: { upgrades: ['lucky_lawyer'] },
        outcomes: [
          {
            text: { th: 'สถานีถอดข่าว แต่ชาวเน็ตเซฟไว้แล้ว' },
            effects: [{ kind: 'add', stat: 'heat', value: -5 }],
          },
        ],
      },
      {
        text: { th: '[ดาราตกอับ] ร้องไห้ออกกล้องแบบมืออาชีพ' },
        requires: { characters: ['fallen_star'] },
        outcomes: [
          {
            text: { th: 'น้ำตาระดับรางวัลตุ๊กตาทอง คนดูสงสารทั้งประเทศ' },
            effects: [
              { kind: 'add', stat: 'heat', value: -15 },
              { kind: 'add', stat: 'fame', value: 10 },
            ],
          },
        ],
      },
    ],
  },
  // ---- แม่มาเยี่ยม (ต่อจากโทรผิดไปหาแม่) ----
  {
    id: 'mom_visit',
    category: 'karma',
    weight: 8,
    when: { flagsAll: ['mom_knows'] },
    title: { th: 'แม่มาเยี่ยมห้องเช่าพร้อมปิ่นโต' },
    body: {
      th: 'แม่นั่งรถทัวร์มาเยี่ยม เปิดประตูมาเจอกองซิมการ์ดกับกล่องเปล่า แม่วางปิ่นโตลงแล้วถามว่า “ยังทำอยู่อีกเหรอ”',
    },
    choices: [
      {
        text: { th: 'สัญญากับแม่ว่าจะเลิก' },
        outcomes: [
          {
            text: { th: 'แม่จับมือคุณแน่น แกงเขียวหวานในปิ่นโตยังอุ่นอยู่' },
            effects: [
              { kind: 'add', stat: 'karma', value: 15 },
              { kind: 'flag', flag: 'promised_family' },
            ],
          },
        ],
      },
      {
        text: { th: 'บอกว่าเป็นงานแพ็กของออนไลน์' },
        outcomes: [
          {
            text: { th: 'แม่ช่วยพับกล่องทั้งบ่าย และพับเก่งกว่าลูกน้องทุกคน' },
            effects: [
              { kind: 'add', stat: 'karma', value: -6 },
              { kind: 'modifier', target: 'income', methodId: 'fake_shop', pct: 30, days: 2 },
            ],
          },
        ],
      },
    ],
  },
];
