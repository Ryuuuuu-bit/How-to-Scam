import type { GameContent } from '../types/content';
import type { GameState } from '../types/state';
import { invariant } from './errors';
import { methodBlock } from './day';

export type CareerBranch = 'face' | 'boss';
// Two decisions for each commission. The first favours the patron, the second the neighbourhood.
export const careerDecisions: Record<string, Record<CareerBranch, [string, string]>> = {
  fake_shop: { face: ['ยกไมค์ให้สปอนเซอร์ไลฟ์', 'ให้ลูกค้าคนแรกรับไมค์ก่อน'], boss: ['กันพื้นที่ให้ร้านใหญ่', 'แบ่งชั้นวางให้ร้านเล็ก'] },
  romance: { face: ['รับคำท้าขึ้นรายการสด', 'เก็บชื่อคนโทรไว้เป็นความลับ'], boss: ['ให้ดาวดังครองช่วงไพรม์ไทม์', 'แบ่งคิวให้เด็กใหม่ลองพูด'] },
  call_center: { face: ['ขึ้นเวทีเลียนเสียงตัวเอง', 'ยกเวลาให้คนที่เคยรับสาย'], boss: ['มอบห้องใหญ่ให้กะทำเงิน', 'จัดห้องพักให้กะดึก'] },
  soi_football: { face: ['รับคำท้านั่งพากย์ข้างทีมเยือน', 'ส่งไมค์ให้โค้ชทีมแพ้'], boss: ['ให้ทีมสปอนเซอร์ใช้สนามเย็น', 'แบ่งครึ่งสนามให้เด็กสองทีม'] },
  mystery_stall: { face: ['เปิดกล่องของเจ้าภาพก่อน', 'ให้คนดูเลือกกล่องจากหน้าแผง'], boss: ['ให้ร้านใหญ่จองหัวมุม', 'เก็บหัวมุมไว้ให้ร้านที่ถูกย้าย'] },
  cat_dub: { face: ['รับพากย์คู่มาสคอตเจ้าภาพ', 'ยกเวทีให้แมวจรประจำตลาด'], boss: ['ยกคิวทองให้ค่ายโฆษณา', 'เก็บคิวถ่ายให้บ้านรับเลี้ยงแมว'] },
  foundation: { face: ['อยู่ให้กล้องถ่ายจนจบงาน', 'ลงจากเวทีไปช่วยครัวเก็บของ'], boss: ['ส่งรถไปรับเจ้าภาพ', 'ให้ชุมชนใช้รถเที่ยวสุดท้าย'] },
  merit: { face: ['เรียกเจ้าภาพใหญ่ขึ้นเวทีก่อน', 'ต่อเวลาให้คณะเด็กท้ายวัด'], boss: ['ส่งรถเครื่องเสียงไปเวทีใหญ่', 'แบ่งลำโพงให้ขบวนงานเล็ก'] },
  gambling: { face: ['อยู่โชว์ตัวในรอบพิเศษ', 'เปิดเวทีให้คนทวงรางวัล'], boss: ['ยกห้องใหญ่ให้สปอนเซอร์', 'กันห้องไว้ให้ผู้เล่นที่รอพบทีมงาน'] },
  ponzi: { face: ['รับซองขึ้นเวทีปิดงาน', 'ให้ลูกศิษย์รุ่นแรกถามกลางห้อง'], boss: ['ยกห้องใหญ่ให้ผู้สนับสนุน', 'เปิดห้องให้คนที่ยังไม่ได้คำตอบ'] },
};
type Route = { title: string; commission: string; finale: string };
type Track = { rookie: string; regular: string; face: Route; boss: Route };
const route = (title: string, commission: string, finale: string): Route => ({ title, commission, finale });
export const careerTracks: Record<string, Track> = {
  fake_shop: { rookie: 'มือใหม่หลังร้าน', regular: 'คนดังหน้าฟีด', face: route('ดาวไลฟ์กล่องเปล่า','ออกหน้ารับเสียงโห่กลางไลฟ์','แฟนคลับตั้งโต๊ะรอเปิดกล่องใบสุดท้าย'), boss: route('เฮียโกดังปริศนา','ตัดสินข้อพิพาทของร้านในสังกัด','เจ้าของแผงทั้งซอยมารอฟังคำตัดสิน') },
  romance: { rookie: 'คนหลังรูปโปรไฟล์', regular: 'ดาวห้องแชต', face: route('ขวัญใจนิรนาม','รับสายแฟนรายการที่จำเสียงได้','ทั้งห้องส่งรอฟังว่าคุณจะเปิดเผยตัวไหม'), boss: route('เจ้าของค่ายคนในฝัน','จัดคิวดาวประจำค่ายที่แย่งเวลาออกอากาศ','ดาวรุ่นแรกกลับมาขอซื้อชื่อค่าย') },
  call_center: { rookie: 'เด็กใหม่โต๊ะโทรศัพท์', regular: 'เสียงคุ้นของซอย', face: route('เสียงทองโต๊ะหัวมุม','รับหน้าเมื่อเสียงตัวเองดังจากวิทยุ','คนทั้งสถานีจำเสียงคุณได้'), boss: route('หัวหน้าห้องสายป่วน','ไกล่เกลี่ยทีมสองกะที่ขอใช้ห้องเดียวกัน','โต๊ะหัวหน้าว่างและทุกคนหันมามองคุณ') },
  soi_football: { rookie: 'เด็กจดสกอร์', regular: 'เซียนขอบสนาม', face: route('เซียนบอลขวัญใจซอย','ออกไมค์หลังทายผลผิดนัดใหญ่','กองเชียร์ร้องฉายาคุณพร้อมกันทั้งอัฒจันทร์'), boss: route('เฮียหลังสนาม','แบ่งช่วงใช้สนามให้สองทีมคู่ปรับ','ผู้จัดลีกยื่นกุญแจสนามให้คุณกลางวงประชุม') },
  mystery_stall: { rookie: 'เด็กเฝ้าแผง', regular: 'ขาประจำตลาดลุ้น', face: route('ดาวกล่องวัดดวง','ขึ้นเวทีเปิดกล่องที่สปอนเซอร์เลือกมา','คนดูยกกล่องรุ่นแรกของคุณขึ้นพร้อมกัน'), boss: route('เจ้าตลาดกล่องปริศนา','ตัดสินเรื่องร้องเรียนของร้านลูกรัก','แม่ค้าทั้งตลาดรอให้คุณเปิดประตูแผงใหม่') },
  cat_dub: { rookie: 'มือพากย์ขาจร', regular: 'เสียงประจำตรอก', face: route('ดาวพากย์แมวปากจัด','พากย์สดแทนพิธีกรที่โดนแมวแย่งไมค์','เสียงแมวจากคลิปแรกดังขึ้นก่อนคุณขึ้นเวที'), boss: route('นายหน้าคิวแมวดัง','แบ่งคิวแมวตัวเดียวให้สองสตูดิโอ','แมวนั่งทับสัญญาเปิดค่ายจนทุกคนต้องรอ') },
  foundation: { rookie: 'เด็กยกป้ายมูลนิธิ', regular: 'ตัวเต็งงานบุญ', face: route('คนดังสายบุญ','รับไมค์กลางวงคนทวงคำสัญญา','คนในภาพวันเปิดตัวย้อนมาถามถึงคำสัญญาแรก'), boss: route('เจ้าพ่อมูลนิธิ','ตัดสินว่าใครได้รถเที่ยวสุดท้าย','เจ้าเก่าทั้งสามย่านมาทวงบุญคุณพร้อมกัน') },
  merit: { rookie: 'เด็กเดินซอง', regular: 'คนคุมคิวงานบุญ', face: route('ดาวไมค์เวทีบุญ','กู้หน้าเวทีเมื่อเจ้าภาพสองบ้านมาพร้อมกัน','เสียงประกาศชื่อคุณดังออกลำโพงทั้งวัด'), boss: route('เถ้าแก่สายรถแห่','แบ่งรถแห่คันสุดท้ายให้เจ้าภาพคู่แข่ง','สองขบวนมาหยุดรอคุณที่หัวสะพาน') },
  gambling: { rookie: 'เด็กเฝ้าหน้าจอ', regular: 'ขวัญใจวงลุ้น', face: route('ดาววงล้อหลังเที่ยงคืน','ขึ้นเวทีตอบคนดูที่ขอทวงรางวัล','ไฟทั้งงานดับ เหลือสปอตไลต์ที่คุณคนเดียว'), boss: route('เฮียหลังม่าน','ชี้ขาดเมื่อเจ้าภาพกับสปอนเซอร์ขัดใจกัน','หลังม่านมีเก้าอี้เหลือตัวเดียวพร้อมชื่อคุณ') },
  ponzi: { rookie: 'เด็กถือไมค์สัมมนา', regular: 'ดาวห้องสัมมนา', face: route('กูรูเหรียญลม','ขึ้นเวทีเผชิญหน้าลูกศิษย์รุ่นแรก','ลูกศิษย์วางเหรียญที่ระลึกรุ่นแรกไว้หน้าไมค์'), boss: route('เจ้าสัวโต๊ะสัมมนา','ตัดสินว่าใครได้ใช้ห้องประชุมใหญ่','ประตูห้องประชุมเปิดพร้อมเสียงคนเรียกหาคุณ') },
};

export const careerAffinities: Record<string, { method: string; talent: string }> = {
  ex_insurance: { method: 'call_center', talent: 'ผ่านงานรับสายลูกค้ามาแล้ว' },
  gamer_kid: { method: 'gambling', talent: 'อ่านบรรยากาศห้องเกมไว' },
  temple_kid: { method: 'merit', talent: 'คุ้นทางหลังเวทีงานวัด' },
  live_seller: { method: 'fake_shop', talent: 'คุมจังหวะไลฟ์เก่ง' },
  phone_tech: { method: 'call_center', talent: 'รู้จักโต๊ะโทรศัพท์ทุกตัว' },
  fortune_teller: { method: 'romance', talent: 'ฟังน้ำเสียงแล้วจับความรู้สึกได้' },
  rich_coach: { method: 'ponzi', talent: 'คุ้นเวทีสัมมนา' },
  fallen_star: { method: 'foundation', talent: 'รับมือกล้องนักข่าวได้' },
  ex_banker: { method: 'ponzi', talent: 'อ่านบัญชีห้องสัมมนาเป็น' },
  share_auntie: { method: 'mystery_stall', talent: 'รู้จักแม่ค้าประจำตลาด' },
  orange_cat: { method: 'cat_dub', talent: 'ร้องเองพากย์เองได้' },
  foundation_chief: { method: 'foundation', talent: 'รู้จักทีมภาคสนาม' },
  grey_lawyer: { method: 'soi_football', talent: 'เคยไกล่เกลี่ยทีมคู่ปรับ' },
  ex_inmate: { method: 'mystery_stall', talent: 'ต่อแผงและจัดพื้นที่เองได้' },
};

export function careerStatus(s: GameState, method: string) {
  const track = careerTracks[method];
  invariant(track && Object.hasOwn(careerTracks, method), 'unknown career track');
  const shifts = s.history.filter(h => h.methodId === method && (h.day < s.day || s.phase === 'ended')).length;
  const affinity = careerAffinities[s.characterId];
  const needed = affinity?.method === method ? 2 : 3;
  const selected = s.careers?.[method];
  const branch = selected?.branch;
  const commissions = selected ? s.history.filter(h => h.methodId === method && h.day >= selected.since && (h.day < s.day || s.phase === 'ended')).length : 0;
  return { track, shifts, needed, branch, commissions, finale: selected?.finale };
}

export function minimumJobCost(s: GameState, c: GameContent) {
  const available = c.methods.filter(m => methodBlock(s, c, m) === null);
  return available.length ? Math.min(...available.map(m => m.cost)) : null;
}

export function careerFee(c: GameContent, methodId: string) {
  const method = c.methods.find(m => m.id === methodId);
  invariant(method, 'unknown career method');
  return 500 + method.cost;
}

type Signature = { action: string; result: string; heat: number; fame: number; cash: number };
function signature(action: string, result: string, heat: number, fame: number, cash = 0): Signature {
  return { action, result, heat, fame, cash };
}
export const careerSignatures: Record<string, Signature> = {
  ex_insurance: signature('เปิดโต๊ะรับฟังข้อร้องเรียน', 'ลูกค้าคนแรกยอมนั่งคุยจนจบ', -5, 2),
  gamer_kid: signature('โยนไมค์ให้ทีมแข่งพากย์สด', 'ทั้งห้องร่วมเชียร์จนมีคนขอฉายซ้ำ', 2, 5),
  temple_kid: signature('ยกชุดน้ำชาไปตั้งวงหลังศาลา', 'คนที่เถียงกันยอมพักไมค์แล้วหันมาฟัง', -7, 1),
  live_seller: signature('เปิดไลฟ์ขายบัตรชมเบื้องหลัง', 'คนดูแห่มาขอดูโต๊ะทำงานตัวจริง', 3, 3, 250),
  phone_tech: signature('ตั้งมุมซ่อมเครื่องเสียงกลางงาน', 'เสียงหวีดหายไปและเจ้าภาพออกค่าช่างให้', -3, 1, 220),
  fortune_teller: signature('จับไพ่หาคนเปิดวงสนทนา', 'คู่กรณีทั้งสองนั่งลงรอฟังไพ่ใบสุดท้าย', -4, 3),
  rich_coach: signature('รับไมค์จัดสัมมนารอบพิเศษ', 'สปอนเซอร์ยื่นซองพร้อมขอรูปหน้าเวที', 4, 2, 400),
  fallen_star: signature('ขึ้นเวทีเล่นบทที่คนทั้งซอยจำได้', 'คนดูพูดบทสุดท้ายพร้อมคุณทั้งลาน', 2, 6),
  ex_banker: signature('ไล่ยอดค่าใช้จ่ายต่อหน้าคณะทำงาน', 'ทีมพบค่ามัดจำค้างคืนในแฟ้มงาน', -2, 1, 300),
  share_auntie: signature('ชวนโต๊ะขาประจำออกเงินคนละนิด', 'เจ๊หน้าตลาดเดินมาสมทบพร้อมขอเป็นเจ้าภาพ', 1, 2, 300),
  orange_cat: signature('นอนทับไมค์กลางวงประชุม', 'ทุกคนหยุดเถียงเพราะกลัวแมวตื่น', -6, 2),
  foundation_chief: signature('พาทีมลงไปฟังคนท้ายแถว', 'เรื่องที่ค้างอยู่ถึงมือคนทำงานในบ่ายนั้น', -4, 4),
  grey_lawyer: signature('ขอพักเวทีแล้วเรียกทั้งสองฝ่ายมาคุย', 'คู่กรณียอมกลับบ้านพร้อมข้อตกลงคนละฉบับ', -8, 1),
  ex_inmate: signature('ซ่อมโต๊ะกลางให้ทุกฝ่ายกลับมานั่ง', 'คนท้ายซอยเอาข้าวมาเลี้ยงแล้วฝากเงินค่าไม้ไว้', -4, 2, 140),
};
