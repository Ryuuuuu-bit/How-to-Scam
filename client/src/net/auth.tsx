import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, apiEnabled, getToken, setToken } from './api';
import type { PublicUser } from './api';

// สถานะผู้เล่น: ทุกคนมี UID (Guest หรือ Google) ถ้า server ใช้ไม่ได้จะเล่นออฟไลน์
export type AuthStatus = 'loading' | 'signedOut' | 'ready' | 'offline';

interface AuthValue {
  status: AuthStatus;
  user: PublicUser | null;
  /** เหรียญที่ได้แล้ว (ออนไลน์) */
  achievements: string[];
  addAchievements: (ids: string[]) => void;
  googleClientId: string | null;
  loginGuest: () => Promise<void>;
  loginGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setUser: (u: PublicUser) => void;
  rename: (name: string) => Promise<void>;
  playOffline: () => void;
  error: string | null;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(apiEnabled ? 'loading' : 'offline');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    (async () => {
      try {
        const cfg = await api.config();
        if (!alive) return;
        setGoogleClientId(cfg.googleClientId);
        if (getToken()) {
          try {
            const me = await api.me();
            if (!alive) return;
            setUser(me.user);
            setAchievements(me.achievements);
            setStatus('ready');
            return;
          } catch (e) {
            if (e instanceof ApiError && e.status === 401) setToken(null);
            else throw e;
          }
        }
        setStatus('signedOut');
      } catch {
        if (alive) setStatus('offline');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const finish = useCallback((r: { token: string; user: PublicUser }) => {
    setToken(r.token);
    setUser(r.user);
    api
      .me()
      .then((m) => setAchievements(m.achievements))
      .catch(() => undefined);
    setError(null);
    setStatus('ready');
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      achievements,
      addAchievements: (ids) => setAchievements((prev) => Array.from(new Set([...prev, ...ids]))),
      googleClientId,
      error,
      loginGuest: async () => {
        try {
          finish(await api.guest());
        } catch (e) {
          setError(e instanceof ApiError ? e.code : 'error');
        }
      },
      loginGoogle: async (credential) => {
        try {
          // ถ้าเป็น Guest อยู่ token เดิมจะถูกส่งไปด้วย → server ผูก Google กับ UID เดิม
          finish(await api.google(credential));
        } catch (e) {
          setError(e instanceof ApiError ? e.code : 'error');
        }
      },
      logout: () => {
        setToken(null);
        setUser(null);
        setAchievements([]);
        setStatus('signedOut');
      },
      setUser,
      rename: async (name) => {
        const r = await api.rename(name);
        setUser(r.user);
      },
      playOffline: () => setStatus('offline'),
    }),
    [status, user, achievements, googleClientId, error, finish],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
