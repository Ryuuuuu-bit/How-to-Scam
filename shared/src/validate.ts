import type { GameContent, Weakness } from './types/content';
import { callerNameIndices, callerPortraits } from './engine/callerIdentity';

/**
 * ตรวจความถูกต้องของข้อมูลเกม คืนรายการปัญหา (ว่าง = ผ่าน)
 * ใช้ใน unit test เพื่อจับข้อมูลผิดก่อนขึ้นเกมจริง
 */
export function validateContent(c: GameContent): string[] {
  const errors: string[] = [];
  const methodIds = new Set(c.methods.map((m) => m.id));
  const eventIds = new Set(c.events.map((e) => e.id));
  const charIds = new Set(c.characters.map((x) => x.id));
  const scheduled = new Set<string>();

  const checkUnique = (what: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`duplicate ${what} id: ${id}`);
      seen.add(id);
    }
  };
  checkUnique(
    'method',
    c.methods.map((x) => x.id),
  );
  checkUnique(
    'card',
    c.launderCards.map((x) => x.id),
  );
  checkUnique(
    'event',
    c.events.map((x) => x.id),
  );
  checkUnique(
    'character',
    c.characters.map((x) => x.id),
  );
  checkUnique(
    'shop item',
    c.shopItems.map((x) => x.id),
  );
  checkUnique(
    'victim',
    c.victims.map((x) => x.id),
  );
  checkUnique(
    'pitch',
    c.pitches.map((x) => x.id),
  );
  checkUnique(
    'danger sign',
    c.dangerSigns.map((x) => x.id),
  );
  checkUnique(
    'ending',
    c.endings.map((x) => x.id),
  );

  for (const m of c.methods) {
    if (m.debutEvent) {
      if (!c.events.some(ev => ev.id === m.debutEvent && ev.chainOnly))
        errors.push(`method ${m.id}: debut must refer to a scripted event`);
      scheduled.add(m.debutEvent);
    }
    if (m.income[0] > m.income[1]) errors.push(`method ${m.id}: income range reversed`);
    if (m.heat[0] > m.heat[1]) errors.push(`method ${m.id}: heat range reversed`);
  }
  if (!c.methods.some((m) => m.level === 1)) errors.push('no level-1 method');

  for (const card of c.launderCards) {
    if (card.successPct < 0 || card.successPct > 100) errors.push(`card ${card.id}: successPct`);
    if (card.capacity <= 0) errors.push(`card ${card.id}: capacity must be > 0`);
  }
  if (c.launderCards.length < c.config.launderOfferSize) {
    errors.push('fewer launder cards than offer size');
  }

  for (const ev of c.events) {
    const normal = ev.choices.filter((x) => !x.requires).length;
    if (normal < 1 || normal > 3 || ev.choices.length > 5) {
      errors.push(`event ${ev.id}: must have 1–3 normal choices (max 5 total)`);
    }
    for (const [i, ch] of ev.choices.entries()) {
      if (ch.outcomes.length === 0) errors.push(`event ${ev.id} choice ${i}: no outcomes`);
      for (const o of ch.outcomes) {
        for (const e of o.effects) {
          if (e.kind === 'modifier' && e.methodId && !methodIds.has(e.methodId)) {
            errors.push(`event ${ev.id}: unknown method ${e.methodId} in modifier`);
          }
          if (e.kind === 'schedule') {
            if (!eventIds.has(e.eventId))
              errors.push(`event ${ev.id}: schedules unknown ${e.eventId}`);
            scheduled.add(e.eventId);
          }
          if (e.kind === 'cooldown' && !methodIds.has(e.methodId)) {
            errors.push(`event ${ev.id}: cooldown on unknown method ${e.methodId}`);
          }
        }
      }
    }
    for (const m of ev.when.methods ?? []) {
      if (!methodIds.has(m)) errors.push(`event ${ev.id}: unknown method ${m}`);
    }
  }

  for (const ev of c.events) {
    if (ev.chainOnly && !scheduled.has(ev.id))
      errors.push(`chain event ${ev.id} is never scheduled`);
    for (const ch of ev.when.characters ?? []) {
      if (!charIds.has(ch)) errors.push(`event ${ev.id}: unknown character ${ch}`);
    }
    for (const choice of ev.choices) {
      for (const ch of choice.requires?.characters ?? []) {
        if (!charIds.has(ch)) errors.push(`event ${ev.id}: choice needs unknown character ${ch}`);
      }
    }
    if (ev.choices.filter((x) => !x.requires).length === 0) {
      errors.push(`event ${ev.id}: needs at least one choice without requirements`);
    }
  }
  for (const ch of c.characters) {
    for (const p of ch.perks) {
      if ('methodId' in p && !methodIds.has(p.methodId)) {
        errors.push(`character ${ch.id}: perk on unknown method ${p.methodId}`);
      }
    }
  }
  for (const n of c.news) {
    for (const m of n.modifiers) {
      if (m.methodId && !methodIds.has(m.methodId)) errors.push(`news ${n.id}: unknown method`);
    }
  }
  for (const f of c.festivals) {
    for (const m of f.modifiers) {
      if (m.methodId && !methodIds.has(m.methodId)) errors.push(`festival ${f.id}: unknown method`);
    }
  }
  if (c.news.length === 0) errors.push('no news');
  const itemIds = new Set(c.shopItems.map((x) => x.id));
  checkUnique(
    'offer',
    c.offers.map((x) => x.id),
  );
  for (const o of c.offers) {
    for (const id of [...(o.discount?.itemIds ?? []), ...(o.ban ?? [])]) {
      if (!itemIds.has(id)) errors.push(`offer ${o.id}: unknown item ${id}`);
    }
    if (o.kind === 'deal' && (o.price === undefined || !o.effects)) {
      errors.push(`offer ${o.id}: deal needs price and effects`);
    }
    if (o.kind === 'mission') {
      if (!o.mission) errors.push(`offer ${o.id}: mission data missing`);
      else if (o.mission.methodId !== null && !methodIds.has(o.mission.methodId)) {
        errors.push(`offer ${o.id}: unknown method ${o.mission.methodId}`);
      }
    }
  }

  checkUnique(
    'disguise',
    c.disguises.map((x) => x.id),
  );
  checkUnique(
    'route',
    c.routes.map((x) => x.id),
  );
  const routeIds = new Set(c.routes.map((x) => x.id));
  if (!c.disguises.some((d) => d.cost === 0)) errors.push('escape needs a free disguise');
  if (!c.routes.some((r) => r.cost === 0)) errors.push('escape needs a free route');
  for (const d of c.disguises) {
    for (const r of d.goodFor) {
      if (!routeIds.has(r)) errors.push(`disguise ${d.id}: unknown route ${r}`);
    }
  }
  for (const r of c.routes) {
    if (r.events.length === 0) errors.push(`route ${r.id}: no events`);
    for (const ev of r.events) {
      if (ev.choices.length < 2 || ev.choices.length > 3) {
        errors.push(`route ${r.id} event ${ev.id}: needs 2-3 choices`);
      }
      if (!ev.choices.some((ch) => !ch.cost)) {
        errors.push(`route ${r.id} event ${ev.id}: needs a free choice`);
      }
    }
  }

  const weaknesses: Weakness[] = ['greed', 'fear', 'faith', 'lonely'];
  for (const w of weaknesses) {
    if (!c.pitches.some((p) => p.weakness === w)) errors.push(`no pitch for weakness ${w}`);
  }
  for (const w of weaknesses) {
    if ((c.victimParts.traits[w] ?? []).length === 0) errors.push(`no victim trait for ${w}`);
  }
  for (const k of ['baiter', 'undercover', 'herring'] as const) {
    if ((c.victimParts.tells[k] ?? []).length === 0) errors.push(`no caller tell for ${k}`);
  }
  if (c.victimParts.names.length === 0 || c.victimParts.jobs.length === 0) {
    errors.push('victim parts need names and jobs');
  }
  for (const v of c.victims) {
    if (!weaknesses.includes(v.weakness)) errors.push(`victim ${v.id}: bad weakness`);
  }
  const portraitIds = new Set(c.victims.map(v => v.id));
  for (const part of [...c.victimParts.names, ...c.victimParts.jobs]) {
    for (const id of part.portraits ?? []) {
      if (!portraitIds.has(id)) errors.push('unknown caller portrait: ' + id);
    }
  }
  for (const job of c.victimParts.jobs) {
    const [low, high] = job.age;
    if (!Number.isInteger(low) || !Number.isInteger(high) || low < 0 || high > 120 || low > high) {
      errors.push(`invalid caller age range for ${job.text.th}`);
      continue;
    }
    for (let age = low; age <= high; age++) {
      const portraits = callerPortraits(c, job, age);
      if (!portraits.length) errors.push(`no portrait for ${job.text.th}, age ${age}`);
      for (const portrait of portraits) {
        if (!callerNameIndices(c.victimParts, portrait.id, age).length)
          errors.push(`no name for ${portrait.id}, age ${age}`);
      }
    }
  }

  for (const d of c.dangerSigns) {
    for (const m of d.triggers.methods ?? []) {
      if (!methodIds.has(m)) errors.push(`danger sign ${d.id}: unknown method ${m}`);
    }
    for (const e of d.triggers.events ?? []) {
      if (!eventIds.has(e)) errors.push(`danger sign ${d.id}: unknown event ${e}`);
    }
  }
  if (!c.dangerSigns.some((d) => !d.triggers.methods && !d.triggers.events)) {
    errors.push('need at least one generic danger sign (no triggers)');
  }
  if (c.endings.length === 0) errors.push('no endings');

  return errors;
}
