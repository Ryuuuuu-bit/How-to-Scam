// จำลองการเล่นหลายร้อยรอบด้วยบอทหลายนิสัย เพื่อดูสมดุลเกม
// ใช้: pnpm sim  (หรือ pnpm sim 1000)
import { content } from '../shared/data';
import {
  choiceAvailable,
  currentOffer,
  escapeOf,
  launderSuccessPct,
  newGame,
  ponziCrashPct,
  priceOf,
  step,
  unlockedMethods,
} from '../shared/src';
import type { Action, GameState } from '../shared/src';

type Style = 'greedy' | 'careful' | 'random';

function lcg(seed: number) {
  let x = seed >>> 0;
  return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

function bot(s: GameState, style: Style, r: () => number): Action {
  const money = s.dirtyCash + s.cleanCash;
  switch (s.phase) {
    case 'plan': {
      const restAt = style === 'careful' ? 60 : style === 'greedy' ? 88 : 75;
      if (s.heat > restAt) return { t: 'choosePlan', methodId: null };
      if (style === 'careful' && s.day >= 28 && s.cleanCash > 0) return { t: 'retire' };
      let opts = unlockedMethods(s, content).filter((m) => m.cost <= money * 0.8);
      if (opts.some((m) => m.id === 'ponzi') && ponziCrashPct(s, content) > 30) {
        opts = opts.filter((m) => m.id !== 'ponzi');
      }
      if (opts.length === 0) return { t: 'choosePlan', methodId: null };
      const pick =
        style === 'random'
          ? opts[Math.floor(r() * opts.length)]
          : [...opts].sort((a, b) => b.income[1] - a.income[1])[
              style === 'careful' && opts.length > 1 ? 1 : 0
            ];
      return { t: 'choosePlan', methodId: pick?.id ?? null };
    }
    case 'invest': {
      if (s.todayMethodId && style !== 'careful') {
        const ads = content.shopItems.find((i) => i.id === 'ads');
        if (
          ads &&
          !currentOffer(s, content)?.ban?.includes('ads') &&
          (s.dailyItems['ads'] ?? 0) === 0 &&
          money > 20_000
        )
          return { t: 'invest', itemId: 'ads' };
        if (s.henchmen.length < 2 && money > 30_000) return { t: 'invest', itemId: 'henchman' };
      }
      if (
        s.todayMethodId &&
        style === 'careful' &&
        (s.dailyItems['sim_pack'] ?? 0) < 2 &&
        money > 5_000
      )
        return { t: 'invest', itemId: 'sim_pack' };
      return { t: 'confirmInvest' };
    }
    case 'call': {
      // บอทเดาจุดอ่อนถูก 60%
      const call = s.call;
      if (!call) return { t: 'callPitch', pitchId: '' };
      const match = call.pitchIds.find(
        (id) => content.pitches.find((p) => p.id === id)?.weakness === call.victim.weakness,
      );
      const pid = r() < 0.6 && match ? match : (call.pitchIds[Math.floor(r() * 3)] ?? '');
      return { t: 'callPitch', pitchId: pid };
    }
    case 'event': {
      const ev = content.events.find((e) => e.id === s.pendingEvents[0]);
      const avail = (ev?.choices ?? [])
        .map((c, i) => ({ c, i }))
        .filter((x) => choiceAvailable(s, x.c.requires));
      const special = avail.find((x) => x.c.requires);
      const pick = special ?? avail[Math.floor(r() * avail.length)];
      return { t: 'eventChoice', choiceIdx: pick?.i ?? 0 };
    }
    case 'launder': {
      if (style === 'random' && r() < 0.2) return { t: 'launder', cardId: null };
      const best = [...s.launderOffer].sort(
        (a, b) => launderSuccessPct(s, content, b) - launderSuccessPct(s, content, a),
      )[0];
      return { t: 'launder', cardId: best ?? null };
    }
    case 'shop': {
      const up = content.shopItems.find(
        (i) =>
          i.kind === 'permanent' &&
          (s.upgrades[i.id] ?? 0) < i.maxStack &&
          priceOf(s, content, i.id, i.price) < money * 0.3 &&
          (!i.minLevel || i.minLevel <= s.gangLevel),
      );
      if (up && style !== 'random') return { t: 'buy', itemId: up.id };
      return { t: 'endDay' };
    }
    case 'escape': {
      const e = escapeOf(s);
      if (e.step === 'disguise') return { t: 'escapeDisguise', id: 'none' };
      if (e.step === 'route') return { t: 'escapeRoute', id: 'market' };
      if (e.step === 'event') return { t: 'escapeEvent', choiceIdx: 1 };
      if (e.step === 'bribe') return { t: 'escapeBribe', pay: false };
      return { t: 'escapeQte', hits: 3 };
    }
    case 'ended':
      throw new Error('ended');
  }
}

const runs = Number(process.argv[2] ?? 500);
const styles: Style[] = ['greedy', 'careful', 'random'];
const rows: Record<
  string,
  { n: number; score: number[]; caught: number; lvl: number[]; days: number[] }
> = {};
const endings: Record<string, number> = {};
const eventsSeen: Record<string, number> = {};
const methodUse: Record<string, number> = {};

for (let i = 0; i < runs; i++) {
  const ch = content.characters[i % content.characters.length] ?? content.characters[0];
  const style = styles[i % styles.length] ?? 'random';
  if (!ch) break;
  const r = lcg(i * 7919 + 1);
  let s = newGame(`v3:soi:sim-${i}`, ch.id, content);
  for (let k = 0; k < 5000 && s.phase !== 'ended'; k++) s = step(s, bot(s, style, r), content);
  const key = `${ch.id}/${style}`;
  const row = (rows[key] ??= { n: 0, score: [], caught: 0, lvl: [], days: [] });
  row.n++;
  row.score.push(s.end?.score ?? 0);
  row.lvl.push(s.gangLevel);
  row.days.push(s.day);
  if (s.end?.reason === 'caught') row.caught++;
  endings[s.end?.endingId ?? '?'] = (endings[s.end?.endingId ?? '?'] ?? 0) + 1;
  for (const e of new Set(s.seenEvents)) eventsSeen[e] = (eventsSeen[e] ?? 0) + 1;
  for (const h of s.history)
    if (h.methodId) methodUse[h.methodId] = (methodUse[h.methodId] ?? 0) + 1;
}

const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
console.log(
  'character/style'.padEnd(30),
  'n',
  'medScore'.padStart(10),
  'caught%'.padStart(8),
  'avgLvl',
  'avgDay',
);
for (const [k, v] of Object.entries(rows).sort()) {
  console.log(
    k.padEnd(30),
    String(v.n).padStart(2),
    String(med(v.score)).padStart(10),
    String(Math.round((100 * v.caught) / v.n)).padStart(8),
    avg(v.lvl).toFixed(1).padStart(6),
    avg(v.days).toFixed(1).padStart(6),
  );
}
console.log('\nendings', endings);
console.log('methods used (days)', methodUse);
const never = content.events.filter((e) => !eventsSeen[e.id]).map((e) => e.id);
console.log(
  `\nevents seen: ${Object.keys(eventsSeen).length}/${content.events.length}; never:`,
  never,
);
