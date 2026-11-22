import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import type { GameContent } from '@hts/shared';
import { attachUser, guestName, requireUser, signToken } from './auth';
import type { GoogleVerifier } from './auth';
import { HttpError, MAX_ACTIONS, startRun, submitRun } from './game';
import { isSeasonId, seasonFor } from './season';
import type { Board, Store, UserRec } from './store';

export interface AppDeps {
  store: Store;
  content: GameContent;
  jwtSecret: string;
  clientOrigins: string[];
  googleClientId?: string | undefined;
  verifyGoogle?: GoogleVerifier | undefined;
  /** ปิด rate limit ตอนทดสอบ */
  disableRateLimit?: boolean;
}

/** ข้อมูลผู้เล่นที่ส่งให้ client (ไม่มีอีเมล) */
export function publicUser(u: UserRec) {
  return {
    uid: u.id,
    shortId: u.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
    kind: u.kind,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    runsPlayed: u.runsPlayed,
    endings: u.endings,
  };
}

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).then((body) => res.json(body), next);
};

export function createApp(d: AppDeps) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: d.clientOrigins }));
  app.use(express.json({ limit: '512kb' }));
  app.use(attachUser(d.store, d.jwtSecret));

  const limit = (windowMin: number, max: number) =>
    d.disableRateLimit
      ? (_req: Request, _res: Response, next: NextFunction) => next()
      : rateLimit({
          windowMs: windowMin * 60_000,
          limit: max,
          standardHeaders: 'draft-8',
          legacyHeaders: false,
          keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
          message: { error: 'rate_limited' },
        });

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get(
    '/api/config',
    wrap(async () => ({
      googleClientId: d.googleClientId ?? null,
      season: seasonFor(new Date()).id,
    })),
  );

  // ---------- ผู้เล่น ----------
  app.post(
    '/api/auth/guest',
    limit(60, 20),
    wrap(async () => {
      const user = await d.store.createGuest(guestName());
      return { token: signToken(user.id, d.jwtSecret), user: publicUser(user) };
    }),
  );

  app.post(
    '/api/auth/google',
    limit(10, 30),
    wrap(async (req) => {
      if (!d.verifyGoogle) throw new HttpError(503, 'google_disabled');
      const { credential } = z.object({ credential: z.string().min(10) }).parse(req.body);
      const g = await d.verifyGoogle(credential);
      const existing = await d.store.findByGoogleSub(g.sub);
      let user: UserRec;
      if (existing) {
        user = existing;
      } else if (req.user && req.user.kind === 'guest') {
        // Guest ผูก Google: เก็บ UID และความคืบหน้าเดิมไว้
        user = await d.store.linkGoogle(req.user.id, g);
      } else {
        user = await d.store.createGoogleUser(g);
      }
      return { token: signToken(user.id, d.jwtSecret), user: publicUser(user) };
    }),
  );

  app.get(
    '/api/me',
    wrap(async (req) => ({ user: publicUser(requireUser(req)) })),
  );

  app.patch(
    '/api/me',
    limit(10, 20),
    wrap(async (req) => {
      const user = requireUser(req);
      const { displayName } = z
        .object({ displayName: z.string().trim().min(2).max(24) })
        .parse(req.body);
      return { user: publicUser(await d.store.renameUser(user.id, displayName)) };
    }),
  );

  // ---------- รอบการเล่น ----------
  app.post(
    '/api/runs',
    limit(10, 40),
    wrap(async (req) => {
      const user = requireUser(req);
      const { characterId } = z.object({ characterId: z.string().min(1).max(64) }).parse(req.body);
      return startRun(d.store, d.content, user, characterId);
    }),
  );

  app.post(
    '/api/runs/:id/submit',
    limit(10, 20),
    wrap(async (req) => {
      const user = requireUser(req);
      const runId = z.string().uuid().parse(req.params.id);
      const body = z.object({ actions: z.array(z.unknown()).max(MAX_ACTIONS) }).parse(req.body);
      const r = await submitRun(d.store, d.content, user, runId, body.actions);
      return { ...r, user: publicUser(r.user) };
    }),
  );

  // ---------- Leaderboard ----------
  app.get(
    '/api/leaderboard',
    wrap(async (req) => {
      const q = z
        .object({
          board: z.enum(['top', 'longest', 'fastest']).default('top'),
          season: z.string().optional(),
        })
        .parse(req.query);
      const seasonId = q.season && isSeasonId(q.season) ? q.season : seasonFor(new Date()).id;
      const rows = await d.store.leaderboard(seasonId, q.board as Board, 50);
      return { seasonId, board: q.board, rows };
    }),
  );

  app.get(
    '/api/seasons',
    wrap(async () => ({ current: seasonFor(new Date()).id, seasons: await d.store.seasons() })),
  );

  // ---------- จัดการ error ----------
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'bad_request' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}
