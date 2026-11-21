import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { newGame, replay, step, toPublicView } from '../src';
import { autoPlay } from './helpers';

describe('determinism (seed เดิมต้องได้ผลเดิม)', () => {
  it('เล่น seed เดิมสองครั้ง ได้ state สุดท้ายเหมือนกันทุกค่า', () => {
    const a = autoPlay('seed-alpha');
    const b = autoPlay('seed-alpha');
    expect(a.actions).toEqual(b.actions);
    expect(a.state).toEqual(b.state);
    expect(a.state.phase).toBe('ended');
  });

  it('replay จาก seed + action log ได้คะแนนตรงกับตอนเล่นจริง', () => {
    for (const seed of ['s1', 's2', 's3', 'ไทย-seed', '🐟']) {
      const played = autoPlay(seed);
      const replayed = replay(seed, 'ex_insurance', played.actions, content);
      expect(replayed).toEqual(played.state);
      expect(replayed.end?.score).toBe(played.state.end?.score);
    }
  });

  it('seed ต่างกันให้ผลต่างกัน', () => {
    const results = new Set(
      Array.from({ length: 10 }, (_, i) => JSON.stringify(autoPlay(`diff-${i}`).state.history)),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('step ไม่แก้ state เดิม (pure function)', () => {
    const s0 = newGame('pure', 'ex_insurance', content);
    const snapshot = JSON.stringify(s0);
    const s1 = step(s0, { t: 'choosePlan', methodId: 'fake_shop' }, content);
    step(s1, { t: 'confirmInvest' }, content);
    expect(JSON.stringify(s0)).toBe(snapshot);
    expect(s1).not.toBe(s0);
  });

  it('ไม่ใช้ Math.random ใน engine', () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random was called');
    };
    try {
      expect(() => autoPlay('no-math-random')).not.toThrow();
    } finally {
      Math.random = original;
    }
  });

  it('toPublicView ซ่อน karma และสถานะ RNG', () => {
    const view = toPublicView(newGame('view', 'gamer_kid', content));
    expect(view).not.toHaveProperty('karma');
    expect(view).not.toHaveProperty('rng');
  });
});
