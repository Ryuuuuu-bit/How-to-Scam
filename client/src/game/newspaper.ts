import type { DayLog, GameContent, GameState } from '@hts/shared';
import { newspaperMeme } from './memes';
import { openingStories } from './openingStories';
import type { Meme } from './memes';

export interface DailyArticle {
  day: number;
  headline: string;
  body: string;
  image: string;
  events: string[];
  caption: string;
  meme: Meme | null;
}

const headlines: Record<string, string> = {
  soi_football: 'ลีกปากซอยคนดูแน่นสนาม ลุงข้างโต๊ะยืนยัน “ไม่ได้ลุ้นบอล ลุ้นเก้าอี้พลาสติกว่าจะหักไหม”',
  mystery_stall: 'ร้านกล่องสุ่มขายดี ลูกค้ารีวิวห้าดาว “ของข้างในให้แฟน กล่องให้แมว คุ้มทั้งบ้าน”',
  cat_dub: 'คลิปแมวพากย์ไทยดังยกซอย คนจ้างถามคิวต่อไป เจ้าตัวนอนทับตารางงาน',
  fake_shop: 'พัสดุถึงมือ เปิดกล่องเจอแต่อากาศ ลูกค้าถาม “สั่งหม้อทอดหรือสั่งลม?”',
  romance: 'รักแท้แพ้ยอดโอน คนคุยอ่านแล้วเงียบ แต่สลิปยังอยู่',
  call_center: 'สายเรียกเข้าปริศนา ทำชาวเมืองไม่กล้ารับแม้แต่สายแม่',
  foundation: 'กล่องบริจาคสะเทือน ชาวเน็ตถามหาใบเสร็จพร้อมกัน',
  merit: 'งานบุญคนแน่นวัด พอถามยอดทำบุญ คนถือบัญชีหายไปไหน?',
  gambling: 'เหรียญดังทั้งซอย เจ้าของตู้บอกเป็นเสียงแห่งความหวัง',
  ponzi: 'ผลตอบแทนสูงจนปลาทองยังเลิกว่ายแล้วมาลงทุน',
};

/** Derive the paper from completed, public day logs. Never consume game RNG or reveal hidden state. */
export function dailyArticles(state: GameState, content: GameContent): DailyArticle[] {
  return state.history
    .filter((log) => log.day < state.day || state.phase === 'ended')
    .map((log) => articleFor(log, content));
}

function articleFor(log: DayLog, content: GameContent): DailyArticle {
  const method = content.methods.find((m) => m.id === log.methodId);
  const money = (n: number) => n.toLocaleString('th-TH');
  const events = log.events
    .map((id) => content.events.find((e) => e.id === id)?.title.th)
    .filter((s): s is string => !!s);
  const momShared = log.day === 1 && log.methodId === 'fake_shop';
  if (momShared) events.push('แม่: “แม่แชร์ร้านให้แล้วนะลูก” คุณ: “ขอบคุณนะแม่ แชร์ไปกลุ่มไหนอะ?” แม่: “กลุ่มเตือนภัยจ้ะ”');
  if (log.natFirstPay) events.push('นัท: “เฮีย ขอหนังสือรับรองเงินเดือนหน่อย” เฮีย: “จะยื่นกู้เหรอ?” นัท: “เอาให้แม่ดูครับ แม่ไม่เชื่อว่าที่นี่จ่ายจริง”');
  const headline = log.methodId
    ? (headlines[log.methodId] ?? 'เมืองนี้มีเรื่องเล่าใหม่อีกแล้ว')
    : 'เมืองเงียบผิดปกติ! ชาวบ้านรับสายแล้วไม่มีใครขายฝัน';
  const body = method
    ? `ผู้สื่อข่าวประจำซอยรายงานว่า งาน “${method.name.th}” วันนี้ทำเงินได้ ฿${money(log.income)} ค่า Heat เพิ่ม ${log.heatGained} หน่วย ${log.launderSuccess === true ? `ฟอกเงินได้ ฿${money(log.laundered)}` : log.launderSuccess === false ? 'ฟอกเงินพลาด คราวนี้คนทั้งซอยเริ่มซุบซิบ' : 'ยังไม่มียอดฟอกเงิน'}`
    : 'วันนี้ตัวเอกพักงาน ชาวเมืองจึงได้พักหายใจ แต่ข่าวลือในซอยยังไม่เคยหยุดพัก';
  return {
    day: log.day,
    headline,
    body,
    events,
    image: method ? `newsphoto:${method.id}` : 'icon:rest',
    caption: method ? method.name.th : 'วันพักของตัวเอก',
    meme: newspaperMeme(log),
    ...(method?.cleanIncome && { body: `ค่าพากย์วันนี้ ฿${money(log.income)} เข้ากระเป๋าเงินสะอาด ช่างเสียงเก็บไมค์แล้ว แต่นักแสดงยังนอนทับสายอยู่` }),
    ...(momShared && { headline: 'เปิดร้านวันแรก แม่ช่วยแชร์ให้แล้ว', caption: 'ร้านดังในกลุ่มไลน์ของแม่' }),
    ...(log.natFirstPay && { headline: 'นัทได้เงินเดือนครั้งแรก ขอใบรับรองให้แม่ดู', image: 'shop:intern_nat', caption: 'น้องนัท เด็กฝึกงาน' }),
    ...(log.opening && { headline: openingStories[log.opening][log.methodId ? 'workNews' : 'quietNews'] }),
    ...(log.interview === 'henchman' && {
      headline: 'โฆษกปากซอยยืนยัน ยังไม่ทราบว่าบริษัททำอะไร',
      body: 'เมื่อวานคุณส่งลูกน้องออกกล้อง เขาขอให้สถานีขึ้นชื่อว่า “โฆษกประจำซอย” พอเจ๊ถามว่าบริษัททำอะไร เขาหันไปถามตากล้องอีกที คลิปดังข้ามคืน ทั้งแฟนคลับและสายตรวจกำลังตามหาเขา',
      image: 'scene:ev_reporter_aunt',
      caption: 'เจ๊ข่าวไวกับไมค์เจ้าปัญหา',
      meme: null,
    }),
    ...(log.interview === 'cat' && {
      headline: 'โฆษกส้มงับไมค์กลางรายการ ต้นสังกัดชี้แจงว่าถึงเวลางีบ',
      body: 'เมื่อวานคุณอุ้มแมวส้มออกกล้อง เจ๊ถามเรื่องรายได้สามครั้ง แขกรับเชิญตอบด้วยการหาวสามที เช้านี้หน้าร้านมีปลาทูแขวนอยู่หนึ่งถุง พร้อมจดหมายขอลายอุ้งเท้า',
      image: 'char:orange_cat',
      caption: 'แขกรับเชิญหลังจบรายการ',
      meme: null,
    }),
    ...(log.liveCat === 'sale' && {
      headline: 'หม้อทอดขายออกแล้ว เจ๊คอนเฟิร์ม “คนถามกี่ลิตรเขาซื้อจริง”',
      body: 'กล้องจับหม้อทอดเต็มเฟรมจนปิดยอดได้ ส่วนส้มซ่าหลับอยู่ข้างกล้องจนจบไลฟ์',
      image: 'method:fake_shop', caption: 'หม้อทอดใบสุดท้าย', meme: null,
    }),
    ...((log.liveCat === 'stay' || log.liveCat === 'lift') && {
      headline: log.liveCat === 'stay'
        ? 'รีวิวร้านเจ๊ “แมวน่ารักมากค่ะ ส่วนของที่ขายจำไม่ได้”'
        : 'เจ๊อุ้มแมวออก แฟนคลับออกตาม เหลือคนดูแปดคนเท่าเดิม',
      body: log.liveCat === 'stay'
        ? 'ลูกค้าขอให้ไลฟ์เวลาเดิมพรุ่งนี้ เจ๊บอกว่าร้านเปิดสิบโมง ลูกค้าบอก “ถามเวลาน้องตื่นค่ะ”'
        : 'เจ๊ยืนยันว่ารอบหน้ามีหม้อทอดเหมือนเดิม ส่วนแมวต้องถามเจ้าตัวก่อน',
      image: 'char:orange_cat', caption: 'ส้มซ่า ดาวประจำไลฟ์', meme: null,
    }),
  };
}

export function paperReadKey(seed: string, day: number): string {
  return `hts.paper.v1.${seed}.${day}`;
}
export function paperWasRead(seed: string, day: number): boolean {
  try {
    return localStorage.getItem(paperReadKey(seed, day)) === 'read';
  } catch {
    return false;
  }
}
export function markPaperRead(seed: string, day: number): void {
  try {
    localStorage.setItem(paperReadKey(seed, day), 'read');
  } catch {
    /* The paper still opens without storage. */
  }
}
