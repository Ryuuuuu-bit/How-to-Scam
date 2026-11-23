import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { scopeWhere } from './store';
import type { Board, BoardRow, GoogleProfile, RunRec, ScoreInput, Store } from './store';

export function createPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

/** Store ที่เก็บจริงใน Postgres ผ่าน Prisma */
export function prismaStore(db: PrismaClient): Store {
  return {
    async saveFeedback(userId, category, message) {
      await db.feedback.create({ data: { userId, category, message } });
    },
    async markOnline(userId, now, since) {
      return db.$transaction(async (tx) => {
        await tx.$executeRaw`UPDATE "User" SET "lastOnlineAt" = ${now} WHERE id = ${userId}`;
        const rows = await tx.$queryRaw<
          { count: number }[]
        >`SELECT COUNT(*)::int AS count FROM "User" WHERE "lastOnlineAt" > ${since}`;
        return rows[0]?.count ?? 0;
      });
    },
    async createGuest(displayName) {
      return db.user.create({ data: { displayName, kind: 'guest' } });
    },
    async findUser(id) {
      return db.user.findUnique({ where: { id } });
    },
    async findByGoogleSub(sub) {
      return db.user.findUnique({ where: { googleSub: sub } });
    },
    async linkGoogle(userId, g: GoogleProfile) {
      return db.user.update({
        where: { id: userId },
        data: {
          kind: 'google',
          googleSub: g.sub,
          email: g.email,
          avatarUrl: g.picture,
          displayName: g.name,
        },
      });
    },
    async createGoogleUser(g) {
      return db.user.create({
        data: {
          kind: 'google',
          googleSub: g.sub,
          email: g.email,
          avatarUrl: g.picture,
          displayName: g.name,
        },
      });
    },
    async renameUser(userId, displayName) {
      return db.user.update({ where: { id: userId }, data: { displayName } });
    },
    async achievementsOf(userId) {
      const rows = await db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      return rows.map((r) => r.achievementId);
    },
    async createRun(r) {
      return (await db.run.create({ data: r })) as RunRec;
    },
    async findRun(id) {
      return (await db.run.findUnique({ where: { id } })) as RunRec | null;
    },
    async findDailyRun(userId, dailyDate) {
      return (await db.run.findUnique({
        where: { userId_dailyDate: { userId, dailyDate } },
      })) as RunRec | null;
    },
    async countRecentRuns(userId, since) {
      return db.run.count({ where: { userId, createdAt: { gte: since } } });
    },
    async saveScore(s: ScoreInput) {
      return db.$transaction(async (tx) => {
        await tx.season.upsert({
          where: { id: s.season.id },
          create: { id: s.season.id, startsAt: s.season.startsAt, endsAt: s.season.endsAt },
          update: {},
        });
        await tx.run.update({
          where: { id: s.runId },
          data: { status: 'submitted', submittedAt: new Date(), actionCount: s.actionCount },
        });
        await tx.score.create({
          data: {
            runId: s.runId,
            userId: s.userId,
            seasonId: s.season.id,
            mode: s.mode,
            dailyDate: s.dailyDate,
            characterId: s.characterId,
            score: s.score,
            cleanCash: s.cleanCash,
            days: s.days,
            reason: s.reason,
            endingId: s.endingId,
            titleId: s.titleId,
          },
        });
        if (s.newAchievements.length > 0) {
          await tx.userAchievement.createMany({
            data: s.newAchievements.map((achievementId) => ({ userId: s.userId, achievementId })),
            skipDuplicates: true,
          });
        }
        const u = await tx.user.findUniqueOrThrow({ where: { id: s.userId } });
        return tx.user.update({
          where: { id: s.userId },
          data: {
            xp: { increment: s.xpGained },
            runsPlayed: { increment: 1 },
            ...(s.mode === 'daily' ? { dailyPlays: { increment: 1 } } : {}),
            endings: u.endings.includes(s.endingId) ? u.endings : [...u.endings, s.endingId],
          },
        });
      });
    },
    async rejectRun(runId, reason, actionCount) {
      await db.run.update({
        where: { id: runId },
        data: { status: 'rejected', rejectReason: reason.slice(0, 200), actionCount },
      });
    },
    async leaderboard(scope, board: Board, limit) {
      const base = scopeWhere(scope);
      const where = board === 'fastest' ? { ...base, reason: 'caught' } : base;
      const orderBy =
        board === 'top'
          ? [{ score: 'desc' as const }, { createdAt: 'asc' as const }]
          : board === 'longest'
            ? [{ days: 'desc' as const }, { score: 'desc' as const }]
            : [{ days: 'asc' as const }, { createdAt: 'asc' as const }];
      const rows = await db.score.findMany({
        where,
        orderBy,
        take: limit * 6,
        include: { user: { select: { displayName: true, avatarUrl: true } } },
      });
      // เก็บสถิติดีที่สุดของแต่ละคนเท่านั้น
      const seen = new Set<string>();
      const out: BoardRow[] = [];
      for (const r of rows) {
        if (seen.has(r.userId)) continue;
        seen.add(r.userId);
        out.push({
          rank: out.length + 1,
          userId: r.userId,
          displayName: r.user.displayName,
          avatarUrl: r.user.avatarUrl,
          characterId: r.characterId,
          score: r.score,
          days: r.days,
          reason: r.reason,
          titleId: r.titleId,
          createdAt: r.createdAt,
        });
        if (out.length >= limit) break;
      }
      return out;
    },
    async rankOf(scope, score) {
      const better = await db.score.groupBy({
        by: ['userId'],
        where: { ...scopeWhere(scope), score: { gt: score } },
      });
      return better.length + 1;
    },
    async dailyScore(userId, dailyDate) {
      return db.score.findFirst({
        where: { userId, mode: 'daily', dailyDate },
        select: { score: true, titleId: true },
      });
    },
    async seasons() {
      const rows = await db.score.groupBy({
        by: ['seasonId', 'userId'],
        where: { mode: { in: ['normal', 'normal60', 'normal90'] } },
      });
      const count: Record<string, number> = {};
      for (const r of rows) count[r.seasonId] = (count[r.seasonId] ?? 0) + 1;
      return Object.entries(count)
        .map(([id, players]) => ({ id, players }))
        .sort((a, b) => b.id.localeCompare(a.id));
    },
  };
}
