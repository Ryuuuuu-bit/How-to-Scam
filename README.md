# How to Scam

เกมซิมูเลเตอร์สแกมเมอร์แนวตลกร้าย (satire) แบบ roguelite — 1 รอบ = 30, 60 หรือ 90 วันในเกม
เนื้อหาทั้งหมดเป็นมุกที่แต่งขึ้น ชื่อคน/องค์กรทั้งหมดเป็นชื่อสมมติ และจบทุกรอบด้วยการ์ด "สัญญาณอันตราย" สอนวิธีสังเกตมิจฉาชีพจริง

เล่นได้ที่ https://how-to-scam.up.railway.app

## ระบบหลัก

- **ในรอบ**: วางแผนงานตอนเช้า ลงมือ อ่านผลและเหตุการณ์ ฟอกเงิน แล้วช้อปที่ร้านอัปเกรดท้ายวัน (ตลาดมืดรายคืน ดีลเถื่อนเฮียโต้ง แอปมือถือ ห้องลับ ของประจำสถานที่)
- **ซอยมีชีวิต (1.0)**: สถานที่เปลี่ยนร่างตามทางที่เลือก เพื่อนบ้านจำได้ สารวัตรหมูกระทะสะสมหลักฐานบนบอร์ดคดีแล้วบุกค้น
- **Heat**: ถึง 100 ต้องหนีตำรวจ โดนจับแล้วยังสู้คดีได้
- **หลังจบรอบ**: ค่าหัว (ยศถาวรจาก xp) กับเงินใต้ดิน (ใช้ในตลาดใต้ดิน) ตัวละครเริ่มต้น 3 ตัว อีก 8 ตัวซื้อหรือปลดฟรีด้วยออดิชั่น อีก 3 ตัวปลดด้วยค่าหัว
- **ออนไลน์**: Guest/Google, กระดานคะแนนรายเดือนแยกตามความยาวรอบ, Daily Challenge, เหรียญความสำเร็จ, หอฉากจบ

## โครงสร้าง

```
shared/   เอนจินเกม (pure function + seeded RNG) และข้อมูลเกม ใช้ร่วมกันทั้ง client และ server
  src/engine/   logic ของเกม
  src/types/    ชนิดข้อมูล
  data/         เนื้อหาเกม (วิธีโกง การ์ด เหตุการณ์ ฉากจบ ฯลฯ) แก้ตรงนี้ได้โดยไม่ต้องแตะ logic
  test/         unit test (Vitest)
client/   Vite + React + Tailwind
server/   Express + Prisma + PostgreSQL (server replay action log เพื่อตรวจคะแนน)
art/      สคริปต์ตัดภาพที่ทำจาก ChatGPT ลง client/src/assets/img
```

## รันบนเครื่อง

ต้องมี Node 20+ และ pnpm

```sh
pnpm install
pnpm test        # unit test
pnpm typecheck
pnpm lint
pnpm format
```

## หลักของเอนจิน

- `newGame(seed, characterId, content)` เริ่มรอบ
- `step(state, action, content)` คืน state ใหม่ ไม่แก้ของเดิม action ผิดกติกาโยน `InvalidActionError`
- `replay(seed, characterId, actions, content)` เล่นซ้ำจาก action log — server ใช้คำนวณคะแนนเอง ไม่เชื่อคะแนนจาก client
- `toPublicView(state)` ตัด Karma และสถานะ RNG ออกก่อนส่งให้ UI

## Deploy

Railway deploy อัตโนมัติจาก `main` (service `client` และ `server`) server รัน `prisma migrate deploy` ก่อนสตาร์ททุกครั้ง
