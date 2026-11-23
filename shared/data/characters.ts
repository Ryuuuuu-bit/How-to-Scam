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
    desc: { th: 'พูดได้สามชั่วโมงไม่พัก เคยขายประกันให้ตุ๊กแกได้ตัวนึง' },
    pros: { th: 'คอลเซ็นเตอร์ +20%' },
    cons: { th: 'คุยเพลินจนมีพิรุธ งานคอลเซ็นเตอร์เพิ่ม Heat มากขึ้น 15%' },
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
    desc: { th: 'โตมากับงานวัด รู้แม้กระทั่งว่าตู้บริจาคไหนเต็มก่อน เสียดายที่ดันเอาดีผิดทาง' },
    pros: { th: 'รับจัดงานบุญ +25%' },
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
    pros: { th: 'ขายของไม่ส่งได้เงินเพิ่ม 25% มีคนรู้จักบ้างตั้งแต่วันแรก' },
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
    perks: [
      { kind: 'methodIncome', methodId: 'ponzi', pct: 25 },
      { kind: 'startFame', value: 30 },
      { kind: 'ponziRisk', mul: 1.4 },
    ],
    name: { th: 'โค้ชรวยเร็ว' },
    desc: { th: 'อินฟลูฯ สายสัมมนา ขายคอร์ส "รวยใน 7 วัน" (วันที่ 8 โค้ชหาย)' },
    pros: { th: 'แชร์ลูกโซ่ +25%, เริ่มเกมดังมาก' },
    cons: { th: 'โอกาสที่วงแชร์จะล่มสูงกว่าปกติ 1.4 เท่า' },
  },
  {
    id: 'fallen_star',
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
    perks: [
      { kind: 'launderOffer', extra: 1 },
      { kind: 'launderSuccess', pct: 10 },
      { kind: 'launderFailHeat', mul: 1.5 },
    ],
    name: { th: 'คุณวิไล อดีตพนักงานแบงก์ไทยใจถึง' },
    desc: { th: 'อยู่หน้าเคาน์เตอร์มา 20 ปี จำหน้าลูกค้าได้แม่นพอ ๆ กับช่องโหว่ในระบบ' },
    pros: { th: 'เห็นการ์ดฟอกเงิน 4 ใบ, สำเร็จ +10%' },
    cons: { th: 'ฟอกพังเมื่อไหร่ Heat ×3' },
  },
  {
    id: 'share_auntie',
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
    perks: [
      { kind: 'chaos', min: 0.4, max: 3 },
      { kind: 'bannedMethod', methodId: 'call_center' },
    ],
    name: { th: 'ส้มซ่า แมวส้มสายโกง' },
    desc: { th: 'แมวส้มที่เดินบนคีย์บอร์ดแล้วบังเอิญเปิดเพจขายของได้ ไม่มีใครรู้ว่ามันคิดอะไร' },
    pros: { th: 'รายได้ทุกงานสุ่ม ×0.4 ถึง ×3' },
    cons: { th: 'อุ้งเท้ากดโทรออกได้ แต่ปลายสายฟังภาษาแมวไม่ออก ทำงานคอลเซ็นเตอร์ไม่ได้' },
  },
  {
    id: 'foundation_chief', unlockXp: 60,
    name: { th: 'พี่เก่งบ้าพลัง' },
    desc: { th: 'ผู้ก่อตั้งมูลนิธิแรงเหลือ แค่ถามว่าช่วยยกโต๊ะหน่อยได้ไหม พี่ยกมาทั้งโต๊ะทั้งคนกินข้าว' },
    pros: { th: 'เปิดมูลนิธิได้ตั้งแต่วันแรก รายได้จากมูลนิธิเพิ่ม 20%' },
    cons: { th: 'ออกกล้องทุกงาน ทำงานมูลนิธิแล้ว Heat เพิ่มมากขึ้น 20%' },
    perks: [
      { kind: 'earlyMethod', methodId: 'foundation' },
      { kind: 'methodIncome', methodId: 'foundation', pct: 20 },
      { kind: 'methodHeat', methodId: 'foundation', pct: 20 },
    ],
  },
  {
    id: 'grey_lawyer', unlockXp: 120,
    name: { th: 'ทนายสายเทา' },
    desc: { th: 'พกแฟ้มขึ้นศาลสามเล่ม เล่มแรกใส่สำนวน เล่มสองใส่ใบเสร็จ เล่มสามรวมร้านข้าวรอบศาล' },
    pros: { th: 'โอกาสฟอกเงินสำเร็จเพิ่ม 10 จุดเปอร์เซ็นต์' },
    cons: { th: 'ถ้าฟอกเงินพลาด Heat จากความล้มเหลวเพิ่มเป็น 1.5 เท่า' },
    perks: [{ kind: 'launderSuccess', pct: 10 }, { kind: 'launderFailHeat', mul: 1.5 }],
  },
  {
    id: 'ex_inmate', unlockXp: 180,
    name: { th: 'อดีตนักโทษ' },
    desc: { th: 'ฝึกงานไม้จนได้เรื่อง พอกลับบ้านตั้งใจจะทำเก้าอี้ขาย เจอลูกค้าคนแรกขอผ่อนสิบงวด' },
    pros: { th: 'ตั้งแผงกล่องสุ่มได้เงินเพิ่ม 25%' },
    cons: { th: 'พูดตรงจนหยอดใครไม่เป็น รายได้จากงานหลอกรักลดลง 15%' },
    perks: [{ kind: 'methodIncome', methodId: 'mystery_stall', pct: 25 }, { kind: 'methodIncome', methodId: 'romance', pct: -15 }],
  },
];
