import { once } from 'node:events';
import { request, type IncomingMessage, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { campaignSeed, careerStatus, escapeOf, newGame, replay, step, unlockedMethods } from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { createApp } from '../src/app';
import { seasonFor } from '../src/season';
import { memoryStore } from './memoryStore';

const store = memoryStore();
let server: Server;
const socketName = `hts-api-${randomUUID()}`;
const socketPath =
  process.platform === 'win32' ? `//./pipe/${socketName}` : join(tmpdir(), socketName);

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
  server = app.listen(socketPath);
  await once(server, 'listening');
});
afterAll(async () => {
  const closed = once(server, 'close');
  server.close();
  await closed;
});

async function api(path: string, opts: { method?: string; token?: string; body?: unknown } = {}) {
  const req = request({
    socketPath,
    path,
    agent: false,
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
  });
  const response = once(req, 'response');
  req.end(opts.body === undefined ? undefined : JSON.stringify(opts.body));
  const [res] = (await response) as [IncomingMessage];
  res.setEncoding('utf8');
  let json = '';
  for await (const chunk of res) json += chunk;
  return { status: res.statusCode, body: JSON.parse(json) as Record<string, unknown> };
}

async function guest() {
  const r = await api('/api/auth/guest', { method: 'POST' });
  return r.body as { token: string; user: { uid: string; kind: string } };
}

it('stores validated feedback from guests', async () => {
  const { token, user } = await guest();
  const body = { category: 'idea', message: '  ลองเพิ่มฉากตลาด  ' };
  expect((await api('/api/feedback', { body })).status).toBe(401);
  for (const invalid of [{ ...body, category: 'unknown' }, { ...body, message: '  ' }, { ...body, message: 'a'.repeat(1001) }]) {
    expect((await api('/api/feedback', { token, body: invalid })).status).toBe(400);
  }
  expect((await api('/api/feedback', { token, body })).status).toBe(201);
  expect(store.feedback).toEqual([{ userId: user.uid, category: 'idea', message: body.message.trim() }]);
});

it('counts recent accounts once across tabs and expires inactive players', async () => {
  const first = await guest();
  const second = await guest();
  const ping = (token: string) => api('/api/presence', { method: 'POST', token });
  expect((await api('/api/presence', { method: 'POST' })).status).toBe(401);
  expect((await ping(first.token)).body.count).toBe(1);
  expect((await ping(first.token)).body.count).toBe(1);
  expect((await ping(second.token)).body.count).toBe(2);
  const future = new Date(Date.now() + 91_000);
  expect(await store.markOnline(first.user.uid, future, new Date(future.getTime() - 90_000))).toBe(
    1,
  );
});

/** บอทง่ายๆ เล่นจนจบ */
function play(seed: string, characterId: string, plan?: (s: GameState) => Action): Action[] {
  let s: GameState = newGame(seed, characterId, content);
  const actions: Action[] = [];
  for (let i = 0; i < 3000 && s.phase !== 'ended'; i++) {
    const money = s.dirtyCash + s.cleanCash;
    let a: Action;
    switch (s.phase) {
      case 'plan': {
        // รุ่น 1.0: ตอบเรื่องในซอยที่รออยู่ก่อนเริ่มงาน
        if (s.soi?.pendingShape) { a = { t: 'shapePlace', place: s.soi.pendingShape, form: 'local' }; if (money >= 400) break; a = { t: 'shapePlace', place: s.soi.pendingShape, form: 'patron' }; break; }
        if (s.soi?.appointment?.day === s.day) { a = { t: 'appointment', npc: s.soi.appointment.npcs[0] }; break; }
        if (plan) { a = plan(s); break; }
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
      default: {
        const e = escapeOf(s);
        if (e.step === 'disguise') a = { t: 'escapeDisguise', id: 'none' };
        else if (e.step === 'route') a = { t: 'escapeRoute', id: 'market' };
        else if (e.step === 'event') a = { t: 'escapeEvent', choiceIdx: 1 };
        else if (e.step === 'bribe') a = { t: 'escapeBribe', pay: false };
        else a = { t: 'escapeQte', hits: 3 };
      }
    }
    actions.push(a);
    s = step(s, a, content);
  }
  return actions;
}

it('submits and ranks a completed career with the selected occupation signature', async () => {
  const g = await guest();
  const seed = campaignSeed(60, 'first-album');
  const characterId = 'orange_cat';
  const run = await store.createRun({ userId: g.user.uid, characterId, seed, mode: 'normal60', dailyDate: null });
  const methodId = 'cat_dub';
  const actions = play(seed, characterId, s => {
    const track = careerStatus(s, methodId);
    if (track.finale) return { t: 'retire' };
    if (!track.branch && track.shifts >= track.needed) return { t: 'specialize', methodId, branch: 'face' };
    if (track.commissions && !s.careers?.[methodId]?.decision) return { t: 'careerDecision', methodId, choice: 'talent' };
    if (track.commissions >= 3) return { t: 'careerFinale', methodId, choice: 'fee' };
    return { t: 'choosePlan', methodId };
  });
  const local = replay(seed, characterId, actions, content);
  expect(local.careers?.[methodId]?.finale).toBe('fee');
  const submitted = await api(`/api/runs/${run.id}/submit`, { token: g.token, body: { actions } });
  expect(submitted.status).toBe(200);
  expect(submitted.body.score).toBe(local.end?.score);
  const board = await api('/api/leaderboard?days=60');
  expect(board.body.rows).toEqual(expect.arrayContaining([expect.objectContaining({ userId: g.user.uid, score: local.end?.score })]));
});

it('keeps scores on the board chosen at start, including early endings', async () => {
  const characterId = 'ex_insurance';
  const players = [];
  for (const days of [30, 60, 90]) {
    const g = await guest();
    const start = await api('/api/runs', { token: g.token, body: { days, characterId } });
    const { runId, seed } = start.body as { runId: string; seed: string };
    expect(newGame(seed, characterId, content).maxDays).toBe(days);
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions: play(seed, characterId), days: 30 } });
    expect(sub.status).toBe(200);
    players.push({ days, uid: g.user.uid });
  }
  for (const days of [30, 60, 90]) {
    const board = await api('/api/leaderboard?board=top&days=' + days);
    const ids = (board.body.rows as { userId: string }[]).map(r => r.userId);
    for (const player of players) expect(ids.includes(player.uid)).toBe(days === player.days);
  }
  expect((await api('/api/leaderboard?days=75')).status).toBe(400);
});

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
    const r = await api('/api/runs', { token: g.token, body: { characterId: 'foundation_chief' } });
    expect(r.status).toBe(403);
  });

  it('ตัวละครที่ต้องซื้อ เริ่มไม่ได้จนกว่าจะซื้อด้วยเงินใต้ดิน', async () => {
    const g = await guest();
    expect(g.user).toMatchObject({ money: 0, owned: [] });
    expect((await api('/api/runs', { token: g.token, body: { characterId: 'live_seller' } })).status).toBe(403);
    const poor = await api('/api/market/buy', { token: g.token, body: { key: 'char:live_seller' } });
    expect(poor.status).toBe(402);
    const u = await store.findUser(g.user.uid);
    if (!u) throw new Error('no user');
    u.money = 2_000;
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'char:nobody' } })).status).toBe(400);
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'char:ex_insurance' } })).status).toBe(400);
    const buy = await api('/api/market/buy', { token: g.token, body: { key: 'char:live_seller' } });
    expect(buy.status).toBe(200);
    expect(buy.body.user).toMatchObject({ money: 500, owned: ['char:live_seller'] });
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'char:live_seller' } })).status).toBe(409);
    expect((await api('/api/runs', { token: g.token, body: { characterId: 'live_seller' } })).status).toBe(200);
  });

  it('บ้านกับชุดติดไปกับ seed เฉพาะของที่มีจริง และบ้านเดี่ยวต้องมีคอนโดก่อน', async () => {
    const g = await guest();
    const plain = await api('/api/runs', { token: g.token, body: { characterId: 'gamer_kid', outfit: 'banker' } });
    expect((plain.body as { seed: string }).seed).not.toContain('|L=');
    const u = await store.findUser(g.user.uid);
    if (!u) throw new Error('no user');
    u.money = 20_000;
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'home:house' } })).status).toBe(409);
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'home:condo' } })).status).toBe(200);
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'home:house' } })).status).toBe(200);
    expect((await api('/api/market/buy', { token: g.token, body: { key: 'outfit:banker' } })).status).toBe(200);
    const run = await api('/api/runs', { token: g.token, body: { characterId: 'gamer_kid', outfit: 'banker' } });
    expect((run.body as { seed: string }).seed).toMatch(/\|L=house\.banker$/);
    expect((await api('/api/runs', { token: g.token, body: { characterId: 'gamer_kid', outfit: 'nope' } })).status).toBe(400);
  });

  it('สัตว์เลี้ยง รถ และทุนกลับใจ ติด seed เฉพาะของที่ซื้อแล้ว', async () => {
    const g = await guest();
    const pick = { characterId: 'gamer_kid', pet: 'dog', car: 'pickup', reform: true };
    const plain = await api('/api/runs', { token: g.token, body: pick });
    expect((plain.body as { seed: string }).seed).not.toContain('|L=');
    const u = await store.findUser(g.user.uid);
    if (!u) throw new Error('no user');
    u.money = 20_000;
    for (const key of ['pet:dog', 'car:pickup', 'reform:shop']) {
      expect((await api('/api/market/buy', { token: g.token, body: { key } })).status).toBe(200);
    }
    const run = await api('/api/runs', { token: g.token, body: pick });
    expect((run.body as { seed: string }).seed).toMatch(/\|L=room\.casual\.dog\.pickup\.reform$/);
    expect((await api('/api/runs', { token: g.token, body: { ...pick, car: 'tank' } })).status).toBe(400);
  });

  it('จบรอบได้เงินใต้ดิน และผ่านออดิชั่นได้ตัวละครฟรี', async () => {
    const g = await guest();
    const { runId, seed } = (
      await api('/api/runs', { token: g.token, body: { characterId: 'gamer_kid' } })
    ).body as { runId: string; seed: string };
    // ทำงานร้านออนไลน์ทุกวันที่ทำได้ เพื่อผ่านออดิชั่นของแม่ค้าไลฟ์สด
    const actions = play(seed, 'gamer_kid', (s) => {
      const money = s.dirtyCash + s.cleanCash;
      const fake = unlockedMethods(s, content).find((m) => m.id === 'fake_shop' && m.cost <= money);
      return { t: 'choosePlan', methodId: s.heat > 70 ? null : (fake?.id ?? null) };
    });
    const local = replay(seed, 'gamer_kid', actions, content);
    const shifts = local.history.filter((h) => h.methodId === 'fake_shop').length;
    const sub = await api(`/api/runs/${runId}/submit`, { token: g.token, body: { actions } });
    expect(sub.status).toBe(200);
    const user = sub.body.user as { money: number; xp: number; owned: string[] };
    expect(sub.body.moneyGained).toBe(user.xp * 10);
    expect(user.money).toBe(user.xp * 10);
    expect(shifts).toBeGreaterThanOrEqual(6);
    expect(sub.body.auditions).toContain('live_seller');
    expect(user.owned).toContain('char:live_seller');
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
