import { randomUUID } from 'node:crypto';
import type { Board, BoardRow, RunRec, Scope, ScoreInput, Store, UserRec } from '../src/store';
import { weeklyColumn } from '../src/store';

type ScoreRow = ScoreInput & { createdAt: Date };

const inScope = (s: ScoreRow, scope: Scope) =>
  'dailyDate' in scope
    ? s.mode === 'daily' && s.dailyDate === scope.dailyDate
    : s.mode === (scope.mode ?? 'normal') && s.season.id === scope.seasonId;

/** Store ในหน่วยความจำ สำหรับ test (พฤติกรรมเดียวกับ prismaStore) */
export function memoryStore() {
  const users: UserRec[] = [];
  const feedback: { userId: string; category: string; message: string }[] = [];
  const presence = new Map<string, number>();
  const runs: (RunRec & { reject?: string })[] = [];
  const scores: ScoreRow[] = [];
  const ach: { userId: string; id: string }[] = [];
  const mk = (p: Partial<UserRec>): UserRec => ({
    id: randomUUID(),
    kind: 'guest',
    googleSub: null,
    email: null,
    displayName: 'x',
    avatarUrl: null,
    xp: 0,
    runsPlayed: 0,
    dailyPlays: 0,
    endings: [],
    money: 0,
    owned: [],
    scrapbook: {},
    career: {},
    createdAt: new Date(),
    ...p,
  });
  const find = (id: string) => users.find((u) => u.id === id) ?? null;
  const must = (id: string) => {
    const u = find(id);
    if (!u) throw new Error('no user');
    return u;
  };
  const store: Store = {
    async saveFeedback(userId, category, message) {
      feedback.push({ userId, category, message });
    },
    async markOnline(id, now, since) {
      presence.set(id, now.getTime());
      return Array.from(presence.values()).filter((at) => at > since.getTime()).length;
    },
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
      const u = must(userId);
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
      const u = must(userId);
      u.displayName = displayName;
      return u;
    },
    async achievementsOf(userId) {
      return ach.filter((a) => a.userId === userId).map((a) => a.id);
    },
    async createRun(r) {
      if (r.dailyDate && runs.some((x) => x.userId === r.userId && x.dailyDate === r.dailyDate)) {
        throw new Error('unique violation');
      }
      const run: RunRec = { id: randomUUID(), ...r, status: 'started', createdAt: new Date() };
      runs.push(run);
      return run;
    },
    async findRun(id) {
      return runs.find((r) => r.id === id) ?? null;
    },
    async findDailyRun(userId, dailyDate) {
      return runs.find((r) => r.userId === userId && r.dailyDate === dailyDate) ?? null;
    },
    async countRecentRuns(userId, since) {
      return runs.filter((r) => r.userId === userId && r.createdAt >= since).length;
    },
    async saveScore(s) {
      const run = runs.find((r) => r.id === s.runId);
      if (run) run.status = 'submitted';
      scores.push({ ...s, createdAt: new Date() });
      for (const id of s.newAchievements) ach.push({ userId: s.userId, id });
      const u = must(s.userId);
      u.xp += s.xpGained;
      u.money += s.moneyGained;
      for (const k of s.newOwned) if (!u.owned.includes(k)) u.owned.push(k);
      u.runsPlayed += 1;
      if (s.mode === 'daily') u.dailyPlays += 1;
      if (!u.endings.includes(s.endingId)) u.endings.push(s.endingId);
      Object.assign(u, s.collect(u.scrapbook, u.career));
      return u;
    },
    async buyItem(userId, key, price) {
      const u = must(userId);
      if (u.money < price || u.owned.includes(key)) return null;
      u.money -= price;
      u.owned.push(key);
      return u;
    },
    async mergeCollection(userId, merge) {
      const u = must(userId);
      Object.assign(u, merge(u.scrapbook, u.career));
      return u;
    },
    async rejectRun(runId, reason) {
      const run = runs.find((r) => r.id === runId);
      if (run) {
        run.status = 'rejected';
        run.reject = reason;
      }
    },
    async weekly(theme, since, until, limit) {
      const col = weeklyColumn[theme];
      const min = theme === 'lineage' ? 1 : 0;
      const rows = scores
        .filter((s) => s.createdAt >= since && s.createdAt < until && s[col] > min)
        .sort((a, b) => b[col] - a[col] || b.score - a.score);
      const seen = new Set<string>();
      const out: BoardRow[] = [];
      for (const r of rows) {
        if (seen.has(r.userId) || out.length >= limit) continue;
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
          value: r[col],
        });
      }
      return out;
    },
    async leaderboard(scope, board: Board, limit) {
      const rows = scores
        .filter((s) => inScope(s, scope) && (board !== 'fastest' || s.reason === 'caught'))
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
    async rankOf(scope, score) {
      return (
        new Set(scores.filter((s) => inScope(s, scope) && s.score > score).map((s) => s.userId))
          .size + 1
      );
    },
    async dailyScore(userId, dailyDate) {
      const s = scores.find(
        (x) => x.userId === userId && x.mode === 'daily' && x.dailyDate === dailyDate,
      );
      return s ? { score: s.score, titleId: s.titleId } : null;
    },
    async seasons() {
      const m: Record<string, Set<string>> = {};
      for (const s of scores) if (s.mode !== 'daily') (m[s.season.id] ??= new Set()).add(s.userId);
      return Object.entries(m).map(([id, set]) => ({ id, players: set.size }));
    },
  };
  return Object.assign(store, { users, runs, scores, feedback });
}
