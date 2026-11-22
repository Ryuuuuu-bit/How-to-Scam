import { expect, it } from 'vitest';
import { newGame } from '@hts/shared';
import { content } from '@hts/shared/data';
import { ART } from '../src/assets/art';
import { describeResult } from '../src/game/results';

it('uses a distinct real illustration for each caller and attributes the line to the player', () => {
  const state = newGame('art-check', 'ex_insurance', content);
  const pitch = content.pitches[0];
  if (!pitch) throw Error('missing pitch');
  const urls = new Set<string>();
  for (const v of content.victims) {
    const index = content.victimParts.names.findIndex(n => n.portraits.includes(v.id));
    const name = content.victimParts.names[index];
    const art = ART['victim:' + v.id]?.src;
    if (!art || !name) throw Error('missing visual identity for ' + v.id);
    urls.add(art);
    for (const success of [true, false]) {
      const result = describeResult({ kind: 'call', success, textKey: `${v.id}:${pitch.id}:${index}` }, state);
      expect(result?.art).toBe('victim:' + v.id);
      expect(result?.body).toContain(name.th);
      expect(result?.body).toContain(`คุณพูดว่า “${pitch.text.th}”`);
    }
  }
  expect(urls.size).toBe(content.victims.length);
});
