// content ที่หน้าจอใช้ ต้องตรงกับกติกาของรอบที่กำลังเล่น
// รอบใหม่ใช้โหมดเล่นสบาย (casualContent) ส่วนเซฟเก่าที่ยังเล่นค้างใช้ตัวเลขเดิม
// เป็น live binding: ทุกไฟล์ที่ import content จะเห็นชุดล่าสุดทันทีที่ selectRunContent ถูกเรียก
import { casualContent, contentForSeed } from '@hts/shared';
import { content as baseContent } from '@hts/shared/data';

const casual = casualContent(baseContent);

export let content = casual;

/** เลือก content ตาม seed ของรอบที่เปิดอยู่ (ไม่มีรอบ = กติกาใหม่) */
export function selectRunContent(seed: string | undefined): void {
  content = seed ? contentForSeed(baseContent, seed) : casual;
}
