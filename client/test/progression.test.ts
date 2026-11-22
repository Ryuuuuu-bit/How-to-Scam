import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newGame, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import {
  characterArt,
  cosmeticUnlocked,
  loadCosmetics,
  menuScenes,
  saveCosmetics,
} from '../src/game/cosmetics';
import { dailyArticles, markPaperRead, paperWasRead } from '../src/game/newspaper';

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  });
});

describe('cross-run cosmetics', () => {
  it('keeps account preferences isolated and rejects locked selections', () => {
    const rich = { xp: 1000, endings: ['jailed'] };
    saveCosmetics({ scene: 'jail', skins: { ex_insurance: 'ex_insurance_gold' } }, 'alice');
    expect(loadCosmetics(rich, 'alice').scene).toBe('jail');
    expect(characterArt('ex_insurance', loadCosmetics(rich, 'alice'))).toBe(
      'skin:ex_insurance_gold',
    );
    expect(loadCosmetics(rich, 'bob')).toEqual({ scene: 'menu', skins: {} });
    expect(loadCosmetics({ xp: 0, endings: [] }, 'alice')).toEqual({ scene: 'menu', skins: {} });
  });
  it('unlocks the reform studio through each reform ending', () => {
    const studio = menuScenes[5];
    for (const ending of ['redeemed', 'whistleblower', 'scam_hunter']) {
      expect(cosmeticUnlocked(studio, { xp: 0, endings: [ending] })).toBe(true);
    }
    expect(cosmeticUnlocked(studio, { xp: 9999, endings: ['jailed'] })).toBe(false);
  });
  it('recovers from malformed saves and denied storage', () => {
    localStorage.setItem('hts.cosmetics.v1.offline', '{broken');
    expect(loadCosmetics({ xp: 0, endings: [] })).toEqual({ scene: 'menu', skins: {} });
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(() => saveCosmetics({ scene: 'menu', skins: {} })).not.toThrow();
    expect(loadCosmetics({ xp: 0, endings: [] }).scene).toBe('menu');
  });
});

describe('daily fictional newspaper', () => {
  it('reports only completed days without modifying replay state or hidden information', () => {
    const first = step(
      newGame('paper', 'ex_insurance', content),
      { t: 'choosePlan', methodId: 'fake_shop' },
      content,
    );
    expect(dailyArticles(first, content)).toEqual([]);
    const state = { ...first, day: 2, karma: -12345, rng: 987654321 };
    const before = structuredClone(state);
    const paper = dailyArticles(state, content);
    expect(paper).toHaveLength(1);
    expect(paper[0]?.image).toBe('newsphoto:fake_shop');
    expect(state).toEqual(before);
    expect(JSON.stringify(paper)).not.toMatch(/12345|987654321/);
    expect(dailyArticles(state, content)).toEqual(paper);
  });
  it('includes a final partial day once the game ends', () => {
    const state = step(
      newGame('final-paper', 'ex_insurance', content),
      { t: 'choosePlan', methodId: null },
      content,
    );
    expect(dailyArticles({ ...state, phase: 'ended' }, content)).toHaveLength(1);
  });
  it('remembers read papers by run and day', () => {
    expect(paperWasRead('a', 1)).toBe(false);
    markPaperRead('a', 1);
    expect(paperWasRead('a', 1)).toBe(true);
    expect(paperWasRead('b', 1)).toBe(false);
    expect(paperWasRead('a', 2)).toBe(false);
  });
});
