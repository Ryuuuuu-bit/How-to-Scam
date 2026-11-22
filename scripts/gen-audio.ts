// สร้างไฟล์เสียงด้วย ElevenLabs API (1 เทคต่อเสียง ไฟล์ที่มีอยู่แล้วจะข้าม ไม่เสียเครดิตซ้ำ)
// ใช้: npx tsx scripts/gen-audio.ts          → สร้างทุกไฟล์ที่ยังไม่มี
//      npx tsx scripts/gen-audio.ts --dry    → แสดงรายการและเครดิตโดยประมาณ ไม่เรียก API
// ต้องมี ELEVENLABS_API_KEY ใน .env.local (ไม่ขึ้น git)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AUDIO_FILES, VOICES } from '../client/src/audio/manifest';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'client/public/audio');
const dry = process.argv.includes('--dry');

function apiKey(): string {
  const fromEnv = process.env.ELEVENLABS_API_KEY;
  if (fromEnv) return fromEnv;
  const file = resolve(ROOT, '.env.local');
  if (existsSync(file)) {
    const line = readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('ELEVENLABS_API_KEY='));
    const v = line
      ?.slice('ELEVENLABS_API_KEY='.length)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (v) return v;
  }
  throw new Error('ไม่พบ ELEVENLABS_API_KEY ใน .env.local');
}

async function post(url: string, key: string, body: unknown): Promise<Buffer> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // แสดงแค่สถานะและข้อความ error ไม่แสดง key
    throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const todo = AUDIO_FILES.filter((f) => !existsSync(resolve(OUT, `${f.id}.mp3`)));
  const chars = todo.reduce((n, f) => n + (f.kind === 'voice' ? f.text.length : 0), 0);
  const sfxSec = todo.reduce((n, f) => n + (f.kind === 'sfx' ? f.seconds : 0), 0);
  console.log(`ต้องสร้าง ${todo.length} ไฟล์ (เสียงพากย์ ${chars} ตัวอักษร, เสียงประกอบ ${sfxSec} วินาที)`);
  if (dry) {
    for (const f of todo) console.log(' -', f.id);
    return;
  }
  const key = apiKey();
  let ok = 0;
  for (const f of todo) {
    const path = resolve(OUT, `${f.id}.mp3`);
    try {
      let audio: Buffer;
      if (f.kind === 'sfx') {
        audio = await post(
          'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
          key,
          {
            text: f.prompt,
            duration_seconds: f.seconds,
            prompt_influence: 0.5,
          },
        );
      } else {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[f.voice]}?output_format=mp3_44100_128`;
        try {
          audio = await post(url, key, {
            text: f.text,
            model_id: 'eleven_v3',
            language_code: 'th',
          });
        } catch (e) {
          // ถ้ารุ่น v3 ใช้ไม่ได้ ลองรุ่น multilingual (ไม่รองรับ [แท็ก] เลยตัดออก)
          console.warn(`  v3 ไม่ผ่าน (${String(e).slice(0, 80)}) ลอง multilingual_v2`);
          const plain = f.text.replace(/\[[^\]]*\]\s*/g, '');
          audio = await post(url, key, { text: plain, model_id: 'eleven_multilingual_v2' });
        }
      }
      writeFileSync(path, audio);
      ok++;
      console.log(`✓ ${f.id} (${Math.round(audio.length / 1024)} KB)`);
    } catch (e) {
      console.error(`✗ ${f.id}: ${String(e)}`);
    }
  }
  console.log(`เสร็จ ${ok}/${todo.length}`);
}

void main();
