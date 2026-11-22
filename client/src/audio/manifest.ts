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

// เสียงพากย์: ผู้เล่นขอไม่ใช้ (2026-11-22) เก็บโครงไว้เผื่ออนาคต
export const LINES: VoiceSpec[] = [];

export const AUDIO_FILES = [...SFX, ...LINES];
