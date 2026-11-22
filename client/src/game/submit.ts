import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action } from '@hts/shared';
import { api, ApiError } from '../net/api';
import type { SubmitResult } from '../net/api';
import { useAuth } from '../net/auth';

export type SubmitState =
  | { kind: 'offline' }
  | { kind: 'sending' }
  | { kind: 'ok'; result: SubmitResult }
  | { kind: 'error'; code: string };

const sentKey = (runId: string) => `hts.sent.${runId}`;

/** ส่งรอบที่จบแล้วให้ server ตรวจ (ครั้งเดียว) — ไม่มี runId = รอบออฟไลน์ */
export function useSubmitRun(runId: string | undefined, actions: Action[]) {
  const auth = useAuth();
  const [state, setState] = useState<SubmitState>(
    runId && auth.status === 'ready' ? { kind: 'sending' } : { kind: 'offline' },
  );
  const started = useRef(false);
  const { setUser } = auth;

  const send = useCallback(async () => {
    if (!runId) return;
    setState({ kind: 'sending' });
    try {
      const result = await api.submitRun(runId, actions);
      try {
        sessionStorage.setItem(sentKey(runId), JSON.stringify(result));
      } catch {
        // ไม่จำก็ได้
      }
      setUser(result.user);
      setState({ kind: 'ok', result });
    } catch (e) {
      // ส่งไปแล้วรอบก่อน (เช่นรีเฟรชหน้า) ให้แสดงผลเดิม
      if (e instanceof ApiError && e.code === 'run_already_submitted') {
        try {
          const saved = sessionStorage.getItem(sentKey(runId));
          if (saved) {
            setState({ kind: 'ok', result: JSON.parse(saved) as SubmitResult });
            return;
          }
        } catch {
          // ไปแสดง error ด้านล่าง
        }
      }
      setState({ kind: 'error', code: e instanceof ApiError ? e.code : 'error' });
    }
  }, [runId, actions, setUser]);

  useEffect(() => {
    if (started.current || !runId || auth.status !== 'ready') return;
    started.current = true;
    void send();
  }, [runId, auth.status, send]);

  return { state, retry: send };
}
