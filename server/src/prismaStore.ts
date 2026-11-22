import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import type { Board, BoardRow, GoogleProfile, RunRec, ScoreInput, Store, UserRec } from './store';

export function createPrisma(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

/** Store ที่เก็บจริงใน Postgres ผ่าน Prisma */
export function prismaStore(db: PrismaClient): Store {
  const toUser = (u: UserRec): UserRec => u;
  return {
    async createGuest(displayName) {
      return toUser(await db.user.create({ data: { displayName, kind: 'guest' } }));
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
    async createRun(userId, characterId, seed) {
      return (await db.run.create({ data: { userId, characterId, seed } })) as RunRec;
    },
    async findRun(id) {
      return (await db.run.findUnique({ where: { id } })) as RunRec | null;
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
            characterId: s.characterId,
            score: s.score,
            cleanCash: s.cleanCash,
            days: s.days,
            reason: s.reason,
            endingId: s.endingId,
            titleId: s.titleId,
          },
        });
        const u = await tx.user.findUniqueOrThrow({ where: { id: s.userId } });
        return tx.user.update({
          where: { id: s.userId },
          data: {
            xp: { increment: s.xpGained },
            runsPlayed: { increment: 1 },
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
    async leaderboard(seasonId, board: Board, limit) {
      const where = board === 'fastest' ? { seasonId, reason: 'caught' } : { seasonId };
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
    async rankOf(seasonId, score) {
      const better = await db.score.groupBy({
        by: ['userId'],
        where: { seasonId, score: { gt: score } },
      });
      return better.length + 1;
    },
    async seasons() {
      const rows = await db.score.groupBy({ by: ['seasonId', 'userId'] });
      const count: Record<string, number> = {};
      for (const r of rows) count[r.seasonId] = (count[r.seasonId] ?? 0) + 1;
      return Object.entries(count)
        .map(([id, players]) => ({ id, players }))
        .sort((a, b) => b.id.localeCompare(a.id));
    },
  };
}
