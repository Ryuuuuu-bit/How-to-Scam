import { useState } from 'react';
import {
  allyAt,
  foeAt,
  formCost,
  formIds,
  npcs,
  placeIds,
  places,
  repOf,
  shapeAfterShifts,
} from '@hts/shared';
import type { Action, GameState, NpcId, PlaceForm, PlaceId } from '@hts/shared';
import { content } from '../game/content';
import { fmt, lt } from '../i18n';
import { soiArtUrl } from '../assets/art';

export const placeIcon: Record<PlaceId, string> = {
  market: '🏮',
  temple: '🛕',
  field: '⚽',
  dorm: '🏢',
  mookata: '🔥',
};
const formTone: Record<PlaceForm, string> = { patron: 'patron', local: 'local', show: 'show' };
export const formLabel: Record<PlaceForm, string> = {
  patron: 'สายนายทุน',
  local: 'สายชุมชน',
  show: 'สายดัง',
};
const formEffect: Record<PlaceForm, string> = {
  patron: 'งานที่นี่รายได้ +20% แต่ Heat +10%',
  local: 'งานที่นี่ Heat −20%',
  show: 'งานที่นี่รายได้ +10% และชื่อเสียง +1 ทุกกะ',
};
// ตำแหน่งบนแผนที่ (เปอร์เซ็นต์ของกรอบ)
const pin: Record<PlaceId, { x: number; y: number }> = {
  market: { x: 18, y: 76 },
  dorm: { x: 50, y: 52 },
  mookata: { x: 80, y: 74 },
  temple: { x: 22, y: 20 },
  field: { x: 78, y: 22 },
};

function formCostText(f: PlaceForm) {
  const c = formCost[f];
  const parts: string[] = [];
  if (c.cash > 0) parts.push(`รับเงินนายทุน ฿${fmt(c.cash)}`);
  if (c.cash < 0) parts.push(`ลงขัน ฿${fmt(-c.cash)}`);
  if (c.heat) parts.push(`Heat ${c.heat > 0 ? '+' : ''}${c.heat}`);
  if (c.fame) parts.push(`ชื่อเสียง +${c.fame}`);
  return parts.join(' · ');
}

export function RepMeter({ value, name }: { value: number; name: string }) {
  const label = value >= allyAt ? 'อยู่ข้างคุณ' : value <= foeAt ? 'เริ่มพูดกับตำรวจ' : value > 0 ? 'เริ่มเอ็นดู' : value < 0 ? 'เริ่มระแวง' : 'เฉย ๆ';
  return (
    <span className="rep-meter" role="meter" aria-label={`${name} รู้สึกกับคุณ: ${label}`} aria-valuemin={-3} aria-valuemax={3} aria-valuenow={value}>
      {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
        <i key={n} data-on={n === 0 ? undefined : (n < 0 ? value <= n : value >= n) || undefined} data-side={n < 0 ? 'foe' : n > 0 ? 'ally' : 'mid'} />
      ))}
      <small>{label}</small>
    </span>
  );
}

/** แอปแผนที่ซอย */
export function SoiMap({ state }: { state: GameState }) {
  const soi = state.soi;
  const [picked, setPicked] = useState<PlaceId>(() => soi?.pendingShape ?? 'market');
  if (!soi) return null;
  const p = places[picked];
  const ps = soi.places[picked];
  const npc = npcs[p.npc];
  const rep = repOf(state, p.npc);
  return (
    <div className="soi-map-app">
      <div className="soi-map" role="group" aria-label="แผนที่ซอย">
        <svg className="soi-map-roads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 76 Q 34 62 50 52 T 80 74" />
          <path d="M22 20 Q 36 38 50 52 Q 64 38 78 22" />
          <path d="M0 92 L 100 88" className="main-road" />
        </svg>
        {placeIds.map((id) => {
          const st = soi.places[id];
          return (
            <button
              key={id}
              type="button"
              className="soi-pin"
              data-form={st.form ? formTone[st.form] : undefined}
              data-pending={soi.pendingShape === id || undefined}
              aria-pressed={picked === id}
              style={{ left: `${pin[id].x}%`, top: `${pin[id].y}%` }}
              onClick={() => setPicked(id)}
            >
              <span className="soi-pin-icon" aria-hidden="true">{placeIcon[id]}</span>
              <span className="soi-pin-name">{st.form ? places[id].forms[st.form].name : places[id].name}</span>
            </button>
          );
        })}
      </div>
      <article className="soi-place-card">
        {soiArtUrl(picked, ps.form) && <img src={soiArtUrl(picked, ps.form)} alt="" className="soi-place-art" />}
        <small>{ps.form ? `${formLabel[ps.form]} · เปลี่ยนแล้ว` : `ทำงานที่นี่แล้ว ${Math.min(ps.visits, shapeAfterShifts)}/${shapeAfterShifts} กะ ก่อนซอยขอให้คุณตัดสินใจ`}</small>
        <h3>{ps.form ? p.forms[ps.form].name : p.name}</h3>
        <p>{ps.form ? p.forms[ps.form].news : p.blurb}</p>
        <p className="soi-jobs">
          งานในย่านนี้: {p.methods.map((m) => lt(content.methods.find((x) => x.id === m)?.name ?? { th: m })).join(' · ')}
        </p>
        {ps.form && <p className="soi-bonus">{formEffect[ps.form]}</p>}
        <div className="soi-npc">
          <div>
            <strong>{npc.name}</strong>
            <small>{npc.role}</small>
          </div>
          <RepMeter value={rep} name={npc.name} />
          <p>{rep >= allyAt ? npc.ally : rep <= foeAt ? npc.foe : `ถ้าเป็นพวกเดียวกัน: ${npc.ally}`}</p>
        </div>
      </article>
    </div>
  );
}

/** การ์ดที่ต้องตัดสินใจก่อนเริ่มงาน: ซอยเปลี่ยน หรือ นัดชนกัน */
export function SoiDecision({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const soi = state.soi;
  if (!soi) return null;
  const money = state.dirtyCash + state.cleanCash;
  if (soi.pendingShape) {
    const id = soi.pendingShape;
    const p = places[id];
    return (
      <section className="soi-decision" aria-labelledby="soi-shape-title">
        <span className="eyebrow">ทั้งซอยจำคุณได้ · {placeIcon[id]} {p.name}</span>
        <h2 id="soi-shape-title">คนในซอยรอฟังว่าที่นี่จะเป็นแบบไหน</h2>
        <p>คุณมาทำงานที่นี่บ่อยจน{npcs[p.npc].name}เรียกประชุมหน้าร้าน ทางที่เลือกจะเปลี่ยนสถานที่นี้ไปจนจบรอบ</p>
        <div className="soi-forms">
          {formIds.map((f) => {
            const form = p.forms[f];
            const cost = formCost[f];
            const short = cost.cash < 0 && money < -cost.cash;
            return (
              <button
                key={f}
                type="button"
                className="soi-form"
                data-form={f}
                disabled={short}
                onClick={() => dispatch({ t: 'shapePlace', place: id, form: f })}
              >
                {soiArtUrl(id, f) && <img src={soiArtUrl(id, f)} alt="" />}
                <small>{formLabel[f]}</small>
                <strong>{form.name}</strong>
                <span>{form.pitch}</span>
                <em>{formEffect[f]}</em>
                <b>{short ? `ต้องมีเงิน ฿${fmt(-cost.cash)}` : formCostText(f)}</b>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
  const ap = soi.appointment;
  if (ap && ap.day === state.day) {
    return (
      <section className="soi-decision" aria-labelledby="soi-clash-title">
        <span className="eyebrow">นัดชนกัน · วันที่ {state.day}</span>
        <h2 id="soi-clash-title">สองคนโทรมาขอแรงในเวลาเดียวกัน</h2>
        <p>ไปได้ที่เดียว คนที่คุณเลือกจะจำน้ำใจครั้งนี้ อีกคนจะจำว่าคุณไม่มา</p>
        <div className="soi-clash">
          {ap.npcs.map((id: NpcId) => {
            const n = npcs[id];
            const r = n.reward;
            const reward = [r.cash ? `฿${fmt(r.cash)}` : '', r.heat ? `Heat ${r.heat}` : '', r.fame ? `ชื่อเสียง +${r.fame}` : ''].filter(Boolean).join(' · ');
            return (
              <button key={id} type="button" className="soi-call" onClick={() => dispatch({ t: 'appointment', npc: id })}>
                <span className="soi-call-head">
                  <strong>{n.name}</strong>
                  <small>{n.role}</small>
                </span>
                <span className="soi-bubble">“{n.ask}”</span>
                <RepMeter value={repOf(state, id)} name={n.name} />
                <b>ไปช่วย{n.name} · {reward}</b>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
  return null;
}
