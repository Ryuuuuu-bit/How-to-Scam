import { randomUUID } from 'node:crypto';
import type { Board, BoardRow, RunRec, ScoreInput, Store, UserRec } from '../src/store';

/** Store ในหน่วยความจำ สำหรับ test (พฤติกรรมเดียวกับ prismaStore) */
export function memoryStore(): Store & {
  users: UserRec[];
  runs: (RunRec & { reject?: string })[];
  scores: (ScoreInput & { createdAt: Date })[];
} {
  const users: UserRec[] = [];
  const runs: (RunRec & { reject?: string })[] = [];
  const scores: (ScoreInput & { createdAt: Date })[] = [];
  const mk = (p: Partial<UserRec>): UserRec => ({
    id: randomUUID(),
    kind: 'guest',
    googleSub: null,
    email: null,
    displayName: 'x',
    avatarUrl: null,
    xp: 0,
    runsPlayed: 0,
    endings: [],
    createdAt: new Date(),
    ...p,
  });
  const find = (id: string) => users.find((u) => u.id === id) ?? null;
  return {
    users,
    runs,
    scores,
    async createGuest(displayName) {
      const u = mk({ displayName });
      users.push(u);
      return u;
    },
    async findUser(id) {
      return find(id);
    },
    async findByGoogleSub(sub) {
      return users.find((u) => u.googleSub === sub) ?? null;
    },
    async linkGoogle(userId, g) {
      const u = find(userId);
      if (!u) throw new Error('no user');
      Object.assign(u, {
        kind: 'google',
        googleSub: g.sub,
        email: g.email,
        displayName: g.name,
        avatarUrl: g.picture,
      });
      return u;
    },
    async createGoogleUser(g) {
      const u = mk({
        kind: 'google',
        googleSub: g.sub,
        email: g.email,
        displayName: g.name,
        avatarUrl: g.picture,
      });
      users.push(u);
      return u;
    },
    async renameUser(userId, displayName) {
      const u = find(userId);
      if (!u) throw new Error('no user');
      u.displayName = displayName;
      return u;
    },
    async createRun(userId, characterId, seed) {
      const r: RunRec = {
        id: randomUUID(),
        userId,
        characterId,
        seed,
        status: 'started',
        createdAt: new Date(),
      };
      runs.push(r);
      return r;
    },
    async findRun(id) {
      return runs.find((r) => r.id === id) ?? null;
    },
    async countRecentRuns(userId, since) {
      return runs.filter((r) => r.userId === userId && r.createdAt >= since).length;
    },
    async saveScore(s) {
      const run = runs.find((r) => r.id === s.runId);
      if (run) run.status = 'submitted';
      scores.push({ ...s, createdAt: new Date() });
      const u = find(s.userId);
      if (!u) throw new Error('no user');
      u.xp += s.xpGained;
      u.runsPlayed += 1;
      if (!u.endings.includes(s.endingId)) u.endings.push(s.endingId);
      return u;
    },
    async rejectRun(runId, reason) {
      const run = runs.find((r) => r.id === runId);
      if (run) {
        run.status = 'rejected';
        run.reject = reason;
      }
    },
    async leaderboard(seasonId, board: Board, limit) {
      const rows = scores
        .filter((s) => s.season.id === seasonId && (board !== 'fastest' || s.reason === 'caught'))
        .sort((a, b) =>
          board === 'top'
            ? b.score - a.score
            : board === 'longest'
              ? b.days - a.days || b.score - a.score
              : a.days - b.days,
        );
      const seen = new Set<string>();
      const out: BoardRow[] = [];
      for (const r of rows) {
        if (seen.has(r.userId)) continue;
        seen.add(r.userId);
        const u = find(r.userId);
        out.push({
          rank: out.length + 1,
          userId: r.userId,
          displayName: u?.displayName ?? '',
          avatarUrl: u?.avatarUrl ?? null,
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
      return (
        new Set(
          scores.filter((s) => s.season.id === seasonId && s.score > score).map((s) => s.userId),
        ).size + 1
      );
    },
    async seasons() {
      const m: Record<string, Set<string>> = {};
      for (const s of scores) (m[s.season.id] ??= new Set()).add(s.userId);
      return Object.entries(m).map(([id, set]) => ({ id, players: set.size }));
    },
  };
}
