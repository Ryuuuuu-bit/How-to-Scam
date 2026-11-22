import { useEffect } from 'react';
import { originFor, originRewards, originStage, type Action, type GameState } from '@hts/shared';
import { audio } from '../audio/audio';
import { sceneUrl } from '../assets/art';
import { Button } from '../components/ui';
import { originStories } from '../game/origins';

export function OriginChat({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const origin = originFor(state.seed, state.characterId);
  const stage = originStage(state);
  useEffect(() => {
    if (!stage) return;
    audio.setScene('focus');
    audio.sfx('sfx_card_flip', 'paper');
    return () => audio.setScene('normal');
  }, [stage]);
  if (!origin || !stage) return null;
  const story = originStories[origin];
  const reply = state.originStory?.reply;
  const sender = reply === 'help' ? story.contact : story.sender;
  function collect() {
    if (reply === 'later') audio.sfx('sfx_coins', 'cash');
    else audio.play('hire');
    dispatch({ t: 'readOrigin' });
  }
  return <section className="overflow-hidden rounded-3xl border-[3px] border-ink bg-paper text-ink shadow-pop" aria-label="เรื่องประจำซอย">
    <header className="flex min-h-32 flex-col justify-end bg-cover bg-center p-4 text-white" style={{backgroundImage: `linear-gradient(0deg,#171322ed,transparent),url(${sceneUrl(story.scene)})`}}>
      <small>ภูมิหลังของคุณ · วันที่ {state.day}</small><h2 className="font-display text-2xl font-bold">{story.title}</h2>
    </header>
    <div className="grid gap-3 p-4">
      <strong>{sender}</strong>
      <p className="rounded-2xl rounded-tl-none border border-ink bg-white p-3">{reply ? story[reply].message : story.message}</p>
      {reply ? <>
        <small>วันที่ 1 คุณเลือก “{story[reply].label}”</small>
        <Button tone="sun" block onClick={collect}>{reply === 'help' ? `รับชื่อเสียง +${originRewards.help.fame}` : `รับเงินสะอาด ฿${originRewards.later.cleanCash}`}</Button>
      </> : <>
        <Button tone="sun" block onClick={() => dispatch({ t:'replyOrigin', reply:'help' })}>{story.help.label}</Button>
        <Button tone="paper" block onClick={() => dispatch({ t:'replyOrigin', reply:'later' })}>{story.later.label}</Button>
        <small>ตอบแชตแล้วเลือกแผนงานวันนี้ได้ตามปกติ</small>
      </>}
    </div>
  </section>;
}
