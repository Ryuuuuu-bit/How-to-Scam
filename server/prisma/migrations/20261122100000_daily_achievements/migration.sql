-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyPlays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "dailyDate" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'normal';

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "dailyDate" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'normal';

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Run_userId_dailyDate_key" ON "Run"("userId", "dailyDate");

-- CreateIndex
CREATE INDEX "Score_dailyDate_score_idx" ON "Score"("dailyDate", "score");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

