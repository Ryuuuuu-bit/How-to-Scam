import { heatBonusPct, incomeBonusPct, step } from '@hts/shared';
import type { GameState, ScamMethod, ShopItem } from '@hts/shared';
import { content } from '@hts/shared/data';

export function planEstimate(state: GameState, method: ScamMethod, cart: Record<string, number>) {
  const projected = { ...state, dailyItems: { ...state.dailyItems } };
  let skillLow = 0,
    skillHigh = 0;
  for (const item of content.shopItems) {
    const n = cart[item.id] ?? 0;
    if (item.kind === 'henchman') {
      skillLow += 5 * n;
      skillHigh += Math.max(5, item.incomePct ?? 15) * n;
    } else if (n) projected.dailyItems[item.id] = (projected.dailyItems[item.id] ?? 0) + n;
  }
  const income = incomeBonusPct(projected, content, method.id);
  const heat = heatBonusPct(projected, content, method.id);
  const scale = (base: number, pct: number) => Math.max(0, Math.round(base * (1 + pct / 100)));
  return {
    income: [
      scale(method.income[0], income + skillLow),
      scale(method.income[1], income + skillHigh),
    ] as const,
    heat: [scale(method.heat[0], heat), scale(method.heat[1], heat)] as const,
  };
}

export function itemEffect(it: ShopItem) {
  if (it.kind === 'henchman')
    return `รายได้ +5–${it.incomePct}% ตราบที่ยังอยู่กับทีม · ค่าแรง ฿${it.wage}/คนทุกวัน · ภักดีต่ำอาจซัดทอด`;
  return (
    [
      it.incomePct && `รายได้ +${it.incomePct}%`,
      it.heatPct && `Heat ที่เพิ่มจากงาน ${it.heatPct > 0 ? '+' : '−'}${Math.abs(it.heatPct)}%`,
    ]
      .filter(Boolean)
      .join(' · ') + ' ต่อชิ้น เฉพาะวันนี้'
  );
}

// Run the same actions on a copy. Buying a report never advances the live random sequence.
export function scoutHint(state: GameState, methodId: string, items: string[]) {
  let forecast = step(state, { t: 'choosePlan', methodId }, content);
  for (const itemId of items) forecast = step(forecast, { t: 'invest', itemId }, content);
  forecast = step(forecast, { t: 'confirmInvest' }, content);
  if (forecast.phase === 'escape') return 'มีสัญญาณไล่ล่า เตรียมรับมือ Heat';
  if (forecast.call) return 'ข่าวยังขึ้นกับการเลือกบทพูดและการรับสายในงานนี้';
  const event = content.events.find((e) => e.id === forecast.pendingEvents[0]);
  return event
    ? `เบาะแสแรก · ${{ lucky: 'มีโชคเข้าข้าง', unlucky: 'มีเรื่องให้เสียทรัพย์หรือแก้ปัญหา', silly: 'มีเรื่องชวนป่วน', karma: 'ผลจากการตัดสินใจกำลังตามมา' }[event.category]}`
    : 'ข่าวเงียบ วันนี้ไม่มีเหตุการณ์สุ่มหลังงานนี้';
}
