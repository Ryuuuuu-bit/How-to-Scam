import { validateContent } from '@hts/shared';
import { content as gameContent } from '@hts/shared/data';
import { createApp } from './app';
import { googleVerifier } from './auth';
import { loadEnv } from './env';
import { createPrisma, prismaStore } from './prismaStore';

const env = loadEnv();
const problems = validateContent(gameContent);
if (problems.length > 0) {
  console.error('game content invalid:', problems);
  process.exit(1);
}

const db = createPrisma(env.DATABASE_URL);
const app = createApp({
  store: prismaStore(db),
  content: gameContent,
  jwtSecret: env.JWT_SECRET,
  clientOrigins: env.CLIENT_ORIGIN.split(',').map((s) => s.trim()),
  googleClientId: env.GOOGLE_CLIENT_ID,
  verifyGoogle: env.GOOGLE_CLIENT_ID ? googleVerifier(env.GOOGLE_CLIENT_ID) : undefined,
});

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`How to Scam server on :${env.PORT}`);
});
