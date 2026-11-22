import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../net/auth';
import { api } from '../net/api';

const Count = createContext<number | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const uid = status === 'ready' ? user?.uid : undefined;
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(null);
    if (!uid) return;
    let active = true,
      pending = false;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const data = await api.presence();
        if (active) setCount(data.count);
      } catch {
        if (active) setCount(null);
      } finally {
        pending = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [uid]);
  return <Count.Provider value={count}>{children}</Count.Provider>;
}

export function OnlineCount() {
  const count = useContext(Count);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-current/25 px-2 py-1 text-xs font-semibold"
      title="ผู้เล่นที่เปิดหน้าเกมในช่วง 90 วินาทีล่าสุด"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${count === null ? 'bg-gray-400' : 'bg-emerald-400'}`}
      />
      {count === null ? 'ออนไลน์ —' : `ออนไลน์ ${count.toLocaleString('th-TH')} คน`}
    </span>
  );
}
