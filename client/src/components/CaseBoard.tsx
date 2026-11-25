import {
  burnCost,
  caseActions,
  caseStrength,
  coldCaseDays,
  raidCooldownDays,
  evidenceInfo,
  isAlly,
  raidThreshold,
} from '@hts/shared';
import type { Action, GameState } from '@hts/shared';
import { content } from '../game/content';
import { fmt, lt } from '../i18n';
import { Button } from './ui';

const pinTilt = [-4, 3, -2, 5, -5, 2, 4, -3];

/** แอปบอร์ดหลักฐาน: เห็นว่าสารวัตรหมูกระทะมีอะไรอยู่ในมือ และตอบโต้ได้วันละหนึ่งครั้ง */
export function CaseBoard({ state, dispatch }: { state: GameState; dispatch?: (a: Action) => void }) {
  const c = state.case;
  if (!c) return null;
  const strength = caseStrength(state);
  const threshold = raidThreshold(state);
  const money = state.dirtyCash + state.cleanCash;
  const canAct = Boolean(dispatch) && state.phase === 'plan' && c.actedDay !== state.day;
  const hasDecoy = c.evidence.some((e) => e.kind === 'decoy');
  const t = caseActions.tipoff;
  const tipCooling = c.tipoffDay !== undefined && state.day - c.tipoffDay < t.cooldown;
  const cooldownLeft = c.raids > 0 && c.lastRaidDay !== undefined ? Math.max(0, raidCooldownDays - (state.day - c.lastRaidDay)) : 0;
  return (
    <div className="case-app">
      <div className="case-meter" role="meter" aria-label="น้ำหนักคดี" aria-valuemin={0} aria-valuemax={threshold} aria-valuenow={strength}>
        <div className="case-meter-head">
          <strong>น้ำหนักคดี {strength}/{threshold}</strong>
          <small>
            {strength >= threshold
              ? cooldownLeft > 0
                ? `สารวัตรเพิ่งบุก พักแฟ้มอีก ${cooldownLeft} วัน`
                : 'คืนนี้สารวัตรพร้อมบุกค้น'
              : `อีก ${threshold - strength} สารวัตรจะขอหมายค้น`}
          </small>
        </div>
        <div className="case-meter-bar">
          <span style={{ width: `${Math.min(100, (strength / threshold) * 100)}%` }} />
        </div>
        <p>
          หลักฐานเก่ากว่า {coldCaseDays} วันจะจางลงทีละขั้น · ถ้าต้องหนีตำรวจ โอกาสรอดลด {strength * 2}%
          {isAlly(state, 'jae') && ' · เจ๊หมวยจะส่งข่าวก่อนบุก'}
          {isAlly(state, 'hia') && ' · เฮียโต้งถ่วงเวลาสารวัตรให้'}
        </p>
      </div>

      <div className="cork-board" aria-label="บอร์ดหลักฐาน">
        {c.evidence.length === 0 && <p className="cork-empty">บอร์ดยังว่าง สารวัตรนั่งกินหมูรออยู่</p>}
        {c.evidence.map((e, i) => {
          const info = evidenceInfo[e.kind];
          const method = e.methodId ? content.methods.find((m) => m.id === e.methodId) : undefined;
          const cost = burnCost(state, e.weight);
          return (
            <figure key={e.id} className="evidence-card" data-kind={e.kind} style={{ rotate: `${pinTilt[i % pinTilt.length]}deg` }}>
              <i className="evidence-pin" aria-hidden="true" />
              <figcaption>
                <strong>{info.name}</strong>
                <small>
                  วันที่ {e.day}
                  {method ? ` · ${lt(method.name)}` : ''}
                </small>
                <span>{info.note}</span>
                {e.kind !== 'decoy' && <b aria-label={`น้ำหนัก ${e.weight}`}>{'●'.repeat(e.weight)}</b>}
              </figcaption>
              {e.kind !== 'decoy' && canAct && (
                <button type="button" className="evidence-burn" disabled={money < cost} onClick={() => dispatch?.({ t: 'caseMove', kind: 'burn', evidenceId: e.id })}>
                  ทำลาย ฿{fmt(cost)}
                </button>
              )}
            </figure>
          );
        })}
      </div>

      {dispatch && (
        <div className="case-moves">
          <h3>เดินเกมกับสารวัตร {canAct ? '· วันละครั้ง' : state.phase !== 'plan' ? '· ทำได้ตอนวางแผนเช้า' : '· วันนี้เดินแล้ว'}</h3>
          <Button tone="paper" block disabled={!canAct || hasDecoy || money < caseActions.decoy.price} onClick={() => dispatch({ t: 'caseMove', kind: 'decoy' })}>
            <span>
              วางเบาะแสปลอม · ฿{fmt(caseActions.decoy.price)}
              <small className="block font-normal">{hasDecoy ? 'มีเบาะแสปลอมรออยู่แล้ว' : 'ครั้งหน้าที่สารวัตรบุก เขาจะไปผิดที่ และคุณได้ชื่อเสียง +2'}</small>
            </span>
          </Button>
          <Button tone="sun" block className="mt-2" disabled={!canAct || tipCooling || state.fame < t.minFame} onClick={() => dispatch({ t: 'caseMove', kind: 'tipoff' })}>
            <span>
              ป้อนข่าวแก๊งคู่แข่ง
              <small className="block font-normal">
                {state.fame < t.minFame
                  ? `ต้องมีชื่อเสียง ${t.minFame} สารวัตรถึงจะเชื่อ`
                  : tipCooling
                    ? `สารวัตรยังไล่จับคนเดิมอยู่ ใช้ได้อีกครั้งวันที่ ${(c.tipoffDay ?? 0) + t.cooldown}`
                    : `ลบหลักฐาน ${t.clears} ขั้น · Heat ${t.heat} · แต่ใจคุณหนักขึ้น`}
              </small>
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
