// รายการไฟล์เสียงของเกม (สร้างด้วย ElevenLabs ผ่าน scripts/gen-audio.ts)
// ไฟล์อยู่ที่ client/public/audio/<id>.mp3 — ไม่มีไฟล์ก็ไม่เป็นไร เกมจะใช้เสียงสังเคราะห์แทน

/** เสียงพากย์ไทยที่ใช้ (voice id จากบัญชี ElevenLabs) */
export const VOICES = {
  chai: 'MeUerI8vM5Ce2GSTXsRT', // สนุก เร็ว มีพลัง — ผู้บรรยายหลัก
  anan: 'tAV9ucNkXgK2k9TLxWkM', // ทุ้ม หนักแน่น
  decha: 'deCz1h6mjB7HnY2xQz08', // ทุ้ม โฆษณา
  preecha: 'FaUQoAqt8WX5mfvrvb3A', // ใจดี ชัดเจน
  somchai: 'XLXcyPK1jTjw1pYLLcM9', // จริงจัง
  kanya: 'B4NdgwdU97lHqA8Udh2D', // ผู้หญิง นุ่มนวล
} as const;

export interface SfxSpec {
  id: string;
  kind: 'sfx';
  prompt: string;
  seconds: number;
}

export interface VoiceSpec {
  id: string;
  kind: 'voice';
  voice: keyof typeof VOICES;
  text: string;
}

export const SFX: SfxSpec[] = [
  {
    id: 'sfx_click',
    kind: 'sfx',
    prompt: 'Cute bubbly cartoon UI button click, short pop',
    seconds: 0.5,
  },
  {
    id: 'sfx_cash',
    kind: 'sfx',
    prompt: 'Cartoon cash register cha-ching with coins, cheerful',
    seconds: 1.2,
  },
  {
    id: 'sfx_coins',
    kind: 'sfx',
    prompt: 'Shower of gold coins falling on a table, cartoon jackpot',
    seconds: 1.8,
  },
  {
    id: 'sfx_phone_ring',
    kind: 'sfx',
    prompt: 'Old desk telephone ringing twice, comedic',
    seconds: 2,
  },
  {
    id: 'sfx_hangup',
    kind: 'sfx',
    prompt: 'Phone slammed down then busy tone beeps, comedic',
    seconds: 1.5,
  },
  {
    id: 'sfx_siren',
    kind: 'sfx',
    prompt: 'Cartoon police siren approaching fast, wailing, comedic chase',
    seconds: 2.5,
  },
  {
    id: 'sfx_jail',
    kind: 'sfx',
    prompt: 'Heavy metal jail cell door slamming shut with keys jingling',
    seconds: 1.5,
  },
  {
    id: 'sfx_escape',
    kind: 'sfx',
    prompt: 'Cartoon running feet and fast whoosh getaway',
    seconds: 1.5,
  },
  {
    id: 'sfx_level_up',
    kind: 'sfx',
    prompt: 'Short triumphant cartoon brass fanfare level up',
    seconds: 1.8,
  },
  {
    id: 'sfx_launder_ok',
    kind: 'sfx',
    prompt: 'Washing machine finished ding with sparkly shine sound',
    seconds: 1.5,
  },
  {
    id: 'sfx_launder_fail',
    kind: 'sfx',
    prompt: 'Comedic sad trombone wah wah with a splat',
    seconds: 1.8,
  },
  {
    id: 'sfx_event',
    kind: 'sfx',
    prompt: 'Cartoon surprise pop with a quick drum hit, notification',
    seconds: 0.8,
  },
  {
    id: 'sfx_achievement',
    kind: 'sfx',
    prompt: 'Magical sparkle chime achievement unlocked',
    seconds: 1.5,
  },
  {
    id: 'sfx_news',
    kind: 'sfx',
    prompt: 'Short dramatic TV news intro sting, comedic',
    seconds: 2,
  },
  {
    id: 'sfx_laugh',
    kind: 'sfx',
    prompt: 'Small studio audience laughing, sitcom laugh track',
    seconds: 2,
  },
];

export const LINES: VoiceSpec[] = [
  // ผู้บรรยาย
  {
    id: 'vo_welcome',
    kind: 'voice',
    voice: 'chai',
    text: '[excited] ยินดีต้อนรับสู่วงการ! ที่นี่ไม่มีอะไรฟรี... [laughs] ยกเว้นบทเรียนชีวิต',
  },
  { id: 'vo_new_day', kind: 'voice', voice: 'chai', text: '[excited] วันใหม่ เงินใหม่ ปัญหาใหม่!' },
  { id: 'vo_cash', kind: 'voice', voice: 'chai', text: '[laughs] เงินเข้าแล้วโว้ย!' },
  { id: 'vo_heat', kind: 'voice', voice: 'chai', text: '[nervous] เฮ้ย... ตำรวจเริ่มมองแล้วนะ' },
  { id: 'vo_police', kind: 'voice', voice: 'chai', text: '[shouting] ตำรวจมาแล้ว! วิ่งงงง!' },
  { id: 'vo_caught', kind: 'voice', voice: 'chai', text: '[sighs] จบข่าว... ไปนอนคุกกันเถอะ' },
  { id: 'vo_escaped', kind: 'voice', voice: 'chai', text: '[laughs] หนีรอดแบบหวุดหวิด!' },
  { id: 'vo_launder_ok', kind: 'voice', voice: 'chai', text: 'ฟอกขาวสะอาดเอี่ยม เหมือนผ้าใหม่!' },
  { id: 'vo_launder_fail', kind: 'voice', voice: 'chai', text: '[gasps] ปลาทองตายหมดแล้ว!' },
  {
    id: 'vo_level_up',
    kind: 'voice',
    voice: 'chai',
    text: '[excited] แก๊งเลเวลอัป! วงการนี้มันเล็กไปแล้ว',
  },
  { id: 'vo_mission', kind: 'voice', voice: 'chai', text: '[excited] เฮียใหญ่ปลื้ม! ภารกิจสำเร็จ' },
  {
    id: 'vo_retire',
    kind: 'voice',
    voice: 'chai',
    text: '[warmly] พอแล้วล่ะ... กลับบ้านไปกินข้าวกับแม่เถอะ',
  },
  {
    id: 'vo_tip',
    kind: 'voice',
    voice: 'chai',
    text: '[softly] เรื่องในเกมเป็นมุก แต่มิจฉาชีพของจริงมีอยู่ทุกวัน... ถ้าโดนหลอก รีบโทร 1441 นะ',
  },
  // ประโยคประจำอาชีพ (เล่นตอนเลือกอาชีพ)
  {
    id: 'char_ex_insurance',
    kind: 'voice',
    voice: 'decha',
    text: '[excited] สวัสดีครับ! วันนี้มีประกันชีวิตสำหรับตุ๊กแกมาเสนอครับ',
  },
  {
    id: 'char_gamer_kid',
    kind: 'voice',
    voice: 'chai',
    text: '[tired] ขออีกตาเดียว... [yawns] แล้วจะไปโกงต่อ',
  },
  {
    id: 'char_temple_kid',
    kind: 'voice',
    voice: 'preecha',
    text: '[mischievously] งานไหนคนใจบุญเยอะ ผมรู้หมดครับ',
  },
  {
    id: 'char_live_seller',
    kind: 'voice',
    voice: 'kanya',
    text: '[excited] ซื้อเลยค่ะ! ของจะหมดแล้ว! หมดตั้งแต่ยังไม่มีของค่ะ!',
  },
  {
    id: 'char_phone_tech',
    kind: 'voice',
    voice: 'preecha',
    text: 'ซ่อมได้ทุกอย่างครับ... [sighs] ยกเว้นหัวใจตัวเอง',
  },
  {
    id: 'char_fortune_teller',
    kind: 'voice',
    voice: 'somchai',
    text: '[dramatically] ไพ่บอกว่าคุณจะรวย... ถ้าโอนค่าครูมาก่อน',
  },
  {
    id: 'char_rich_coach',
    kind: 'voice',
    voice: 'anan',
    text: '[excited] รวยใน 7 วัน! [whispers] วันที่ 8 ผมหายนะ',
  },
  {
    id: 'char_fallen_star',
    kind: 'voice',
    voice: 'decha',
    text: '[dramatically] จำผมได้ไหม... พระเอกละครหลังข่าวยุค 90 ไง',
  },
  {
    id: 'char_ex_banker',
    kind: 'voice',
    voice: 'kanya',
    text: '[softly] เชิญคิวต่อไปค่ะ... ช่องโหว่ไหนดิฉันรู้หมด',
  },
  {
    id: 'char_share_auntie',
    kind: 'voice',
    voice: 'kanya',
    text: '[laughs] วงแชร์งวดนี้เปียได้นะจ๊ะ ใครเปียก่อนรวยก่อน',
  },
  {
    id: 'char_orange_cat',
    kind: 'voice',
    voice: 'chai',
    text: '[high voice] เมี้ยว... [mischievously] เมี้ยวเมี้ยว... โอนมาเดี๋ยวนี้',
  },
];

export const AUDIO_FILES = [...SFX, ...LINES];
