import { defineConfig } from 'prisma/config';

// Prisma 7: ตั้งค่า datasource ที่นี่แทนใน schema
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/hts' },
});
