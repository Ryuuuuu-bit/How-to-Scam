-- เงินใต้ดิน (เงินไว้ซื้อของในตลาดใต้ดิน) และของที่ซื้อแล้ว
ALTER TABLE "User" ADD COLUMN "money" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "owned" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ผู้เล่นที่เคยเล่นแล้วได้ตัวละครที่เคยเปิดให้เล่นครบเหมือนเดิม
UPDATE "User"
SET "owned" = ARRAY[
  'char:live_seller', 'char:phone_tech', 'char:fortune_teller', 'char:rich_coach',
  'char:fallen_star', 'char:ex_banker', 'char:share_auntie', 'char:orange_cat'
]::TEXT[]
WHERE "runsPlayed" > 0;
