import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newGame, replay, step, unlockedMethods } from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { createApp } from '../src/app';
import { seasonFor } from '../src/season';
import { memoryStore } from './memoryStore';

const store = memoryStore();
let server: Server;
let base = '';

beforeAll(async () => {
  const app = createApp({
    store,
    content,
    jwtSecret: 'test-secret-test-secret',
    clientOrigins: ['http://localhost:5173'],
    googleClientId: 'test-client',
    // ตัวตรวจ Google ปลอม: credential "g:<sub>" ถือว่าถูกต้อง
    verifyGoogle: async (credential) => {
      if (!credential.startsWith('g:')) throw new Error('bad');
      const sub = credential.slice(2);
      return { sub, email: `${sub}@example.com`, name: `ผู้เล่น ${sub}`, picture: null };
    },
    disableRateLimit: true,
  });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  server.close();
});

async function api(path: string, opts: { method?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(base + path, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function guest() {
  const r = await api('/api/auth/guest', { method: 'POST' });
  return r.body as { token: string; user: { uid: string; kind: string } };
}

/** บอทง่ายๆ เล่นจนจบ */
function play(seed: string, characterId: string): Action[] {
  let s: GameState = newGame(seed, characterId, content);
  const actions: Action[] = [];
  for (let i = 0; i < 3000 && s.phase !== 'ended'; i++) {
    const money = s.dirtyCash + s.cleanCash;
    let a: Action;
    switch (s.phase) {
      case 'plan': {
        const m = unlockedMethods(s, content).find((x) => x.cost <= money);
        a =
          s.heat > 80 || !m
            ? { t: 'choosePlan', methodId: null }
            : { t: 'choosePlan', methodId: m.id };
        break;
      }
      case 'invest':
        a = { t: 'confirmInvest' };
        break;
      case 'call':
        a = { t: 'callPitch', pitchId: s.call?.pitchIds[0] ?? '' };
        break;
      case 'event':
        a = { t: 'eventChoice', choiceIdx: 0 };
        break;
      case 'launder':
        a = { t: 'launder', cardId: s.launderOffer[0] ?? null };
        break;
      case 'shop':
        a = { t: 'endDay' };
        break;
      default:
        a = { t: 'escapeAttempt' };
    }
    actions.push(a);
    s = step(s, a, content);
  }
  return actions;
}

describe('ผู้เล่น', () => {
  it('Guest ได้ UID ของตัวเอง และอ่านโปรไฟล์ได้', async () => {
    const g = await guest();
    expect(g.user.uid).toMatch(/[0-9a-f-]{36}/);
    expect(g.user.kind).toBe('guest');
    const me = await api('/api/me', { token: g.token });
    expect((me.body.user as { uid: string }).uid).toBe(g.user.uid);
  });

  it('token ปลอมเข้าไม่ได้', async () => {
    const me = await api('/api/me', { token: 'nope' });
    expect(me.status).toBe(401);
  });

  it('Guest ผูก Google แล้วได้ UID เดิม และล็อกอิน Google ซ้ำได้คนเดิม', async () => {
    const g = await guest();
    const linked = await api('/api/auth/google', {
      token: g.token,
      body: { credential: 'g:alice-account' },
    });
    const user = linked.body.user as { uid: string; kind: string };
    expect(user.uid).toBe(g.user.uid);
    expect(user.kind).toBe('google');
    const again = await api('/api/auth/google', { body: { credential: 'g:alice-account' } });
    expect((again.body.user as { uid: string }).uid).toBe(g.user.uid);
  });

  it('ไม่ส่งอีเมลกลับไปให้ client', async () => {
    const r = await api('/api/auth/google', { body: { credential: 'g:bob-account' } });
    expect(JSON.stringify(r.body)).not.toContain('@example.com');
  });

  it('เปลี่ยนชื่อได้', async () => {
    const g = await guest();
    const r = await api('/api/me', {
      method: 'PATCH',
      token: g.token,
      body: { displayName: 'เจ้าพ่อทดสอบ' },
    });
    expect((r.body.user as { displayName: string }).displayName).toBe('เจ้าพ่อทดสอบ');
  });
});

describe('ส่งคะแนน (anti-cheat)', () => {
  it('server ออก seed แล้ว replay ได้คะแนนตรงกับที่เล่นจริง', async () => {
    const g = await guest();
    const start = await api('/api/runs', { token: g.token, body: { characterId: 'ex_insurance' } });
    expect(start.status).toBe(200);
    const { runId, seed } = start.body as { runId: string; seed: string };
    const actions = play(seed, 'ex_insurance');
    const local = replay(seed, 'ex_insurance', actions, content);
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions } });
    expect(sub.status).toBe(200);
    expect(sub.body.score).toBe(local.end?.score);
    expect(sub.body.rank).toBeGreaterThanOrEqual(1);
    expect(typeof sub.body.titleId).toBe('string');
    expect((sub.body.user as { xp: number }).xp).toBeGreaterThan(0);

    const lb = await api('/api/leaderboard?board=top');
    const rows = lb.body.rows as { userId: string; score: number }[];
    expect(rows.some((r) => r.userId === g.user.uid && r.score === local.end?.score)).toBe(true);

    // ส่งซ้ำไม่ได้
    const again = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions } });
    expect(again.status).toBe(409);
  });

  it('action log ที่ถูกแก้จนผิดกติกาถูกปฏิเสธ', async () => {
    const g = await guest();
    const { runId, seed } = (
      await api('/api/runs', { token: g.token, body: { characterId: 'ex_insurance' } })
    ).body as { runId: string; seed: string };
    const actions = play(seed, 'ex_insurance');
    // โกง: ข้ามไปเลือกวิธีที่ยังไม่ปลดล็อกตั้งแต่วันแรก
    actions[0] = { t: 'choosePlan', methodId: 'ponzi' };
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions } });
    expect(sub.status).toBe(422);
    expect(store.runs.find((r) => r.id === runId)?.status).toBe('rejected');
  });

  it('คะแนนจาก seed อื่นใช้ไม่ได้ (เล่นด้วย seed ที่ตัวเองสุ่ม)', async () => {
    const g = await guest();
    const { runId } = (
      await api('/api/runs', { token: g.token, body: { characterId: 'ex_insurance' } })
    ).body as { runId: string };
    const actions = play('my-own-lucky-seed', 'ex_insurance');
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions } });
    // replay ด้วย seed จริงจะผิดกติกากลางทาง หรือคะแนนไม่เท่ากับที่เล่น
    if (sub.status === 200) {
      expect(sub.body.score).not.toBe(
        replay('my-own-lucky-seed', 'ex_insurance', actions, content).end?.score,
      );
    } else {
      expect([422]).toContain(sub.status);
    }
  });

  it('ยังเล่นไม่จบส่งไม่ได้', async () => {
    const g = await guest();
    const { runId } = (
      await api('/api/runs', { token: g.token, body: { characterId: 'ex_insurance' } })
    ).body as { runId: string };
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions: [] } });
    expect(sub.status).toBe(422);
    expect(sub.body.error).toBe('run_not_finished');
  });

  it('ส่งรอบของคนอื่นไม่ได้', async () => {
    const a = await guest();
    const b = await guest();
    const { runId } = (
      await api('/api/runs', { token: a.token, body: { characterId: 'ex_insurance' } })
    ).body as { runId: string };
    const sub = await api(`/api/runs/${runId}/submit`, { token: b.token, body: { actions: [] } });
    expect(sub.status).toBe(404);
  });

  it('อาชีพที่ยังไม่ปลดล็อกเริ่มรอบไม่ได้', async () => {
    const g = await guest();
    const r = await api('/api/runs', { token: g.token, body: { characterId: 'ex_banker' } });
    expect(r.status).toBe(403);
  });

  it('ไม่ล็อกอินเริ่มรอบไม่ได้', async () => {
    const r = await api('/api/runs', { body: { characterId: 'ex_insurance' } });
    expect(r.status).toBe(401);
  });
});

describe('ซีซั่น', () => {
  it('นับเดือนตามเวลาไทย', () => {
    // 31 ต.ค. 18:00 UTC = 1 พ.ย. 01:00 เวลาไทย
    expect(seasonFor(new Date('2026-10-31T18:00:00Z')).id).toBe('2026-11');
    expect(seasonFor(new Date('2026-10-31T16:00:00Z')).id).toBe('2026-10');
  });
});

describe('Daily Challenge และเหรียญ', () => {
  it('ทุกคนได้ seed และอาชีพเดียวกันในวันเดียวกัน และนับได้วันละรอบ', async () => {
    const a = await guest();
    const b = await guest();
    const sa = (await api('/api/daily/start', { token: a.token, body: {} })).body as {
      runId: string;
      seed: string;
      characterId: string;
    };
    const sb = (await api('/api/daily/start', { token: b.token, body: {} })).body as {
      seed: string;
      characterId: string;
    };
    expect(sa.seed).toBe(sb.seed);
    expect(sa.characterId).toBe(sb.characterId);
    // เริ่มซ้ำได้ seed เดิม (เล่นต่อ)
    const again = (await api('/api/daily/start', { token: a.token, body: {} })).body as {
      runId: string;
    };
    expect(again.runId).toBe(sa.runId);

    const actions = play(sa.seed, sa.characterId);
    const sub = await api(`/api/runs/${sa.runId}/submit`, { token: a.token, body: { actions } });
    expect(sub.status).toBe(200);
    expect(sub.body.mode).toBe('daily');
    expect(sub.body.newAchievements).toContain('daily_player');
    expect(sub.body.newAchievements).toContain('first_run');

    const third = await api('/api/daily/start', { token: a.token, body: {} });
    expect(third.status).toBe(409);
    const info = (await api('/api/daily', { token: a.token })).body as { status: string };
    expect(info.status).toBe('done');

    const board = await api('/api/leaderboard?board=daily');
    expect((board.body.rows as { userId: string }[]).some((r) => r.userId === a.user.uid)).toBe(
      true,
    );
    // คะแนน Daily ไม่ปนกระดานรายเดือน
    const monthly = await api('/api/leaderboard?board=top');
    expect((monthly.body.rows as { userId: string }[]).some((r) => r.userId === a.user.uid)).toBe(
      false,
    );
  });

  it('เหรียญที่ได้แล้วไม่ได้ซ้ำ และดูได้จาก /api/me', async () => {
    const g = await guest();
    for (let i = 0; i < 2; i++) {
      const { runId, seed } = (
        await api('/api/runs', { token: g.token, body: { characterId: 'ex_insurance' } })
      ).body as { runId: string; seed: string };
      const sub = await api(`/api/runs/${runId}/submit`, {
        token: g.token,
        body: { actions: play(seed, 'ex_insurance') },
      });
      const got = sub.body.newAchievements as string[];
      if (i === 0) expect(got).toContain('first_run');
      else expect(got).not.toContain('first_run');
    }
    const me = await api('/api/me', { token: g.token });
    expect(me.body.achievements).toContain('first_run');
  });
});
