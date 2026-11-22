import type { GameContent, Range, VictimId, VictimParts } from '../types/content';

const inRange = (age: number, range: Range) => age >= range[0] && age <= range[1];

export function callerPortraits(c: GameContent, job: VictimParts['jobs'][number], age: number) {
  return c.victims.filter(v => inRange(age, v.portraitAges) && (!job.portraits || job.portraits.includes(v.id)));
}

export function callerNameIndices(parts: VictimParts, portrait: VictimId, age: number) {
  return parts.names.flatMap((name, i) =>
    name.portraits.includes(portrait) && (!name.ages || inRange(age, name.ages)) ? [i] : []);
}
