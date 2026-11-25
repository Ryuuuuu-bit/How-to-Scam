import { useCallback, useState } from 'react';
import { marketPrice } from '@hts/shared';
import { content } from './content';
import { api, ApiError } from '../net/api';
import { useAuth } from '../net/auth';
import { buyLocal, progressFor, type Progress } from './meta';

export type BuyResult = 'ok' | 'poor' | 'error';

/** ความคืบหน้ากับการซื้อของในตลาดใต้ดิน ใช้ได้ทั้งล็อกอินและเล่นออฟไลน์ */
export function useMarket(): {
  progress: Progress;
  busy: string | null;
  buy: (key: string) => Promise<BuyResult>;
  priceOf: (key: string) => number | null;
} {
  const { user, setUser } = useAuth();
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const progress = progressFor(user);
  const buy = useCallback(
    async (key: string): Promise<BuyResult> => {
      if (!user) {
        const r = buyLocal(key);
        setTick((n) => n + 1);
        return r ? 'ok' : 'poor';
      }
      setBusy(key);
      try {
        const r = await api.marketBuy(key);
        setUser(r.user);
        return 'ok';
      } catch (e) {
        return e instanceof ApiError && e.status === 402 ? 'poor' : 'error';
      } finally {
        setBusy(null);
      }
    },
    [user, setUser],
  );
  return { progress, busy, buy, priceOf: (key) => marketPrice(content, key) };
}
