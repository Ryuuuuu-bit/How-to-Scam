import { useCallback, useState } from 'react';
import { InvalidActionError, newGame, replay, step } from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { content } from '@hts/shared/data';

// เซฟเก็บแค่ seed + ตัวละคร + action log แล้ว replay ตอนโหลด
// รูปแบบเดียวกับที่จะส่งให้ server ตรวจใน Phase 3
const SAVE_KEY = 'hts.save.v2';

interface SaveData {
  seed: string;
  characterId: string;
  actions: Action[];
  /** รอบที่ server ออก seed ให้ (ส่งคะแนนขึ้นกระดานได้) */
  runId?: string;
}

export interface Run {
  seed: string;
  characterId: string;
  actions: Action[];
  runId?: string;
  state: GameState;
}

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!data.seed || !data.characterId || !Array.isArray(data.actions)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSave(run: Run | null): void {
  try {
    if (!run || run.state.phase === 'ended') localStorage.removeItem(SAVE_KEY);
    else {
      const data: SaveData = {
        seed: run.seed,
        characterId: run.characterId,
        actions: run.actions,
        ...(run.runId ? { runId: run.runId } : {}),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }
  } catch {
    // โหมดส่วนตัว/พื้นที่เต็ม — เล่นต่อได้ แค่ไม่เซฟ
  }
}

/** โหลดเซฟที่ค้างอยู่ (ถ้า replay ไม่ผ่าน เช่นข้อมูลเกมเปลี่ยน ก็ทิ้งไป) */
export function loadSavedRun(): Run | null {
  const data = readSave();
  if (!data) return null;
  try {
    const state = replay(data.seed, data.characterId, data.actions, content);
    if (state.phase === 'ended') return null;
    return { ...data, state };
  } catch {
    writeSave(null);
    return null;
  }
}

function randomSeed(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export function useGame() {
  const [run, setRun] = useState<Run | null>(null);
  /** นับจำนวน action เพื่อให้ UI รู้ว่ามีผลใหม่ให้แสดง */
  const [tick, setTick] = useState(0);

  /** เริ่มรอบ: ถ้ามี seed จาก server (runId) คะแนนจะส่งขึ้นกระดานได้ */
  const start = useCallback((characterId: string, server?: { runId: string; seed: string }) => {
    const seed = server?.seed ?? 'v3:' + randomSeed();
    const next: Run = {
      seed,
      characterId,
      actions: [],
      ...(server ? { runId: server.runId } : {}),
      state: newGame(seed, characterId, content),
    };
    writeSave(next);
    setRun(next);
    setTick((x) => x + 1);
  }, []);

  const resume = useCallback((saved: Run) => {
    setRun(saved);
  }, []);

  const dispatch = useCallback((action: Action) => {
    setRun((prev) => {
      if (!prev) return prev;
      try {
        const state = step(prev.state, action, content);
        const next: Run = { ...prev, actions: [...prev.actions, action], state };
        writeSave(next);
        return next;
      } catch (err) {
        if (err instanceof InvalidActionError) {
          console.warn('invalid action', action, err.message);
          return prev;
        }
        throw err;
      }
    });
    setTick((x) => x + 1);
  }, []);

  const quit = useCallback(() => {
    setRun(null);
  }, []);

  const clearSave = useCallback(() => writeSave(null), []);

  return { run, tick, start, resume, dispatch, quit, clearSave };
}

export { content };
