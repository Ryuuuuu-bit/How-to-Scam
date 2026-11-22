import type { GameEvent } from '../../src/types/content';

export interface SketchLine {
  speaker: string;
  text: string;
  recall?: boolean;
}

interface SketchChoice {
  label: string;
  replies: SketchLine[];
  stat: 'fame' | 'karma';
  gain: number;
}

export interface SoiSketch {
  id: string;
  host: string;
  channel: string;
  title: string;
  setup: string;
  opening: SketchLine;
  choices: [SketchChoice, SketchChoice];
  reader: string;
}

export const soiSketches: SoiSketch[] = [
  {
    id: 'sketch_soap', host: 'แม่บุ้ง', channel: 'ไลฟ์ขายของ', title: 'ไมค์ดับ แต่แชตพากย์ได้',
    setup: 'แม่บุ้งเปิดไลฟ์ขายสบู่ คนดูเห็นปากขยับ แต่ไมค์ยังปิดอยู่ คุณช่วยแม่คุมไลฟ์อยู่หลังกล้อง',
    opening: { speaker: 'แม่บุ้ง', text: 'ฮัลโหล ได้ยินแม่ไหมลูก' },
    choices: [
      { label: 'ส่งสบู่สีส้มให้แม่ชู', stat: 'fame', gain: 4, replies: [
        { speaker: 'แชต', text: 'อะไรดี…บุ้งก็ว่าดี' },
        { speaker: 'แม่บุ้ง', text: 'อ้าว ได้ยินแม่แล้วเหรอคะ' },
        { speaker: 'แชต', text: 'ยังค่ะ แต่ก้อนนี้หนูพากย์เองได้' },
      ] },
      { label: 'เปิดไมค์ให้แม่', stat: 'karma', gain: 3, replies: [
        { speaker: 'แม่บุ้ง', text: 'อะไรดี…' },
        { speaker: 'เสียงข้างห้อง', text: 'บุ้งก็ว่าดี!' },
        { speaker: 'แม่บุ้ง', text: 'ป้าอร รอบนี้หนูขอพูดเองสักก้อนได้ไหม' },
      ] },
    ],
    reader: 'ดูไลฟ์แม่บุ้งบนรถเมล์ ลืมหยิบหูฟังมา ยังพูดตามทันทุกคำ',
  },
  {
    id: 'sketch_dinner', host: 'พี่ก้อง จอมด่วน', channel: 'แชตกลุ่ม', title: 'ด่วน! คนเมื่อวานอ่านด้วย',
    setup: 'เมื่อคืนแก๊งเพิ่งไปกินหมูกระทะ พี่ก้องให้คุณช่วยทวงส่วนแบ่งในกลุ่มไลน์ แต่ดันพิมพ์ค้างไว้แค่ครึ่งเดียว',
    opening: { speaker: 'พี่ก้อง', text: 'ท้ายกสิกร รีบโอน!!' },
    choices: [
      { label: 'กดแท็กทุกคน', stat: 'fame', gain: 4, replies: [
        { speaker: 'พี่อ้อย', text: 'ร่วมด้วย 20 บาทค่ะ สาธุ 🙏', recall: true },
        { speaker: 'แอดมิน', text: 'ค่าหมูกระทะครับพี่ คนละ 289' },
        { speaker: 'แอดมิน', text: 'ผมเห็นสาธุแล้วครับพี่' },
      ] },
      { label: 'ส่งรูปบิลให้ดูก่อน', stat: 'karma', gain: 3, replies: [
        { speaker: 'พี่อ้อย', text: 'พี่กินแต่ผัก ขอหารน้อยหน่อยได้มั้ย' },
        { speaker: 'พี่ก้อง', text: 'ได้ครับ แล้วชีสหกถ้วยของใคร' },
        { speaker: 'พี่อ้อย', text: 'โอนแล้วจ้ะ' },
      ] },
    ],
    reader: 'รอบหน้าเก็บเงินก่อนสั่งชีส พี่อ้อยอ่านแล้ว',
  },
  {
    id: 'sketch_host', host: 'พี่หน่วง', channel: 'สายตรงเข้าสตูฯ', title: 'พรุ่งนี้สะดวกมาเล่าไหมครับ',
    setup: 'พี่หน่วงโทรมาชวนคุณไปออกรายการ เสียงปลายสายชัดจนได้ยินทีมงานนับถอยหลัง',
    opening: { speaker: 'พี่หน่วง', text: 'พรุ่งนี้สะดวกมาเล่าที่รายการพี่ไหมครับ' },
    choices: [
      { label: 'ขอปรึกษาทนายก่อนครับ', stat: 'karma', gain: 3, replies: [
        { speaker: 'พี่หน่วง', text: 'ได้ครับ เดี๋ยวผมต่อสายให้' },
        { speaker: 'ทนายของคุณ', text: 'เฮ้ย มึงพูดอะไรไปบ้าง' },
        { speaker: 'แชตไลฟ์', text: 'ทนายเพิ่งรู้ว่าตัวเองออกทีวีพร้อมกูเลย 555' },
      ] },
      { label: 'ถามก่อนว่านั่งฝั่งไหน', stat: 'fame', gain: 4, replies: [
        { speaker: 'พี่หน่วง', text: 'ขวามือพี่ครับ' },
        { speaker: 'คุณ', text: 'งั้นผมขอยืนครับ' },
        { speaker: 'พี่หน่วง', text: 'อ๋อ แฟนรายการ' },
      ] },
    ],
    reader: 'ดูรายการพี่หน่วงมาหลายปี เพิ่งเห็นแขกต่อรองเรื่องเก้าอี้ตั้งแต่ยังไม่เข้าสตูฯ',
  },
  {
    id: 'sketch_fish', host: 'ทนายต๊อก บ้าพลัง', channel: 'สดจากตลาด', title: 'ปลาสลิดต้องไม่ตายฟรี!',
    setup: 'ทนายต๊อกเพิ่งชิมปลาทอดหน้าตลาดไปสองตัว เห็นไมค์ในมือคุณก็ขยับเนกไท หันมาเข้ากล้องทันที',
    opening: { speaker: 'ทนายต๊อก', text: 'ขอพูดแทนปลาสลิดสักคำครับ' },
    choices: [
      { label: 'ยื่นไมค์ให้ทนาย', stat: 'fame', gain: 4, replies: [
        { speaker: 'ทนายต๊อก', text: 'ปลาสลิดต้องไม่ตายฟรี!' },
        { speaker: 'ป้าร้านปลา', text: 'ถูกต้องลูก สองตัวแปดสิบ' },
        { speaker: 'ทนายต๊อก', text: 'ผมพูดถึงความยุติธรรมครับป้า' },
        { speaker: 'ป้าร้านปลา', text: 'ป้าพูดถึงสองตัวที่หนูชิมไปค่ะ' },
      ] },
      { label: 'ให้ป้าเล่าฝั่งร้านปลาบ้าง', stat: 'karma', gain: 3, replies: [
        { speaker: 'ป้าร้านปลา', text: 'ทนายบอกว่าขอชิมเป็นหลักฐาน' },
        { speaker: 'คุณ', text: 'แล้วตอนนี้หลักฐานอยู่ไหนครับ' },
        { speaker: 'ป้าร้านปลา', text: 'เรอไปเมื่อกี้แล้วลูก' },
      ] },
    ],
    reader: 'ป้าติดป้ายใหม่แล้ว “ชิมได้ คิดเป็นตัว”',
  },
];

export const sketchEvents: GameEvent[] = soiSketches.map(sketch => ({
  id: sketch.id, category: 'silly', weight: 5, when: { sketchEdition: true, day: [2, 30] },
  title: { th: sketch.title }, body: { th: sketch.setup },
  choices: sketch.choices.map(choice => ({
    text: { th: choice.label },
    outcomes: [{
      text: { th: choice.replies.map(line => line.speaker + ' “' + line.text + '”').join(' ') },
      effects: [{ kind: 'add', stat: choice.stat, value: choice.gain }],
    }],
  })),
}));
