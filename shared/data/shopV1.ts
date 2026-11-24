import type { ShopItem } from '../src/types/content';

// 1.0 ร้านอัปเกรดใหม่ (เฉพาะรอบที่เป็นซอยมีชีวิต)
//  app     = แอปติดมือถือ ซื้อครั้งเดียว ขึ้นบน dock
//  market  = ตลาดมืด สุ่มวาง 3 ช่องทุกคืน
//  place   = ของประจำสถานที่ ปลดเมื่อสถานที่นั้นเปลี่ยนร่าง
//  hideout = ห้องลับ อัปเกรดได้สามขั้น

const app = (id: string, price: number, name: string, desc: string): ShopItem => ({
  id, kind: 'permanent', line: 'app', price, maxStack: 1, name: { th: name }, desc: { th: desc },
});

export const appItems: ShopItem[] = [
  app('app_shredder', 5_000, 'แอปเครื่องย่อยกระดาษ', 'ทำลายหลักฐานบนบอร์ดคดีถูกลงครึ่งหนึ่ง'),
  app('app_scanner', 7_000, 'แอปสายในโรงพัก', 'เตือนก่อนคืนที่สารวัตรจะบุก และถ้าโดนบุก เงินถูกยึดแค่ครึ่งเดียว'),
  app('app_case', 4_000, 'เคสกันกระแทก', 'ล้มกี่ทีมือถือก็ไม่แตก โอกาสหนีตำรวจรอด +10%'),
  app('app_chat', 6_000, 'แอปแชทลับ', 'ลูกน้องคุยกันในกลุ่มลับ ความภักดีลดช้าลงตอน Heat สูง'),
];

const market = (
  id: string,
  price: number,
  name: string,
  desc: string,
  extra: Partial<ShopItem> = {},
): ShopItem => ({ id, kind: 'permanent', line: 'market', price, maxStack: 1, name: { th: name }, desc: { th: desc }, ...extra });

export const marketItems: ShopItem[] = [
  market('mk_laptop', 3_500, 'โน้ตบุ๊กมือสองจากโกดัง', 'สติกเกอร์เต็มฝา เทปกาวสามชั้น แต่เร็วกว่าที่คิด รายได้ +8% ถาวร', { incomePct: 8 }),
  market('mk_cctv_map', 1_800, 'แผนที่จุดบอดกล้อง', 'รู้ว่ากล้องตัวไหนเสีย หลักฐานเก่าสุดบนบอร์ดหายไป 2 ขั้น', { now: { clearEvidence: 2 } }),
  market('mk_charm', 1_200, 'เครื่องรางรุ่นทดลอง', 'คนขายบอกว่า “ยังไม่เคยมีใครโดนจับตอนใส่” Heat −6 และใจสบายขึ้น', { heatNow: 6, now: { karma: 1 } }),
  market('mk_fake_review', 2_500, 'รีวิวห้าดาวพันอัน', 'บอทหนึ่งพันตัวพร้อมกันชมคุณ ชื่อเสียง +3 ทันที', { now: { fame: 3 } }),
  market('mk_gift_basket', 2_000, 'กระเช้าขอโทษเพื่อนบ้าน', 'ส่งไปให้เพื่อนบ้านที่ไม่ค่อยชอบคุณที่สุด ความสัมพันธ์ +1', { now: { rep: 'lowest' } }),
  market('mk_sim_bulk', 2_800, 'ซิมยกลัง', 'เปลี่ยนเบอร์ได้ทุกชั่วโมงจนสิ้นปี Heat จากงาน −6% ถาวร', { heatPct: -6 }),
  market('mk_golden_mookata', 9_000, 'หมูกระทะทองคำ', 'เลี้ยงทั้งซอยบนกระทะทองคำ เพื่อนบ้านทุกคน +1 และชื่อเสียง +5', { rare: true, now: { rep: 'all', fame: 5 } }),
  market('mk_inspector_photo', 8_000, 'รูปลับสารวัตร', 'สารวัตรแอบกินหมูกระทะฟรี รูปนี้ทำให้เขาต้องคิดหนักก่อนขอหมาย สารวัตรต้องมีหลักฐานเพิ่ม 2 ขั้นถึงจะบุก', { rare: true }),
  market('mk_vintage_phone', 12_000, 'โทรศัพท์อิฐในตำนาน', 'ทุบไม่แตก ดักฟังไม่ได้ แบตอยู่ได้หนึ่งเดือน รายได้ +12% และ Heat −5% ถาวร', { rare: true, incomePct: 12, heatPct: -5 }),
  market('mk_lucky_cat', 6_500, 'แมวกวักใส่ถ่านไม่หมด', 'กวักทั้งคืนไม่มีพัก วันที่พักงาน Heat ลดเพิ่มอีก 3', { rare: true }),
];

const place = (
  id: string,
  placeId: string,
  form: 'patron' | 'local' | 'show',
  methodIds: string[],
  name: string,
  flavor: string,
): ShopItem => {
  const effect =
    form === 'patron'
      ? { incomePct: 25, heatPct: 10, price: 6_000, text: 'รายได้ +25% แต่ Heat +10%' }
      : form === 'local'
        ? { heatPct: -25, price: 4_500, text: 'Heat −25% และใจคุณดีขึ้นนิดหนึ่ง' }
        : { incomePct: 10, famePerShift: 1, price: 5_000, text: 'รายได้ +10% และชื่อเสียง +1 ทุกกะ' };
  const { text, price, ...fx } = effect;
  return {
    id, kind: 'permanent', line: 'place', price, maxStack: 1, methodIds, unlock: { place: placeId, form },
    ...(form === 'local' ? { now: { karma: 1 } } : {}),
    ...fx,
    name: { th: name },
    desc: { th: `${flavor} งานในย่านนี้${text}` },
  };
};

const M = ['fake_shop', 'mystery_stall'];
const T = ['merit', 'foundation'];
const F = ['soi_football', 'gambling'];
const D = ['call_center', 'romance'];
const K = ['ponzi', 'cat_dub'];

export const placeItems: ShopItem[] = [
  place('pl_market_patron', 'market', 'patron', M, 'แผงหน้าประตูไนต์มาร์เก็ต', 'ทำเลทองที่นายทุนกันไว้ให้คนจ่ายถึง'),
  place('pl_market_local', 'market', 'local', M, 'บัตรสมาชิกครัวชุมชน', 'แม่ค้าทั้งตลาดช่วยกันดูต้นทางให้'),
  place('pl_market_show', 'market', 'show', M, 'สปอตไลต์ลานฉายหนัง', 'ขายของช่วงพักหนัง คนดูทั้งลานหันมามอง'),
  place('pl_temple_patron', 'temple', 'patron', T, 'ตู้โชว์เครื่องรางติดแอร์', 'นักสะสมจากในเมืองแวะมาทุกเย็น'),
  place('pl_temple_local', 'temple', 'local', T, 'ทัพพีโรงทาน', 'ตักข้าวต้มให้ใครก็ได้ คนในซอยเลยไม่ค่อยถามว่าเงินมาจากไหน'),
  place('pl_temple_show', 'temple', 'show', T, 'ชฎาลิเกปักเลื่อม', 'ขึ้นเวทีงานวัดทีไร คนจำหน้าได้ทั้งซอย'),
  place('pl_field_patron', 'field', 'patron', F, 'สายรัดข้อมือวีไอพีสนามหญ้าเทียม', 'ทีมบริษัทเชิญไปเตะด้วย แล้วก็ชวนลงทุนกันในห้องแต่งตัว'),
  place('pl_field_local', 'field', 'local', F, 'เสื้อสปอนเซอร์ลีกเด็ก', 'โลโก้คุณอยู่บนหน้าอกเด็กทั้งลีก ใครจะกล้าแจ้งความ'),
  place('pl_field_show', 'field', 'show', F, 'ไมค์พากย์จอยักษ์', 'พากย์บอลสดหน้าจอยักษ์ แทรกโฆษณาตัวเองช่วงพักครึ่ง'),
  place('pl_dorm_patron', 'dorm', 'patron', D, 'คีย์การ์ดคอนโดรายวัน', 'ห้องใหม่ทุกคืน ไม่มีใครจำหน้าได้'),
  place('pl_dorm_local', 'dorm', 'local', D, 'กุญแจห้องมิตรภาพ', 'ป้าสมใจเก็บห้องไว้ให้ ใครมาถามก็บอกว่าไม่รู้จัก'),
  place('pl_dorm_show', 'dorm', 'show', D, 'ไฟวงแหวนบนดาดฟ้า', 'ไลฟ์จากดาดฟ้า แสงสวยจนคนดูลืมถามเรื่องสินค้า'),
  place('pl_mookata_patron', 'mookata', 'patron', K, 'บัตรห้องวีไอพีชั้นสอง', 'ประตูปิดสนิท ดีลใหญ่ไม่มีใครได้ยิน'),
  place('pl_mookata_local', 'mookata', 'local', K, 'เก้าอี้ประจำโต๊ะยาว', 'นั่งข้างสารวัตรทุกเย็น เขาเลยเกรงใจคุณนิดหนึ่ง'),
  place('pl_mookata_show', 'mookata', 'show', K, 'แมวผู้จัดการร้าน', 'แมวส้มผูกโบว์รับแขก ลูกค้าถ่ายรูปแล้วแท็กร้านทุกคน'),
];

export const hideoutItem: ShopItem = {
  id: 'hideout',
  kind: 'permanent',
  line: 'hideout',
  price: 5_000,
  tierPrices: [5_000, 15_000, 40_000],
  maxStack: 3,
  name: { th: 'ห้องลับ' },
  desc: { th: 'ย้ายฐานให้ใหญ่ขึ้นทีละขั้น ทุกขั้นมีของดีเพิ่ม' },
};

/** ชื่อและผลของห้องลับแต่ละขั้น (ขั้น 0 = ห้องแถวตอนเริ่มเกม) */
export const hideoutTiers = [
  { name: 'ห้องแถวชั้นเดียว', perk: 'จุดเริ่มต้น พัดลมตัวเดียว กับความฝันอีกเต็มห้อง' },
  { name: 'ห้องเช่าหลังร้านหมูกระทะ', perk: 'จ้างลูกน้องได้เพิ่ม 1 คน · Heat จากงาน −5%' },
  { name: 'ทาวน์โฮมสองชั้นท้ายซอย', perk: 'วันที่พักงาน Heat ลดเพิ่มอีก 3 · ชื่อเสียง +3' },
  { name: 'คอนโดลับชั้น 30', perk: 'จ้างลูกน้องได้เพิ่มอีก 1 คน · สารวัตรต้องมีหลักฐานเพิ่ม 2 ขั้นถึงจะบุก · รายได้ +5%' },
] as const;

export const shopV1Items: ShopItem[] = [...appItems, ...marketItems, ...placeItems, hideoutItem];
