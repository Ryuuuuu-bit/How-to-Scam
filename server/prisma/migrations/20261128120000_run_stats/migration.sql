-- สถิติรอบสำหรับกระดานรายสัปดาห์แบบมีธีม (วันเสียว, Heat สูงสุดที่รอด, งานด่วนติดกัน, รุ่นของสายสืบทอด)
ALTER TABLE "Score" ADD COLUMN "edgeDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Score" ADD COLUMN "peakHeat" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Score" ADD COLUMN "rushStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Score" ADD COLUMN "generation" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Score_createdAt_idx" ON "Score"("createdAt");
