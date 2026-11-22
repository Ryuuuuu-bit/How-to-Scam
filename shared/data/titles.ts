import type { Title } from '../src/types/content';

// ฉายาอัตโนมัติตามสไตล์การเล่น — ตรวจตามลำดับ อันแรกที่เข้าเงื่อนไขคือฉายา
export const titles: Title[] = [
  { id: 'speedrun_jail', rule: { kind: 'caughtBy', day: 7 }, name: { th: 'ติดคุกไวกว่าไฟเขียว' } },
  {
    id: 'goldfish_boss',
    rule: { kind: 'card', cardId: 'goldfish', count: 3 },
    name: { th: 'เจ้าพ่อปลาทอง' },
  },
  {
    id: 'grandma_fav',
    rule: { kind: 'card', cardId: 'grandma_pillow', count: 3 },
    name: { th: 'หลานรักของยายทั้งซอย' },
  },
  {
    id: 'cat_picasso',
    rule: { kind: 'card', cardId: 'cat_painting', count: 2 },
    name: { th: 'ปิกัสโซสายเทา' },
  },
  {
    id: 'ghost_mookata',
    rule: { kind: 'card', cardId: 'empty_mookata', count: 3 },
    name: { th: 'เจ้าของร้านหมูกระทะผี' },
  },
  {
    id: 'durian_tycoon',
    rule: { kind: 'card', cardId: 'golden_durian', count: 2 },
    name: { th: 'เสี่ยทุเรียนทองคำ' },
  },
  { id: 'kind_scammer', rule: { kind: 'karma', min: 20 }, name: { th: 'มิจฉาชีพใจดีเกินอาชีพ' } },
  { id: 'sleepy', rule: { kind: 'restDays', count: 10 }, name: { th: 'นักพักผ่อนมืออาชีพ' } },
  { id: 'ponzi_sage', rule: { kind: 'method', methodId: 'ponzi' }, name: { th: 'เซียนปลาทองคอยน์' } },
  {
    id: 'gambling_house',
    rule: { kind: 'method', methodId: 'gambling' },
    name: { th: 'เจ้ามือไม่เคยแพ้' },
  },
  {
    id: 'merit_organizer',
    rule: { kind: 'method', methodId: 'merit' },
    name: { th: 'ผู้จัดงานรื่นเริงตัวพ่อ' },
  },
  {
    id: 'online_saint',
    rule: { kind: 'method', methodId: 'foundation' },
    name: { th: 'นักบุญออนไลน์ (เก๊)' },
  },
  {
    id: 'hotline_queen',
    rule: { kind: 'method', methodId: 'call_center' },
    name: { th: 'เจ้าแม่สายด่วน' },
  },
  {
    id: 'rig_casanova',
    rule: { kind: 'method', methodId: 'romance' },
    name: { th: 'คาสโนว่าแท่นขุดเจาะ' },
  },
  {
    id: 'empty_box_king',
    rule: { kind: 'method', methodId: 'fake_shop' },
    name: { th: 'ราชากล่องเปล่า' },
  },
  { id: 'rookie', rule: { kind: 'always' }, name: { th: 'มิจฉาชีพฝึกหัด' } },
];
