/** action ไม่ถูกต้องในสถานะปัจจุบัน — server ใช้ปฏิเสธ action log ที่ถูกปลอม */
export class InvalidActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidActionError';
  }
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InvalidActionError(message);
}
