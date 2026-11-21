import type { Character } from '../src/types/content';

// อาชีพที่เล่นได้ — ทุกอาชีพมีจุดเด่น ข้อเสีย และเหตุการณ์เฉพาะตัว
// unlockXp = ต้องสะสมแต้มประสบการณ์แก๊งเท่านี้ก่อน (ไม่ใส่ = เปิดตั้งแต่แรก)
export const characters: Character[] = [
  {
    id: 'ex_insurance',
    perks: [
      { kind: 'methodIncome', methodId: 'call_center', pct: 20 },
      { kind: 'methodHeat', methodId: 'call_center', pct: 15 },
    ],
    name: { th: 'อดีตเซลส์ประกัน' },
    desc: { th: 'พูดได้ 3 ชั่วโมงไม่หายใจ เคยขายประกันชีวิตให้ตุ๊กแก' },
    pros: { th: 'คอลเซ็นเตอร์ +20%' },
    cons: { th: 'พูดมากเกิน Heat คอลเซ็นเตอร์ +15%' },
  },
  {
    id: 'gamer_kid',
    perks: [
      { kind: 'methodIncome', methodId: 'gambling', pct: 20 },
      { kind: 'methodIncome', methodId: 'romance', pct: 10 },
    ],
    name: { th: 'เด็กติดเกม' },
    desc: { th: 'นอนวันละ 2 ชั่วโมง ที่เหลือกดกาชา เข้าใจจิตใจนักพนันดีที่สุด' },
    pros: { th: 'เว็บพนัน +20%, หลอกรัก +10%' },
    cons: { th: 'ทำงานติดกันนานเกินไปจะหลับคาคีย์บอร์ด' },
  },
  {
    id: 'temple_kid',
    perks: [
      { kind: 'methodIncome', methodId: 'merit', pct: 25 },
      { kind: 'karmaMul', mul: 1.3 },
    ],
    name: { th: 'ลูกศิษย์วัดสายเทา' },
    desc: { th: 'โตมากับงานวัด รู้ว่างานไหนคนใจบุญเยอะ แต่ดันเอาความรู้ไปใช้ผิดทาง' },
    pros: { th: 'จัดงานบุญอีเวนต์ +25%' },
    cons: { th: 'รู้สึกผิดง่าย ทำเรื่องไม่ดีแล้วกรรมหนักกว่าคนอื่น' },
  },
  {
    id: 'live_seller',
    perks: [
      { kind: 'methodIncome', methodId: 'fake_shop', pct: 25 },
      { kind: 'startFame', value: 10 },
      { kind: 'fameHeat', pctPer10Fame: 3 },
    ],
    name: { th: 'เจ๊ไลฟ์ไม่หยุด' },
    desc: { th: 'แม่ค้าไลฟ์สดเสียงดังที่สุดในตำบล "ซื้อเลยค่ะ ของจะหมดแล้ว" ตั้งแต่ 6 โมงเช้า' },
    pros: { th: 'ขายของไม่ส่ง +25%, เริ่มเกมดังนิดๆ' },
    cons: { th: 'ยิ่งดัง Heat ยิ่งขึ้นไว' },
  },
  {
    id: 'phone_tech',
    perks: [
      { kind: 'shopDiscount', itemIds: ['sim_pack', 'new_phone'], pct: 50 },
      { kind: 'methodHeat', methodId: 'call_center', pct: -15 },
      { kind: 'methodIncome', methodId: 'romance', pct: -20 },
    ],
    name: { th: 'หนุ่มช่างมือถือปากซอย' },
    desc: { th: 'ซ่อมได้ทุกอย่างยกเว้นหัวใจตัวเอง ร้านเปิดตั้งแต่สิบโมงจนกว่าจะเบื่อ' },
    pros: { th: 'ซิมและมือถือราคาครึ่งเดียว, Heat คอลเซ็นเตอร์ -15%' },
    cons: { th: 'คุยหวานไม่เป็น หลอกรัก -20%' },
  },
  {
    id: 'fortune_teller',
    unlockXp: 60,
    perks: [
      { kind: 'revealWeakness', weaknesses: ['faith', 'fear'] },
      { kind: 'methodIncome', methodId: 'merit', pct: 10 },
      { kind: 'karmaMul', mul: 1.2 },
    ],
    name: { th: 'อาจารย์ดวงเฮง' },
    desc: { th: 'หมอดูไพ่ทาโรต์ออนไลน์ เปิดไพ่ใบไหนก็ออก "จะมีโชคลาภ ถ้าโอนค่าครูก่อน"' },
    pros: { th: 'มองออกทันทีว่าเหยื่อกลัวหรือศรัทธา' },
    cons: { th: 'หลอกคนที่เชื่อใจ กรรมหนักขึ้น' },
  },
  {
    id: 'rich_coach',
    unlockXp: 120,
    perks: [
      { kind: 'methodIncome', methodId: 'ponzi', pct: 25 },
      { kind: 'startFame', value: 30 },
      { kind: 'ponziRisk', mul: 1.4 },
    ],
    name: { th: 'โค้ชรวยเร็ว' },
    desc: { th: 'อินฟลูฯ สายสัมมนา ขายคอร์ส "รวยใน 7 วัน" (วันที่ 8 โค้ชหาย)' },
    pros: { th: 'แชร์ลูกโซ่ +25%, เริ่มเกมดังมาก' },
    cons: { th: 'แชร์ลูกโซ่ล่มไวกว่าคนอื่น ×1.4' },
  },
  {
    id: 'fallen_star',
    unlockXp: 180,
    perks: [
      { kind: 'methodIncome', methodId: 'foundation', pct: 50 },
      { kind: 'startFame', value: 25 },
      { kind: 'eventWeight', eventIds: ['social_detective', 'reporter_aunt'], mul: 3 },
    ],
    name: { th: 'พี่เก่ง ดาราตกอับยุค 90' },
    desc: { th: 'เคยเล่นพระเอกละครหลังข่าว ตอนนี้รับงานตัดริบบิ้นร้านลูกชิ้น' },
    pros: { th: 'มูลนิธิ +50%, คนจำได้' },
    cons: { th: 'นักสืบโซเชียลกับนักข่าวตามติดเป็นพิเศษ' },
  },
  {
    id: 'ex_banker',
    unlockXp: 250,
    perks: [
      { kind: 'launderOffer', extra: 1 },
      { kind: 'launderSuccess', pct: 10 },
      { kind: 'launderFailHeat', mul: 1.5 },
    ],
    name: { th: 'คุณวิไล อดีตพนักงานแบงก์ไทยใจถึง' },
    desc: { th: 'ทำงานเคาน์เตอร์มา 20 ปี จำได้ทุกช่องโหว่ และทุกหน้าลูกค้า' },
    pros: { th: 'เห็นการ์ดฟอกเงิน 4 ใบ, สำเร็จ +10%' },
    cons: { th: 'ฟอกพังเมื่อไหร่ Heat ×3' },
  },
  {
    id: 'share_auntie',
    unlockXp: 320,
    perks: [
      { kind: 'methodIncome', methodId: 'ponzi', pct: 15 },
      { kind: 'victimWealth', pct: 25 },
      { kind: 'karmaMul', mul: 1.2 },
    ],
    name: { th: 'ป้าแชร์วงทอง' },
    desc: { th: 'เหรัญญิกประจำซอย เปิดวงแชร์มาตั้งแต่ยุคเพจเจอร์ รู้ว่าบ้านไหนมีเงินเก็บ' },
    pros: { th: 'เหยื่อมีเงินมากขึ้น 25%, แชร์ลูกโซ่ +15%' },
    cons: { th: 'Karma ต่ำเมื่อไหร่ เพื่อนบ้านรวมตัวแฉ' },
  },
  {
    id: 'orange_cat',
    unlockEnding: 'redeemed',
    perks: [
      { kind: 'chaos', min: 0.4, max: 3 },
      { kind: 'bannedMethod', methodId: 'call_center' },
    ],
    name: { th: 'ส้มซ่า แมวส้มสายโกง' },
    desc: { th: 'แมวส้มที่เดินบนคีย์บอร์ดแล้วบังเอิญเปิดเพจขายของได้ ไม่มีใครรู้ว่ามันคิดอะไร' },
    pros: { th: 'รายได้ทุกงานสุ่ม ×0.4 ถึง ×3' },
    cons: { th: 'ไม่มีนิ้ว ใช้คอลเซ็นเตอร์ไม่ได้' },
  },
];
