// ส่วนเสริมของรุ่น 1.2: ป้ายเหยื่อกลับมา ปุ่มย้อนวัน และสรุปบัญชีท้ายสัปดาห์
import { useState } from 'react';
import {
  activeReturn,
  canRewind,
  finishedWeek,
  weekLedger,
  type Action,
  type FlowKind,
  type GameState,
  washPending,
} from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt } from '../i18n';

/** บอกว่าเหยื่อคนนี้โดนหลอกจากงานไหน วันไหน และเท่าไหร่ */
export function VictimTag({ state }: { state: GameState }) {
  const r = activeReturn(state);
  if (!r) return null;
  const m = content.methods.find((x) => x.id === r.methodId);
  return (
    <p className="victim-tag mt-2 rounded-lg border border-ink/30 bg-white/70 px-2 py-1 text-sm text-ink">
      🧾 เหยื่อจากงาน <b>{m ? lt(m.name) : r.methodId}</b> เมื่อวันที่ {r.from} · โอนให้คุณ ฿{fmt(r.take)}
    </p>
  );
}

/** ย้อนกลับไปต้นวัน 1 ครั้งต่อรอบ ต้องกดยืนยันก่อน */
export function RewindButton({
  state,
  actions,
  onRewind,
}: {
  state: GameState;
  actions: Action[];
  onRewind: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!canRewind(state, actions)) return null;
  const penalty = Math.round(content.config.rewindStylePenalty * 100);
  if (!asking)
    return (
      <button
        type="button"
        className="rewind-button min-h-11 rounded-full border-2 border-ink bg-paper px-3 text-sm font-semibold text-ink"
        onClick={() => setAsking(true)}
      >
        ⏪ ย้อนวัน (เหลือ 1 ครั้ง)
      </button>
    );
  return (
    <div
      role="alertdialog"
      aria-label="ยืนยันย้อนวัน"
      className="rewind-confirm rounded-xl border-2 border-ink bg-sun p-3 text-sm text-ink"
    >
      <p>
        <b>ย้อนกลับไปต้นวันนี้?</b> ทุกอย่างที่ทำวันนี้จะหายไป ใช้ได้ครั้งเดียวต่อรอบ และคะแนนสไตล์ตอนจบลด {penalty}%
        ถ้าเลือกเหมือนเดิม ผลก็จะออกเหมือนเดิม
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-full border-2 border-ink bg-pink px-3 font-semibold"
          onClick={() => {
            setAsking(false);
            onRewind();
          }}
        >
          ย้อนเลย
        </button>
        <button
          type="button"
          className="min-h-11 flex-1 rounded-full border-2 border-ink bg-paper px-3"
          onClick={() => setAsking(false)}
        >
          ไม่ย้อน
        </button>
      </div>
    </div>
  );
}

const flowNames: Record<FlowKind, string> = {
  job: 'รายได้จากงาน (หักทุนแล้ว)',
  gear: 'ของช่วยงาน ข่าว และข้อเสนอ',
  events: 'เหตุการณ์ระหว่างวัน',
  launder: 'ฟอกเงิน (ค่าฟอก หรือเงินที่ทยอยเข้า)',
  shop: 'ร้านค้าและตลาดใต้ดิน',
  wages: 'ค่าแรงทีม',
  escape: 'หนีตำรวจและค่าส่วย',
  other: 'อื่นๆ ในซอย',
};

/** สรุปบัญชีของสัปดาห์ที่เพิ่งจบ แสดงต้นวันที่ 8, 15, 22, ... */
export function WeekLedgerCard({ state }: { state: GameState }) {
  const week = finishedWeek(state);
  const [open, setOpen] = useState(true);
  if (!week) return null;
  const w = weekLedger(state, week);
  const rows = (Object.keys(flowNames) as FlowKind[]).filter((k) => w.flow[k] !== 0);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="week-ledger mb-3 rounded-xl border-2 border-ink bg-paper p-3 text-sm text-ink"
    >
      <summary className="cursor-pointer font-semibold">
        🧾 สรุปบัญชีสัปดาห์ที่ {week} (วันที่ {w.fromDay}–{w.toDay}) · สุทธิ {w.net >= 0 ? '+' : '−'}฿
        {fmt(Math.abs(w.net))}
      </summary>
      <ul className="mt-2 space-y-1">
        {rows.map((k) => (
          <li key={k} className="flex justify-between gap-2">
            <span>{flowNames[k]}</span>
            <b className={w.flow[k] < 0 ? 'text-[#b4233b]' : 'text-clean'}>
              {w.flow[k] >= 0 ? '+' : '−'}฿{fmt(Math.abs(w.flow[k]))}
            </b>
          </li>
        ))}
        {rows.length === 0 && <li>สัปดาห์นี้เงินไม่ขยับเลย</li>}
      </ul>
      {w.laundered > 0 && (
        <p className="mt-2 text-xs">
          ฟอกเป็นเงินสะอาดได้ ฿{fmt(w.laundered)} (ย้ายกระเป๋า ไม่นับเป็นเงินเข้า)
        </p>
      )}
    </details>
  );
}

/** เงินสะอาดที่กำลังทยอยเข้า (การ์ดฟอกแบบทยอย) */
export function WashPendingNote({ state }: { state: GameState }) {
  const left = washPending(state);
  if (left <= 0) return null;
  const today = (state.washQueue ?? [])
    .filter((x) => x.day === state.day + 1)
    .reduce((n, x) => n + x.amount, 0);
  return (
    <p className="wash-pending mb-3 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm text-ink">
      ⏳ เงินสะอาดกำลังทยอยเข้าอีก <b>฿{fmt(left)}</b>
      {today > 0 ? ` · พรุ่งนี้เข้า ฿${fmt(today)}` : ''} · ถ้าโดนจับก่อน ส่วนที่ค้างจะถูกยึด
    </p>
  );
}
