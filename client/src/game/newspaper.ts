import type { DayLog, GameContent, GameState } from '@hts/shared';
import { newspaperMeme } from './memes';
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
  fake_shop: 'พัสดุมาถึงแล้ว! เปิดกล่องพบแต่อากาศอัดแน่น',
  romance: 'รักแท้แพ้ยอดโอน ชาวเมืองเริ่มกอดมือถือแทนคนรัก',
  call_center: 'สายเรียกเข้าปริศนา ทำชาวเมืองไม่กล้ารับแม้แต่สายแม่',
  foundation: 'กล่องบริจาคสะเทือน ชาวเน็ตถามหาใบเสร็จพร้อมกัน',
  merit: 'งานบุญคึกคัก แต่บัญชีรายรับยังหาทางกลับบ้านไม่เจอ',
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
  const headline = log.methodId
    ? (headlines[log.methodId] ?? 'เมืองนี้มีเรื่องเล่าใหม่อีกแล้ว')
    : 'เมืองเงียบผิดปกติ! ชาวบ้านรับสายแล้วไม่มีใครขายฝัน';
  const body = method
    ? `ผู้สื่อข่าวสมมติรายงานกิจกรรม “${method.name.th}” มียอดเงินเข้า ฿${money(log.income)} และระดับการจับตาเพิ่ม ${log.heatGained} หน่วย ${log.launderSuccess === true ? `มีเงินผ่านการฟอก ฿${money(log.laundered)} ทิ้งร่องรอยให้ติดตามต่อ` : log.launderSuccess === false ? 'ความพยายามฟอกเงินไม่สำเร็จ ข่าวลือจึงเริ่มหนาหู' : 'ยังไม่มีรายงานการฟอกเงินสำเร็จ'}`
    : 'วันนี้ตัวเอกพักงาน ชาวเมืองจึงได้พักหายใจ แต่ข่าวลือในซอยยังไม่เคยหยุดพัก';
  return {
    day: log.day,
    headline,
    body,
    events,
    image: method ? `newsphoto:${method.id}` : 'icon:rest',
    caption: method ? method.name.th : 'วันพักของตัวเอก',
    meme: newspaperMeme(log),
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
