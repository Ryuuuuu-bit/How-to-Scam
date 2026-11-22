ALTER TABLE "User" ADD COLUMN "lastOnlineAt" TIMESTAMP(3);
CREATE INDEX "User_lastOnlineAt_idx" ON "User"("lastOnlineAt");
