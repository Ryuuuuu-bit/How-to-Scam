import type { GameState } from '@hts/shared';
import { neighborhoodHeadline } from '../game/origins';
import { content } from '@hts/shared/data';
import { Art, Panel } from './ui';
import { sceneUrl } from '../assets/art';

export function ClosingEdition({ state }: { state: GameState }) {
  const end = state.end;
  if (!end) return null;
  const ending = content.endings.find((e) => e.id === end.endingId)?.title.th ?? 'ปิดคดี';
  const hire = state.history.find((d) => d.recruits?.length);
  const names = hire?.recruits
    ?.map((id) => content.shopItems.find((i) => i.id === id)?.name.th.split(' · ')[0])
    .filter(Boolean)
    .join(' และ ');
  const personal = state.history.find((d) =>
    d.events.some((id) => id === 'nat_receipt' || id === 'tuk_mic'),
  );
  const interview = state.history.find((d) => d.interview);
  const eventDay = personal ?? interview ?? state.history.find((d) => d.events.length);
  const eventId =
    eventDay?.events.find((id) => id === 'nat_receipt' || id === 'tuk_mic') ??
    (eventDay?.interview ? 'reporter_aunt' : eventDay?.events[0]);
  const title = content.events.find((e) => e.id === eventId)?.title.th;
  const first = state.history[0];
  const originHeadline = neighborhoodHeadline(state);
  const method = content.methods.find((m) => m.id === first?.methodId);
  const scene = eventId ? 'ev_' + eventId : 'end_' + end.endingId;
  const illustration = eventId === 'nat_receipt' ? 'shop:intern_nat'
    : eventId === 'tuk_mic' ? 'shop:host_tuk'
    : sceneUrl(scene) ? 'scene:' + scene : 'icon:news';
  return (
    <Panel tone="paper" className="text-left text-ink">
      <p className="border-b-4 border-ink pb-2 font-display text-lg font-bold">เดลี่ต้มตุ๋น · ฉบับปิดคดี</p>
      <h2 className="my-3 text-2xl font-bold">
        {originHeadline || (names ? `จากวันที่ ${names} เข้าทีม ถึงฉากจบ “${ending}”` : ending)}
      </h2>
      <div className="flex items-center gap-3">
        <Art id={illustration} size={85} className="shrink-0" />
        <ol className="space-y-2 text-sm">
          {hire && names ? (
            <li>
              วันที่ {hire.day} · รับ {names} เข้าทีม
            </li>
          ) : (
            first && (
              <li>
                วันที่ {first.day} · {method?.name.th ?? 'พักงาน'}
              </li>
            )
          )}
          {eventDay && title && (
            <li>
              วันที่ {eventDay.day} · {title}
            </li>
          )}
          <li>
            วันที่ {state.day} · {ending} · {end.score.toLocaleString('th-TH')} คะแนน
          </li>
        </ol>
      </div>
    </Panel>
  );
}
