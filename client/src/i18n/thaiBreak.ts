// การตัดบรรทัดภาษาไทย: เบราว์เซอร์ตัดคำด้วยพจนานุกรมของตัวเอง ซึ่งไม่รู้จักคำทับศัพท์กับชื่อเล่นหลายคำ
// เลยตัดกลางคำได้ เช่น "ซิ/ม" "ดูด/วง" "คอมเมน/ต์" ไฟล์นี้ใส่ตัวเชื่อมคำ (U+2060 WORD JOINER)
// ที่มองไม่เห็นไว้ในคำเหล่านั้น และใช้ช่องว่างไม่ตัดบรรทัดหน้าไม้ยมก เพื่อไม่ให้ "ๆ" ไปขึ้นต้นบรรทัดใหม่

const WJ = '⁠';
const NBSP = ' ';

/**
 * คำที่ตรวจแล้วว่า Chrome/ICU ตัดกลางคำ (ตรวจด้วย Intl.Segmenter กับข้อความทั้งเกม 24 พ.ย. 2026)
 * เพิ่มคำได้เมื่อเจอข้อความใหม่ที่ขาดกลางคำ
 */
export const glueWords = [
  // คำทับศัพท์
  'ซิมการ์ด',
  'ซิม',
  'สติกเกอร์',
  'คอลเซ็นเตอร์',
  'สปอนเซอร์',
  'คอมเมนต์',
  'ออดิชั่น',
  'ไวรัล',
  'คอยน์',
  'ไรเดอร์',
  'มาสคอต',
  'ฟีดแบ็ก',
  'กิลด์',
  'โซเชียล',
  'พาสปอร์ต',
  'ออร์เดอร์',
  'ออเดอร์',
  'แอ็กชัน',
  'คัมแบ็ก',
  'สปอตไลต์',
  'แอดมิน',
  'แอด',
  'คอนเทนต์',
  'เกสต์',
  'เซเว่น',
  'สโลว์',
  'เทรนด์',
  'เช็ก',
  'ชิปมังก์',
  'ช็อต',
  'แพ็ก',
  'ลิมิเต็ด',
  'แฮก',
  'แบรนด์',
  'อีเวนต์',
  'ฟิลเตอร์',
  'ไอดอล',
  'ฮัลโหล',
  'เซลฟี่',
  'ช้อป',
  'บล็อกเกอร์',
  'แคป',
  'แชต',
  'แชท',
  'สเปเชียลตี้',
  'เดลิเวอรี',
  'ดอท',
  'เพลเยอร์',
  'ไอเดีย',
  'ชาบู',
  'ฟลุก',
  'เออเรอร์',
  'เพจเจอร์',
  'ดราม่า',
  'มีม',
  'เทรดเดอร์',
  'สต็อก',
  'อินดี้',
  'ลิสต์',
  'ฮอร์น',
  'ดีล',
  'โกลบอล',
  'เนชันแนล',
  'แจ็กพอต',
  'เรตติ้ง',
  'อั่งเปา',
  'บาริสต้า',
  'ไลฟ์',
  'สตูดิโอ',
  'วิดีโอ',
  'วีไอพี',
  'แฟนคลับ',
  'อัปเกรด',
  'ปลดล็อก',
  'คอนโด',
  // ชื่อคนและคำที่ ICU สับสนเมื่ออยู่ติดคำทับศัพท์
  'กิมหงษ์',
  'มิ้นท์',
  'ติ๋ม',
  'ต๋อง',
  'หมวย',
  'นัท',
  'นิติ',
  'เจ้าสัว',
  'โยธวาทิต',
  'ดูดวง',
  'สายด่วน',
  'รู้จัก',
  'กระซิบ',
  'วิจารณ์',
  'อุปกรณ์',
  'เทศกาล',
  'ทวง',
  'กลับ',
  'บุก',
  'กล้อง',
  'สมัย',
  'ภาพ',
  'ร้าน',
  'ซอย',
  'จอง',
  'ยอม',
  'หวาน',
  'นอน',
  'เจอ',
  'ไหน',
  'อีก',
  'สิบ',
  'ก่อน',
  'ของ',
  'โอกาส',
];

const thaiChar = /[฀-๿]/;
const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' });
// ใส่ตัวเชื่อมเฉพาะหน้าพยัญชนะหรือสระหน้า (จุดเดียวที่ภาษาไทยตัดบรรทัดได้) ไม่แทรกระหว่างพยัญชนะกับสระ/วรรณยุกต์
const syllableStart = /^[ก-ฮเ-ไ]/;
const glued = new Map(
  glueWords.map((w) => [
    w,
    Array.from(
      graphemes.segment(w),
      (g, i) => (i > 0 && syllableStart.test(g.segment) ? WJ : '') + g.segment,
    ).join(''),
  ]),
);
const wordRx = new RegExp([...glueWords].sort((a, b) => b.length - a.length).join('|'), 'g');
// ห้ามตัดหน้าตัวสะกดที่มีการันต์ เช่น "ต์" "ส์" (ขึ้นต้นพยางค์ไม่ได้)
const karanRx = /(?<=[ก-๎])(?=[ก-ฮ][ิุ]?์)/g;

/** ใส่ตัวเชื่อมคำในข้อความไทย (เรียกซ้ำได้ ผลเหมือนเดิม) */
export function glueThai(text: string): string {
  if (!thaiChar.test(text)) return text;
  return text
    .replace(/ ๆ/g, `${NBSP}ๆ`)
    .replace(wordRx, (w) => glued.get(w) ?? w)
    .replace(karanRx, WJ)
    .replace(new RegExp(`${WJ}{2,}`, 'g'), WJ);
}

/** แยกข้อความเป็นชิ้นที่ตัดบรรทัดได้ (ใช้ตอนวาดลง canvas) */
export function breakChunks(text: string): string[] {
  const t = glueThai(text);
  const out: string[] = [];
  for (const { segment } of new Intl.Segmenter('th', { granularity: 'word' }).segment(t)) {
    const prev = out[out.length - 1];
    // ชิ้นที่มีตัวเชื่อมคำคั่นอยู่ต้องติดกับชิ้นก่อนหน้า (Segmenter ไม่สนใจตัวเชื่อมคำ)
    const glue = (x: string) => x === WJ || x === NBSP;
    if (prev !== undefined && (glue(prev.slice(-1)) || glue(segment.slice(0, 1)))) {
      out[out.length - 1] = prev + segment;
    } else out.push(segment);
  }
  return out;
}

/** ตัดข้อความให้ไม่เกิน max ตัวอักษร โดยตัดที่รอยต่อคำและต่อท้ายด้วย … */
export function clipWords(text: string, max: number): string {
  if (text.length <= max) return text;
  let out = '';
  for (const c of breakChunks(text)) {
    if ((out + c).replaceAll(WJ, '').length > max - 1) break;
    out += c;
  }
  return `${out.trimEnd()}…`;
}

const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

function fixNode(n: Node) {
  if (n.nodeType === Node.TEXT_NODE) {
    const p = n.parentElement;
    if (p && (SKIP.has(p.tagName) || p.isContentEditable)) return;
    const v = n.nodeValue ?? '';
    const g = glueThai(v);
    if (g !== v) n.nodeValue = g;
    return;
  }
  if (n.nodeType === Node.ELEMENT_NODE && SKIP.has((n as Element).tagName)) return;
  for (const c of Array.from(n.childNodes)) fixNode(c);
}

/** เฝ้าทั้งหน้า: ข้อความที่ React เขียนลงมาใหม่จะได้ตัวเชื่อมคำทุกครั้ง */
export function watchThaiBreaks(root: Node = document.body): MutationObserver {
  fixNode(root);
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') fixNode(r.target);
      else r.addedNodes.forEach(fixNode);
    }
  });
  mo.observe(root, { subtree: true, childList: true, characterData: true });
  return mo;
}
