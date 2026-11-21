import type { GameContent, Weakness } from './types/content';

/**
 * ตรวจความถูกต้องของข้อมูลเกม คืนรายการปัญหา (ว่าง = ผ่าน)
 * ใช้ใน unit test เพื่อจับข้อมูลผิดก่อนขึ้นเกมจริง
 */
export function validateContent(c: GameContent): string[] {
  const errors: string[] = [];
  const methodIds = new Set(c.methods.map((m) => m.id));
  const eventIds = new Set(c.events.map((e) => e.id));

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
    if (ev.choices.length < 1 || ev.choices.length > 3) {
      errors.push(`event ${ev.id}: must have 1–3 choices`);
    }
    for (const [i, ch] of ev.choices.entries()) {
      if (ch.outcomes.length === 0) errors.push(`event ${ev.id} choice ${i}: no outcomes`);
      for (const o of ch.outcomes) {
        for (const e of o.effects) {
          if (e.kind === 'modifier' && e.methodId && !methodIds.has(e.methodId)) {
            errors.push(`event ${ev.id}: unknown method ${e.methodId} in modifier`);
          }
        }
      }
    }
    for (const m of ev.when.methods ?? []) {
      if (!methodIds.has(m)) errors.push(`event ${ev.id}: unknown method ${m}`);
    }
  }

  const weaknesses: Weakness[] = ['greed', 'fear', 'faith', 'lonely'];
  for (const w of weaknesses) {
    if (!c.pitches.some((p) => p.weakness === w)) errors.push(`no pitch for weakness ${w}`);
  }
  for (const v of c.victims) {
    if (!weaknesses.includes(v.weakness)) errors.push(`victim ${v.id}: bad weakness`);
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
