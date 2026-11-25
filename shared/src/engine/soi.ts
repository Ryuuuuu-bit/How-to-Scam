// 1.0 "ทั้งซอยจำคุณได้": ซอยมีชีวิต + สารวัตรคู่ปรับ
// ทุกกติกาในไฟล์นี้เปิดเฉพาะ seed รุ่น 1.0 (มี ':v1:' หลังจำนวนวัน) รอบเก่าที่เซฟไว้จึง replay ได้ผลเดิม
import type { EvidenceKind, GameState, SoiCase, SoiForm, SoiNpcId, SoiPlaceId, SoiState } from '../types/state';
import { campaignDays } from './campaign';
import { rule } from './casual';
import { clampHeat, HEAT_MAX } from './effects';
import { invariant } from './errors';
import type { Rng } from './rng';
import { owns, quietGearBonus, raidGearBonus } from './shop';

export const editionMarker = 'v1:';

export function isLivingSoi(seed: string): boolean {
  const days = campaignDays(seed);
  return days !== undefined && seed.includes(`campaign1:${days}:${editionMarker}`);
}

// ---------- ข้อมูลสถานที่และคนในซอย ----------
export type PlaceId = SoiPlaceId;
export type PlaceForm = SoiForm;
export type NpcId = SoiNpcId;
export const placeIds: readonly PlaceId[] = ['market', 'temple', 'field', 'dorm', 'mookata'];
export const formIds: readonly PlaceForm[] = ['patron', 'local', 'show'];
export const npcIds: readonly NpcId[] = ['jae', 'uncle', 'coach', 'auntie', 'hia'];

interface PlaceInfo {
  name: string;
  npc: NpcId;
  methods: string[];
  /** ข้อความตอนยังไม่เปลี่ยน */
  blurb: string;
  forms: Record<PlaceForm, { name: string; pitch: string; news: string }>;
}

export const places: Record<PlaceId, PlaceInfo> = {
  market: {
    name: 'ตลาดเย็นปากซอย',
    npc: 'jae',
    methods: ['fake_shop', 'mystery_stall'],
    blurb: 'แผงผ้าใบสีส้ม ไฟหลอดตะเกียบ และเจ๊ที่จำหน้าลูกค้าได้ทุกคน',
    forms: {
      patron: { name: 'ไนต์มาร์เก็ตป้ายไฟ', pitch: 'นายทุนขอเช่ายาวทั้งลาน ค่าแผงขึ้น แต่คนเดินเยอะขึ้นเท่าตัว', news: 'ตลาดเย็นติดป้ายไฟใหม่ ค่าแผงขึ้นตามความสว่าง' },
      local: { name: 'ครัวชุมชนตลาดเย็น', pitch: 'ลงขันตั้งเตาใหญ่ ใครหิวก็มาตักได้ แม่ค้าผลัดกันทำ', news: 'ตลาดเย็นตั้งครัวกลาง แม่ค้าเปลี่ยนกันโชว์ฝีมือทุกเย็น' },
      show: { name: 'ลานฉายหนังกลางตลาด', pitch: 'ขึงจอผ้าท้ายตลาด ฉายหนังเก่าทุกศุกร์ คนดูนั่งกินไปด้วย', news: 'ลานฉายหนังตลาดเย็นคนแน่น เสื่อหมดตั้งแต่หนึ่งทุ่ม' },
    },
  },
  temple: {
    name: 'ลานวัดท้ายซอย',
    npc: 'uncle',
    methods: ['merit', 'foundation'],
    blurb: 'ลานปูนกว้าง ศาลาไม้ และลำโพงฮอร์นที่ดังถึงปากซอย',
    forms: {
      patron: { name: 'ศูนย์พระเครื่องติดแอร์', pitch: 'เซียนจากในเมืองขอเปิดแผงถาวร เงินหมุนเร็ว คนแปลกหน้าเดินเยอะ', news: 'ลานวัดมีแผงพระเครื่องติดแอร์ ลุงมัคทายกยังงงว่าปลั๊กมาจากไหน' },
      local: { name: 'โรงทานทุกวันพระ', pitch: 'ตั้งโรงทานถาวร ใครผ่านมาได้กินข้าวต้มฟรี', news: 'โรงทานลานวัดเปิดทุกวันพระ คิวยาวถึงศาลา' },
      show: { name: 'เวทีลิเกงานวัด', pitch: 'ตั้งเวทีถาวร มีลิเกและประกวดร้องเพลงทุกเดือน', news: 'เวทีลิเกงานวัดเปิดรอบแรก พระเอกลืมบทแต่คนดูช่วยร้อง' },
    },
  },
  field: {
    name: 'สนามบอลหลังโกดัง',
    npc: 'coach',
    methods: ['soi_football', 'gambling'],
    blurb: 'สนามหญ้าเป็นหย่อม ประตูเหล็กสนิม และอัฒจันทร์ลังน้ำอัดลม',
    forms: {
      patron: { name: 'สนามหญ้าเทียมให้เช่ารายชั่วโมง', pitch: 'ปูหญ้าเทียมเปิดให้เช่าแพง ทีมบริษัทจองเต็มทุกคืน', news: 'สนามหลังโกดังปูหญ้าเทียม เด็กซอยต้องไปเตะหน้าเซเว่น' },
      local: { name: 'ลีกเด็กซอยทุกเสาร์', pitch: 'จัดลีกเยาวชน ค่าสมัครศูนย์บาท ผู้ปกครองช่วยกันขายน้ำ', news: 'ลีกเด็กซอยนัดแรก แม่ ๆ เชียร์ดังกว่าเด็ก' },
      show: { name: 'จอยักษ์ดูบอลสด', pitch: 'ตั้งจอ LED ยักษ์ ถ่ายทอดสดทุกนัดใหญ่ เบียร์ขายดีจนสะอึก', news: 'จอยักษ์หลังโกดังเปิดตัว ทั้งซอยตะโกนพร้อมกันทุกครั้งที่บอลเข้า' },
    },
  },
  dorm: {
    name: 'หอพักสามชั้นกลางซอย',
    npc: 'auntie',
    methods: ['call_center', 'romance'],
    blurb: 'ห้องเช่าเรียงสามชั้น ราวตากผ้าทุกระเบียง และป้าเจ้าของหอที่รู้ทุกเรื่อง',
    forms: {
      patron: { name: 'คอนโดเช่ารายวัน', pitch: 'ทุบผนังรีโนเวตเป็นห้องรายวัน ผู้เช่าเปลี่ยนหน้าทุกคืน', news: 'หอกลางซอยกลายเป็นคอนโดรายวัน ป้าเจ้าของหอได้สั่งชุดใหม่ทั้งตู้' },
      local: { name: 'หอราคามิตรภาพ', pitch: 'ตรึงค่าเช่า แบ่งห้องว่างให้คนตกงานพักฟรีหนึ่งเดือน', news: 'หอราคามิตรภาพเปิดห้องให้คนเพิ่งตกงาน ป้าเจ้าของหอทำกับข้าวเลี้ยงทุกวันอาทิตย์' },
      show: { name: 'สตูดิโอไลฟ์บนดาดฟ้า', pitch: 'ปรับดาดฟ้าเป็นสตูดิโอ ไฟวงแหวนเรียงสิบดวง ใครก็มาไลฟ์ได้', news: 'ดาดฟ้าหอกลางซอยเปิดสตูดิโอไลฟ์ ไฟวงแหวนสว่างจนนกบินชน' },
    },
  },
  mookata: {
    name: 'ร้านหมูกระทะเฮียโต้ง',
    npc: 'hia',
    methods: ['ponzi', 'cat_dub'],
    blurb: 'เตาถ่านยี่สิบโต๊ะ แมวสามตัวคุมหน้าร้าน และโต๊ะประจำของสารวัตร',
    forms: {
      patron: { name: 'ห้องวีไอพีชั้นสอง', pitch: 'กั้นห้องวีไอพีให้เสี่ยมานั่งคุยธุรกิจ ประตูปิดสนิทกันเสียงลอด', news: 'ร้านหมูกระทะเฮียโต้งเปิดห้องวีไอพี สารวัตรขอโต๊ะแต่ไม่ได้' },
      local: { name: 'โต๊ะยาวกินรวมทั้งซอย', pitch: 'ต่อโต๊ะยาวกลางซอย จ่ายตามกำลัง ใครไม่มีก็ล้างจานแทน', news: 'โต๊ะยาวหมูกระทะทั้งซอย สารวัตรมานั่งหัวโต๊ะแล้วลืมถามเรื่องงาน' },
      show: { name: 'ร้านดังคิวยาวรีวิวล้าน', pitch: 'จ้างรีวิวเวอร์มาไลฟ์ แมวประจำร้านได้ออกทีวี', news: 'ร้านหมูกระทะเฮียโต้งขึ้นรีวิวล้านวิว แมวหน้าร้านมีผู้จัดการแล้ว' },
    },
  },
};

export const npcs: Record<NpcId, { name: string; role: string; ally: string; foe: string; ask: string; thanks: string; reward: { cash?: number; heat?: number; fame?: number } }> = {
  jae: {
    name: 'เจ๊หมวย', role: 'แม่ค้าผลไม้หน้าตลาด',
    ally: 'เจ๊ส่งข่าวก่อนตำรวจบุก แรงบุกค้นเหลือครึ่งเดียว',
    foe: 'เจ๊เล่าให้สารวัตรฟังว่าคุณขายอะไร',
    ask: 'เจ๊ขอให้ช่วยเฝ้าแผงช่วงหัวค่ำ เจ๊จะไปรับหลานที่โรงเรียน',
    thanks: 'เจ๊ยัดมะม่วงใส่มือมาสองลูกพร้อมค่าเฝ้าแผง', reward: { cash: 300 },
  },
  uncle: {
    name: 'ลุงเสริม', role: 'มัคทายกประจำวัด',
    ally: 'ลุงพาไปนั่งสงบที่ศาลา วันพักลด Heat เพิ่มอีก 3',
    foe: 'ลุงประกาศเสียงตามสายว่าระวังคนแปลกหน้าในวัด',
    ask: 'ลุงขอแรงยกโต๊ะจีนสามสิบตัวเตรียมงานบวชพรุ่งนี้',
    thanks: 'ลุงพาไปกินข้าวก้นบาตร คนในวัดเริ่มจำหน้าคุณในทางที่ดี', reward: { heat: -5 },
  },
  coach: {
    name: 'โค้ชตี๋', role: 'โค้ชทีมเด็กหลังโกดัง',
    ally: 'โค้ชคุมทีมให้ ลูกน้องไม่ใจเสียตอน Heat สูง',
    foe: 'โค้ชถ่ายรูปรถคุณเก็บไว้เป็นหลักฐาน',
    ask: 'โค้ชขอให้ไปเป็นกรรมการนัดชิงของเด็ก ๆ เพราะกรรมการตัวจริงท้องเสีย',
    thanks: 'เด็กทั้งสองทีมเรียกคุณว่าโค้ช แม้คุณจะเป่านกหวีดผิดจังหวะไปสามรอบ', reward: { fame: 2 },
  },
  auntie: {
    name: 'ป้าสมใจ', role: 'เจ้าของหอพักกลางซอย',
    ally: 'ป้ารู้จักทุกคนในซอย ค่าทำลายหลักฐานลดครึ่งหนึ่ง',
    foe: 'ป้าส่งสำเนาสัญญาเช่าของคุณให้สารวัตร',
    ask: 'ป้าขอให้ช่วยไล่จิ้งจกออกจากตู้ไฟชั้นสาม ป้ากลัวมาก',
    thanks: 'ป้าลดค่าเช่าให้หนึ่งเดือน และเล่าความลับของห้อง 204 ให้ฟัง', reward: { cash: 400 },
  },
  hia: {
    name: 'เฮียโต้ง', role: 'เจ้าของร้านหมูกระทะ',
    ally: 'เฮียถ่วงเวลาสารวัตรด้วยหมูชุดใหญ่ หลักฐานต้องถึง 9 สารวัตรถึงบุก',
    foe: 'เฮียเลิกเก็บโต๊ะหลังร้านไว้ให้คุณ สารวัตรนั่งตรงนั้นแทน',
    ask: 'เฮียขอให้ช่วยล้างเตาห้าสิบใบ ลูกจ้างลาไปงานแต่งพร้อมกันทั้งร้าน',
    thanks: 'เฮียเลี้ยงหมูชุดใหญ่ และบอกว่าสารวัตรชอบมาวันอังคาร', reward: { heat: -4, cash: 150 },
  },
};

export const placeOfMethod = (methodId: string | null): PlaceId | null =>
  methodId === null ? null : (placeIds.find((p) => places[p].methods.includes(methodId)) ?? null);

/** ทำงานที่เดิมกี่กะ ซอยถึงขอให้ตัดสินใจว่าที่นี่จะเป็นแบบไหน */
export const shapeAfterShifts = 4;
export const repRange = [-3, 3] as const;
export const allyAt = 2;
export const foeAt = -2;

export const formCost: Record<PlaceForm, { cash: number; heat: number; fame: number; rep: number }> = {
  patron: { cash: 600, heat: 0, fame: 0, rep: -1 },
  local: { cash: -400, heat: -4, fame: 0, rep: 2 },
  show: { cash: 0, heat: 5, fame: 3, rep: 1 },
};

/** ผลถาวรของสถานที่ที่เปลี่ยนแล้ว (ใช้กับงานที่อยู่ในสถานที่นั้น) */
export function placeBonus(s: GameState, methodId: string): { income: number; heat: number; fame: number } {
  const place = placeOfMethod(methodId);
  const form = place ? s.soi?.places[place]?.form : undefined;
  if (!form) return { income: 0, heat: 0, fame: 0 };
  if (form === 'patron') return { income: 20, heat: 10, fame: 0 };
  if (form === 'local') return { income: 0, heat: -20, fame: 0 };
  return { income: 10, heat: 0, fame: 1 };
}

// ---------- สารวัตรหมูกระทะและบอร์ดหลักฐาน ----------
export type { EvidenceKind };
export const evidenceInfo: Record<EvidenceKind, { name: string; note: string }> = {
  shift: { name: 'ภาพจากกล้องหน้าร้าน', note: 'วันที่งานเสียงดังเกินไป' },
  sting: { name: 'เทปล่อซื้อ', note: 'ตำรวจไซเบอร์อัดเสียงคุณไว้ครบ' },
  clip: { name: 'คลิปโดนแกล้งกลับ', note: 'คลิปนี้มีคนดูทั้งโรงพัก' },
  exposed: { name: 'แคปจอชาวเน็ตขุด', note: 'มีลูกศรวงแดงชี้หน้าคุณ' },
  crash: { name: 'รายชื่อสมาชิกแชร์', note: 'ลายเซ็นคุณอยู่หน้าแรก' },
  paper: { name: 'สลิปโอนไม่ตรงบัญชี', note: 'ฟอกพลาด ทิ้งรอยไว้ในสมุดธนาคาร' },
  witness: { name: 'คำให้การเพื่อนบ้าน', note: 'คนในซอยเริ่มพูด' },
  decoy: { name: 'เบาะแสปลอม', note: 'แผนที่ไปโกดังร้างที่คุณวาดเอง' },
  contraband: { name: 'ใบเสร็จของเถื่อน', note: 'ดีลใต้โต๊ะกับร้านหมูกระทะ มีคนถ่ายรูปไว้' },
};

export const raidAt = 7;
export const raidCooldownDays = 4;
export const coldCaseDays = 8;
export const caseActions = {
  burn: { perWeight: 300 },
  decoy: { price: 500 },
  tipoff: { minFame: 10, cooldown: 6, heat: -10, clears: 3, karma: -2 },
} as const;

export function caseStrength(s: GameState): number {
  return (s.case?.evidence ?? []).filter((e) => e.kind !== 'decoy').reduce((n, e) => n + e.weight, 0);
}

export function raidThreshold(s: GameState): number {
  return rule(s, 'raidAt') + (isAlly(s, 'hia') ? 2 : 0) + raidGearBonus(s);
}

export function repOf(s: GameState, npc: NpcId): number {
  return s.soi?.rep[npc] ?? 0;
}
export const isAlly = (s: GameState, npc: NpcId) => repOf(s, npc) >= allyAt;
export const isFoe = (s: GameState, npc: NpcId) => repOf(s, npc) <= foeAt;

export function newSoi(): SoiState {
  return {
    places: Object.fromEntries(placeIds.map((p) => [p, { visits: 0 }])) as SoiState['places'],
    rep: Object.fromEntries(npcIds.map((n) => [n, 0])) as SoiState['rep'],
  };
}
export function newCase(): SoiCase {
  return { evidence: [], nextId: 1, peak: 0, raids: 0 };
}

function logToday(s: GameState) {
  return s.history.at(-1);
}

export function addEvidence(s: GameState, kind: EvidenceKind, weight: number, methodId?: string | null): void {
  if (!s.case) return;
  s.case.evidence.push({
    id: s.case.nextId++,
    kind,
    weight,
    day: s.day,
    ...(methodId ? { methodId } : {}),
  });
  s.case.peak = Math.max(s.case.peak, caseStrength(s));
  const log = logToday(s);
  if (log) log.evidence = (log.evidence ?? 0) + weight;
  s.lastResults.push({ kind: 'evidence', textKey: kind });
}

export function changeRep(s: GameState, npc: NpcId, delta: number): void {
  if (!s.soi) return;
  const before = s.soi.rep[npc];
  const after = Math.max(repRange[0], Math.min(repRange[1], before + delta));
  s.soi.rep[npc] = after;
  if (before > foeAt && after <= foeAt) {
    addEvidence(s, 'witness', 2);
    s.lastResults.push({ kind: 'soiMemory', textKey: `foe:${npc}` });
  } else if (before < allyAt && after >= allyAt) {
    s.lastResults.push({ kind: 'soiMemory', textKey: `ally:${npc}` });
  }
}

// ---------- จุดเชื่อมกับวันทำงาน ----------

/** หลังคำนวณรายได้ของงาน: นับกะที่สถานที่ คนในซอยสังเกต Heat และอาจเกิดหลักฐาน */
export function afterShift(s: GameState, methodId: string, heatGained: number): void {
  if (!s.soi) return;
  const place = placeOfMethod(methodId);
  if (place) {
    const ps = s.soi.places[place];
    ps.visits++;
    if (!ps.form && !s.soi.pendingShape && ps.visits >= shapeAfterShifts) s.soi.pendingShape = place;
    const bonus = placeBonus(s, methodId);
    if (bonus.fame) s.fame += bonus.fame;
    if (heatGained >= 12) changeRep(s, places[place].npc, -1);
  }
  if (heatGained >= 18) addEvidence(s, 'shift', 2, methodId);
  else if (heatGained >= 10) addEvidence(s, 'shift', 1, methodId);
}

/** วันพัก: คนในซอยเห็นคุณอยู่บ้าน */
export function quietDayBonus(s: GameState): number {
  return s.soi ? (isAlly(s, 'uncle') ? 3 : 0) + quietGearBonus(s) : 0;
}

/** จบวัน: หลักฐานเก่าจางลง สารวัตรอาจบุก และนัดชนกันของวันพรุ่งนี้ */
export function endOfDaySoi(s: GameState, rng: Rng): void {
  if (!s.case || !s.soi) return;
  const log = logToday(s);
  // ฟอกพลาดทิ้งรอยไว้ แต่สลิปซ้ำในสามวันสารวัตรนับเป็นแฟ้มเดียว
  if (log?.launderSuccess === false && !s.case.evidence.some((e) => e.kind === 'paper' && s.day - e.day < 3)) addEvidence(s, 'paper', 1);
  // หลักฐานเก่าเกินกำหนดจางลงทีละขั้น
  for (const e of s.case.evidence) if (e.kind !== 'decoy' && s.day - e.day >= coldCaseDays) e.weight--;
  s.case.evidence = s.case.evidence.filter((e) => e.kind === 'decoy' || e.weight > 0);
  maybeRaid(s);
  // นัดชนกัน: ทุก 5 วัน คนในซอยสองคนขอแรงพร้อมกัน
  const tomorrow = s.day + 1;
  if (tomorrow < s.maxDays && tomorrow % 5 === 4) {
    const [a, b] = rng.sample(npcIds, 2);
    if (a && b) s.soi.appointment = { day: tomorrow, npcs: [a, b] };
  }
}

function maybeRaid(s: GameState): void {
  const c = s.case;
  if (!c) return;
  const strength = caseStrength(s);
  if (strength < raidThreshold(s)) return;
  if (c.lastRaidDay !== undefined && s.day - c.lastRaidDay < raidCooldownDays) return;
  c.lastRaidDay = s.day;
  const log = logToday(s);
  const decoy = c.evidence.findIndex((e) => e.kind === 'decoy');
  if (decoy >= 0) {
    // สารวัตรตามเบาะแสปลอมไปโกดังร้าง
    c.evidence.splice(decoy, 1);
    s.fame += 2;
    if (log) log.raid = 'decoy';
    s.lastResults.push({ kind: 'raid', textKey: 'decoy', success: true });
    return;
  }
  c.raids++;
  const warned = isAlly(s, 'jae');
  const heat = Math.round((10 + strength * 2) * (warned ? 0.5 : 1));
  const seized = Math.round(s.dirtyCash * rule(s, warned ? 'raidSeizeWarned' : 'raidSeize') * (owns(s, 'app_scanner') ? 0.5 : 1));
  const before = s.heat;
  s.heat = Math.min(HEAT_MAX - 1, s.heat + heat);
  s.dirtyCash -= seized;
  // สารวัตรเก็บหลักฐานที่ใช้แล้วเข้าแฟ้ม เหลือครึ่งเดียวบนบอร์ด
  const sorted = [...c.evidence].filter((e) => e.kind !== 'decoy').sort((x, y) => x.day - y.day || x.id - y.id);
  let filed = 0;
  const half = Math.ceil(strength / 2);
  const filedIds = new Set<number>();
  for (const e of sorted) {
    if (filed >= half) break;
    filed += e.weight;
    filedIds.add(e.id);
  }
  c.evidence = c.evidence.filter((e) => !filedIds.has(e.id));
  if (log) log.raid = warned ? 'warned' : 'raid';
  s.lastResults.push({ kind: 'raid', textKey: warned ? 'warned' : 'raid', heat: s.heat - before, dirtyCash: -seized, success: false });
}

/** คืนนี้สารวัตรจะบุกไหม (แอปสายในโรงพักเตือนก่อน) */
export function raidTonight(s: GameState): boolean {
  const c = s.case;
  if (!c || caseStrength(s) < raidThreshold(s)) return false;
  return c.lastRaidDay === undefined || s.day - c.lastRaidDay >= raidCooldownDays;
}

/** โอกาสหนีลดลงตามน้ำหนักคดีบนบอร์ด */
export function caseEscapePenalty(s: GameState): number {
  return s.case ? caseStrength(s) * rule(s, 'caseEscapePerWeight') : 0;
}

// ---------- action ของผู้เล่น ----------
export function shapePlace(s: GameState, place: string, form: string): void {
  invariant(s.soi?.pendingShape === place, 'no place waiting for a decision');
  invariant((formIds as readonly string[]).includes(form), 'unknown place form');
  const f = form as PlaceForm;
  const cost = formCost[f];
  if (cost.cash < 0) invariant(s.dirtyCash + s.cleanCash >= -cost.cash, 'not enough money to fund this');
  const p = place as PlaceId;
  s.soi.places[p].form = f;
  delete s.soi.pendingShape;
  if (cost.cash > 0) s.dirtyCash += cost.cash;
  else if (cost.cash < 0) {
    const pay = -cost.cash;
    const fromDirty = Math.min(s.dirtyCash, pay);
    s.dirtyCash -= fromDirty;
    s.cleanCash -= pay - fromDirty;
  }
  s.heat += cost.heat;
  clampHeat(s);
  s.fame += cost.fame;
  if (f === 'local') s.karma += 2;
  if (f === 'patron') s.karma -= 1;
  changeRep(s, places[p].npc, cost.rep);
  (s.soi.shapedDays ??= []).push({ day: s.day, place: p, form: f });
  s.lastResults.push({ kind: 'soiShaped', textKey: `${p}:${f}` });
  if (placeIds.every((id) => s.soi?.places[id].form === 'local') && !s.flags.includes('soi_for_all')) s.flags.push('soi_for_all');
}

export function keepAppointment(s: GameState, npc: string): void {
  const soi = s.soi;
  const ap = soi?.appointment;
  invariant(soi && ap && ap.day === s.day, 'no appointment today');
  invariant((ap.npcs as readonly string[]).includes(npc), 'that neighbour did not ask');
  const chosen = npc as NpcId;
  const other = ap.npcs.find((n) => n !== chosen);
  const r = npcs[chosen].reward;
  if (r.cash) s.dirtyCash += r.cash;
  if (r.heat) { s.heat += r.heat; clampHeat(s); }
  if (r.fame) s.fame += r.fame;
  changeRep(s, chosen, 1);
  if (other) changeRep(s, other, -1);
  soi.kept = [...(soi.kept ?? []), { day: s.day, npc: chosen, ...(other ? { missed: other } : {}) }];
  delete soi.appointment;
  s.lastResults.push({ kind: 'soiMemory', textKey: `kept:${chosen}` });
}

export function caseAction(s: GameState, rng: Rng, kind: string, evidenceId?: number): void {
  const c = s.case;
  invariant(c, 'no case board');
  invariant(c.actedDay !== s.day, 'one move against the inspector per day');
  const pay = (n: number) => {
    invariant(s.dirtyCash + s.cleanCash >= n, 'not enough money');
    const fromDirty = Math.min(s.dirtyCash, n);
    s.dirtyCash -= fromDirty;
    s.cleanCash -= n - fromDirty;
  };
  if (kind === 'burn') {
    const e = c.evidence.find((x) => x.id === evidenceId && x.kind !== 'decoy');
    invariant(e, 'no such evidence');
    pay(burnCost(s, e.weight));
    c.evidence = c.evidence.filter((x) => x.id !== e.id);
    s.heat += 2;
    clampHeat(s);
    s.lastResults.push({ kind: 'caseMove', textKey: 'burn', success: true });
  } else if (kind === 'decoy') {
    invariant(!c.evidence.some((x) => x.kind === 'decoy'), 'one decoy at a time');
    pay(caseActions.decoy.price);
    c.evidence.push({ id: c.nextId++, kind: 'decoy', weight: 0, day: s.day });
    s.lastResults.push({ kind: 'caseMove', textKey: 'decoy', success: true });
  } else if (kind === 'tipoff') {
    const t = caseActions.tipoff;
    invariant(s.fame >= t.minFame, 'not famous enough to be believed');
    invariant(c.tipoffDay === undefined || s.day - c.tipoffDay >= t.cooldown, 'tip-off cooling down');
    c.tipoffDay = s.day;
    let cleared = 0;
    const real = c.evidence.filter((e) => e.kind !== 'decoy');
    while (cleared < t.clears && real.length > 0) {
      const i = rng.int(0, real.length - 1);
      const e = real[i];
      if (!e) break;
      const take = Math.min(e.weight, t.clears - cleared);
      e.weight -= take;
      cleared += take;
      if (e.weight <= 0) real.splice(i, 1);
    }
    c.evidence = c.evidence.filter((e) => e.kind === 'decoy' || e.weight > 0);
    s.heat += t.heat;
    clampHeat(s);
    s.karma += t.karma;
    if (!s.flags.includes('fed_the_inspector')) s.flags.push('fed_the_inspector');
    s.lastResults.push({ kind: 'caseMove', textKey: 'tipoff', success: true });
  } else invariant(false, 'unknown case move');
  c.actedDay = s.day;
}

export function burnCost(s: GameState, weight: number): number {
  return Math.round(caseActions.burn.perWeight * weight * (isAlly(s, 'auntie') ? 0.5 : 1) * (owns(s, 'app_shredder') ? 0.5 : 1));
}

/** ต้องตัดสินใจเรื่องซอยก่อนเริ่มงานวันนี้ไหม */
export function soiBlocker(s: GameState): 'shape' | 'appointment' | null {
  if (!s.soi) return null;
  if (s.soi.pendingShape) return 'shape';
  if (s.soi.appointment?.day === s.day) return 'appointment';
  return null;
}

/** ปิดท้ายรอบ: ธงสำหรับฉากจบใหม่ */
export function finishSoi(s: GameState): void {
  if (!s.case) return;
  if (s.case.peak >= rule(s, 'raidAt') && caseStrength(s) === 0 && !s.flags.includes('case_cold')) s.flags.push('case_cold');
}
