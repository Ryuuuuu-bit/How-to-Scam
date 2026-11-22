import { z } from 'zod';

// ค่าตั้งค่าจาก environment variables (Railway ตั้งให้)
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  /** กุญแจเซ็น token ผู้เล่น — บน Railway ตั้งเป็น ${{secret(48)}} */
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(8080),
  /** โดเมนของหน้าเกม คั่นด้วย , ได้หลายอัน */
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  /** OAuth Client ID จาก Google Cloud (ไม่ใส่ = ปิดปุ่ม Google) */
  GOOGLE_CLIENT_ID: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return schema.parse(source);
}
