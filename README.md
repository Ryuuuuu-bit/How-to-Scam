# How to Scam

เกมซิมูเลเตอร์สแกมเมอร์แนวตลกร้าย (satire) แบบ roguelite — 1 รอบ = 30 วันในเกม
เนื้อหาทั้งหมดเป็นมุกที่แต่งขึ้น ชื่อคน/องค์กรทั้งหมดเป็นชื่อสมมติ และจบทุกรอบด้วยการ์ด "สัญญาณอันตราย" สอนวิธีสังเกตมิจฉาชีพจริง

## โครงสร้าง

```
shared/   เอนจินเกม (pure function + seeded RNG) และข้อมูลเกม ใช้ร่วมกันทั้ง client และ server
  src/engine/   logic ของเกม
  src/types/    ชนิดข้อมูล
  data/         เนื้อหาเกม (วิธีโกง การ์ด เหตุการณ์ ฉากจบ ฯลฯ) แก้ตรงนี้ได้โดยไม่ต้องแตะ logic
  test/         unit test (Vitest)
client/   (Phase 2) Vite + React + Tailwind
server/   (Phase 3) Express + Prisma + PostgreSQL
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
