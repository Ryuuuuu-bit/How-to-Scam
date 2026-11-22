// คุยกับ server (Phase 3) — ถ้าไม่ได้ตั้ง VITE_API_URL เกมจะเล่นแบบออฟไลน์
import type { Action } from '@hts/shared';

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const TOKEN_KEY = 'hts.token';

export const apiEnabled = API.length > 0;

export interface PublicUser {
  uid: string;
  shortId: string;
  kind: 'guest' | 'google';
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  runsPlayed: number;
  dailyPlays: number;
  endings: string[];
}

export interface DailyInfo {
  date: string;
  characterId: string;
  status: 'new' | 'started' | 'done';
  result: { score: number; titleId: string; rank: number } | null;
}

export interface BoardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  characterId: string;
  score: number;
  days: number;
  reason: string;
  titleId: string;
}

export interface SubmitResult {
  score: number;
  days: number;
  reason: string;
  endingId: string;
  titleId: string;
  xpGained: number;
  unlocked: string[];
  seasonId: string;
  mode: 'normal' | 'daily';
  dailyDate: string | null;
  rank: number;
  newAchievements: string[];
  user: PublicUser;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ไม่มีที่เก็บ — ต้องล็อกอินใหม่ทุกครั้ง
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, 'offline');
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'error');
  return data as T;
}

export const api = {
  config: () => call<{ googleClientId: string | null; season: string }>('/api/config'),
  guest: () =>
    call<{ token: string; user: PublicUser }>('/api/auth/guest', { method: 'POST', body: {} }),
  google: (credential: string) =>
    call<{ token: string; user: PublicUser }>('/api/auth/google', { body: { credential } }),
  me: () => call<{ user: PublicUser; achievements: string[] }>('/api/me'),
  daily: () => call<DailyInfo>('/api/daily'),
  dailyStart: () =>
    call<{ runId: string; seed: string; characterId: string; date: string }>('/api/daily/start', {
      body: {},
    }),
  rename: (displayName: string) =>
    call<{ user: PublicUser }>('/api/me', { method: 'PATCH', body: { displayName } }),
  startRun: (characterId: string) =>
    call<{ runId: string; seed: string }>('/api/runs', { body: { characterId } }),
  submitRun: (runId: string, actions: Action[]) =>
    call<SubmitResult>(`/api/runs/${runId}/submit`, { body: { actions } }),
  leaderboard: (board: 'top' | 'longest' | 'fastest' | 'daily', season?: string) =>
    call<{ seasonId: string; date?: string; board: string; rows: BoardRow[] }>(
      `/api/leaderboard?board=${board}${season ? `&season=${season}` : ''}`,
    ),
  seasons: () =>
    call<{ current: string; seasons: { id: string; players: number }[] }>('/api/seasons'),
};
