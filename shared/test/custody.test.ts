import { describe, expect, it } from 'vitest';
import { dreamSequence, newGame, step } from '../src';
import { content } from '../data';

function escape() {
  const s = newGame('custody-replay', 'ex_insurance', content);
  s.phase = 'escape';
  s.escape = { step: 'qte', routeId: 'market', bonus: -100 };
  s.cleanCash = 800;
  return s;
}

describe('custody scenes', () => {
  it('preserves recorded captures and offers a scene on new captures', () => {
    const s = escape();
    expect(step(s, { t: 'escapeQte', hits: 0 }, content).end?.reason).toBe('caught');
    const jail = step(s, { t: 'escapeQte', hits: 0, custody: true }, content);
    expect(jail.escape?.step).toBe('custody');
    const answer = dreamSequence(jail);
    const good = step(jail, { t: 'custodyVerdict', answer }, content);
    expect([good.phase, good.dirtyCash, good.cleanCash, good.heat, good.escapes]).toEqual(['shop', 0, 400, 45, 1]);
    expect(good.flags).toContain('dream_escape');
    answer[0] = answer[0] === 0 ? 1 : 0;
    expect(step(jail, { t: 'custodyVerdict', answer }, content).end?.endingId).toBe('jail_cards');
    expect(step({ ...jail, flags: good.flags }, { t: 'custodyVerdict', answer: null }, content).end?.endingId).toBe('jail_return');
    expect(() => step({ ...jail, flags: good.flags }, { t: 'custodyVerdict', answer }, content)).toThrow();
  });
  it('preserves the surrender settlement and prevents another attempt after surrender', () => {
    const s = escape();
    const jail = step(s, { t: 'escapeSurrender', custody: true }, content);
    expect(() => step(jail, { t: 'custodyVerdict', answer: dreamSequence(jail) }, content)).toThrow();
    expect(step(jail, { t: 'custodyVerdict', answer: null }, content).end)
      .toEqual(step(s, { t: 'escapeSurrender' }, content).end);
  });
});
