import { expect, it } from 'vitest';
import { content } from '../data';
import { newGame, replay, step, validateContent } from '../src';
import type { Action, GameState } from '../src';
import { botAction } from './helpers';

function dial(seed: string) {
  const s = newGame(seed, 'phone_tech', content);
  s.gangLevel = 2;
  return step(step(s, { t: 'choosePlan', methodId: 'call_center' }, content), { t: 'confirmInvest' }, content);
}

it('matches the illustrated ages and names across all jobs, including the old student/grandma case', () => {
  const ids = new Set<string>();
  const jobs = new Set<number>();
  for (let i = 0; i < 1000; i++) {
    const v = dial('old-' + i).call?.victim;
    if (!v) throw Error('missing caller');
    const art = content.victims.find(p => p.id === v.portrait);
    const name = content.victimParts.names[v.nameIdx];
    const job = content.victimParts.jobs[v.jobIdx];
    if (!name || !art || !job) throw Error('incomplete profile');
    expect(name.portraits).toContain(art.id);
    for (const range of [art.portraitAges, job.age, ...(name.ages ? [name.ages] : [])]) {
      expect(v.age).toBeGreaterThanOrEqual(range[0]);
      expect(v.age).toBeLessThanOrEqual(range[1]);
    }
    if (job.portraits) expect(job.portraits).toContain(art.id);
    if (job.text.th === 'นักศึกษาปีสี่') expect(['v_praewa', 'v_kong']).toContain(art.id);
    if (job.text.th === 'แม่ค้าส้มตำ') expect(art.id).toBe('v_somsri');
    if (job.text.th === 'ข้าราชการเกษียณ') expect(['v_mali', 'v_boonma']).toContain(art.id);
    jobs.add(v.jobIdx);
    ids.add(v.portrait);
  }
  expect(ids.size).toBe(content.victims.length);
  expect(jobs.size).toBe(content.victimParts.jobs.length);
  const student = dial('old-4').call?.victim;
  expect(student?.age).toBe(21);
  expect(content.victimParts.names[student?.nameIdx ?? -1]?.th).not.toBe('ยายบุญมี');
});

it('detects uncovered ages, missing artwork IDs and a portrait with no compatible name', () => {
  const broken = structuredClone(content);
  const first = broken.victimParts.jobs[0];
  if (!first) throw Error('missing job');
  first.portraits = ['missing'];
  broken.victimParts.names = broken.victimParts.names.filter(n => !n.portraits.includes('v_kong'));
  const errors = validateContent(broken);
  expect(errors).toContain('unknown caller portrait: missing');
  expect(errors).toContain('no portrait for แม่ค้าส้มตำ, age 35');
  expect(errors).toContain('no name for v_kong, age 21');
});

it('replays a saved day-seven call and carries its identity through the result', () => {
  const seed = 'v3:soi:live:old-profile-0';
  const character = 'ex_insurance';
  let s: GameState = newGame(seed, character, content);
  const actions: Action[] = [];
  while (!s.call && actions.length < 100 && s.phase !== 'ended') {
    const a: Action = s.phase === 'plan' && s.gangLevel >= 2
      ? { t: 'choosePlan', methodId: 'call_center' } : botAction(s);
    actions.push(a);
    s = step(s, a, content);
  }
  expect(s.day).toBe(7);
  expect(s.rng).toBe(1112178024);
  const resumed = replay(seed, character, actions, content);
  expect(resumed).toEqual(s);
  const v = resumed.call?.victim;
  const pitchId = resumed.call?.pitchIds[0];
  if (!v || !pitchId) throw Error('missing resumed call');
  const next = step(resumed, { t: 'callPitch', pitchId }, content);
  expect(next.lastResults.find(r => r.kind === 'call')?.textKey).toBe(`${v.portrait}:${pitchId}:${v.nameIdx}`);
});
