-- สมุดภาพการ์ดเหยื่อกับประวัติข้ามรอบ (ยศในซอย) ย้ายจากเครื่องผู้เล่นมาเก็บที่ server
ALTER TABLE "User" ADD COLUMN "scrapbook" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN "career" JSONB NOT NULL DEFAULT '{}';
