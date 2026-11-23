import { careerDecisions, careerFee, careerSignatures, careerStatus, minimumJobCost, type Action, type GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { Button } from './ui';
import { fmt } from '../i18n';

type Props = { state: GameState; dispatch: (action: Action) => void };

export function CareerDirectory({ state }: Pick<Props, 'state'>) {
  return <details className="mb-3 rounded-xl border border-ink/20 bg-paper px-3 text-ink">
    <summary className="cursor-pointer py-2 font-semibold">เส้นทางทั้ง {content.methods.length} งาน</summary>
    <ul className="grid gap-2 pb-3 text-sm">{content.methods.map(method => {
      const { track, branch, shifts, needed } = careerStatus(state, method.id);
      return <li key={method.id}><strong>{method.name.th}</strong> · {branch ? track[branch].title : shifts >= needed ? 'เลือกสายได้แล้ว' : `ทำแล้ว ${shifts}/${needed} วันก่อนเลือกสาย`}
        <p>{track.rookie} → {track.regular} → {track.face.title} หรือ {track.boss.title}</p>
      </li>;
    })}</ul>
  </details>;
}

export function CareerDesk({ state, dispatch, method }: Props & { method: string }) {
  const { track, shifts, needed, branch, commissions, finale } = careerStatus(state, method);
  const title = branch ? track[branch].title : shifts ? track.regular : track.rookie;
  const decision = state.careers?.[method]?.decision;
  const choices = branch && careerDecisions[method]?.[branch];
  const signature = careerSignatures[state.characterId];
  const signatureUsed = Object.values(state.careers ?? {}).some(r => r.decision === 'talent');
  return <section className="mb-3 grid gap-2 rounded-xl border border-ink/20 bg-paper p-3 text-ink">
    <h3 className="font-bold">เส้นทางงาน · {title}</h3>
    {!branch ? <>
      <p className="text-sm">{shifts < needed ? `ทำงานนี้อีก ${needed - shifts} วันเพื่อเลือกสาย` : 'เลือกสายที่จะเล่นในรอบนี้'} · ทำแล้ว {shifts} วัน</p>
      {(['face', 'boss'] as const).map(id => <div key={id} className="rounded-lg bg-white p-2 text-sm">
        <strong>{track[id].title}</strong><p>{track[id].commission}</p>
        <p>{id === 'face' ? 'สายออกหน้า · โบนัสรายได้ +15% และ Heat จากงาน +10%' : 'สายคุมกิจการ · Heat จากงาน −10% และโบนัสรายได้ +8% ต่อลูกน้อง สูงสุด 3 คน'}</p>
        {shifts >= needed && <Button tone="paper" onClick={() => dispatch({ t: 'specialize', methodId: method, branch: id })}>เลือกสายนี้ตลอดรอบ · {track[id].title}</Button>}
      </div>)}
    </> : <>
      <p>{track[branch].commission}</p>
      {choices && commissions >= 1 && (decision ? <p>{decision === 'talent' ? signature?.result : `คุณเลือก “${choices[decision === 'patron' ? 0 : 1]}”`}</p> : <>
        <Button tone="sun" onClick={() => dispatch({ t: 'careerDecision', methodId: method, choice: 'patron' })}>{choices[0]} · เงินสกปรก ฿350 และ Heat +4</Button>
        <Button tone="paper" onClick={() => dispatch({ t: 'careerDecision', methodId: method, choice: 'local' })}>{choices[1]} · ชื่อเสียง +2 และกรรมดี +2</Button>
        {signature && !signatureUsed && <Button tone="mint" onClick={() => dispatch({ t: 'careerDecision', methodId: method, choice: 'talent' })}>
          {signature.action} · สิทธิ์ประจำอาชีพ 1 ครั้งต่อรอบ<br/>
          ชื่อเสียง +{signature.fame} · Heat {signature.heat > 0 ? '+' : ''}{signature.heat}{signature.cash > 0 && ` · เงินสกปรก ฿${fmt(signature.cash)}`}
        </Button>}
      </>)}
      {commissions < 3 ? <p className="text-sm">ทำงานในตำแหน่งนี้อีก {3 - commissions} วันเพื่อเปิดบทสรุป</p> :
        decision && <><strong>{track[branch].finale}</strong>
          {finale ? <p>{finale === 'fee' ? 'คุณรับค่าตัวปิดงานแล้ว' : 'คุณยกเครดิตให้คนในซอยแล้ว'}</p> : <>
            <Button tone="sun" onClick={() => dispatch({ t: 'careerFinale', methodId: method, choice: 'fee' })}>รับค่าตัวปิดงาน · เงินสกปรก ฿{fmt(careerFee(content, method))}</Button>
            <Button tone="paper" onClick={() => dispatch({ t: 'careerFinale', methodId: method, choice: 'credit' })}>ยกเครดิตให้คนในซอย · ชื่อเสียง +4 และ Heat −6</Button>
          </>}
        </>}
    </>}
  </section>;
}

export function ReliefDesk({ state, dispatch }: Props) {
  const cost = minimumJobCost(state, content);
  const due = state.favorDay;
  const box = 'mb-3 grid gap-2 rounded-xl border-2 border-ink bg-paper p-3 text-ink';
  if (due !== undefined && state.day >= due) return <section className={box}>
    <h3 className="font-bold">เจ๊โทรมาตามสัญญา</h3><p>วันนี้เจ๊ขอให้เฝ้าตลาดหนึ่งกะ ใช้เวลาหนึ่งวันเพื่อคืนบุญคุณ</p>
    <Button tone="sun" onClick={() => dispatch({ t: 'relief', job: 'favor' })}>ไปเฝ้าตลาดให้เจ๊</Button>
  </section>;
  if (cost === null || state.cleanCash + state.dirtyCash >= cost) return due === undefined ? null : <p className={box}>นัดเฝ้าตลาดให้เจ๊ วันที่ {due}</p>;
  return <section className={box}>
    <h3 className="font-bold">งานแก้ถังแตก · รับหน้าแทนเฮีย</h3>
    <p>งานที่รับได้วันนี้ใช้ทุนอย่างน้อย ฿{fmt(cost)} งานสองกะด้านล่างจ่ายเงินสกปรกหลังคิดค่าแรงทีม พอเป็นทุนรับงานที่ถูกที่สุด</p>
    <Button tone="paper" onClick={() => dispatch({ t: 'relief', job: 'mascot' })}>ใส่ชุดมาสคอตเฝ้าตลาด · ใช้ 1 วัน</Button>
    <Button tone="pink" onClick={() => dispatch({ t: 'relief', job: 'stage' })}>ขึ้นเวทีรับไมค์ · ใช้ 1 วัน ได้เพิ่ม ฿250 ชื่อเสียง +1 และ Heat +5</Button>
    {due !== undefined ? <p>นัดคืนบุญคุณวันที่ {due}</p> : state.day + 2 <= state.maxDays && state.advanceDay !== state.day &&
      <Button tone="sun" onClick={() => dispatch({ t: 'relief', job: 'advance' })}>รับซอง ฿{fmt(cost)} ไปทำงานวันนี้ · แลกกับเฝ้าตลาดวันที่ {state.day + 2}</Button>}
  </section>;
}
