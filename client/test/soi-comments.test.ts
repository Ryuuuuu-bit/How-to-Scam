import { expect, it } from 'vitest';
import { careerSeedPrefix, newGame, step } from '@hts/shared';
import { content } from '@hts/shared/data';
import { reactionMeme } from '../src/game/memes';
import { dailyArticles } from '../src/game/newspaper';

it.each(content.events.filter(e => e.when.careerEdition))(
  'keeps the immediate $id punchline separate from the next-day reader comment',
  event => {
    const start = newGame(careerSeedPrefix + 'copy-qa', 'phone_tech', content);
    const planned = step({ ...start, day: 4 }, { t: 'choosePlan', methodId: null }, content);
    for (const [choiceIdx, choice] of event.choices.entries()) {
      const resolved = step({ ...planned, phase: 'event', pendingEvents: [event.id] },
        { t: 'eventChoice', choiceIdx }, content);
      expect(reactionMeme(resolved, null)).toBeNull();
      const paper = dailyArticles({ ...resolved, day: 5 }, content).at(-1);
      expect(paper?.events).toContain(event.title.th);
      expect(paper?.meme?.caption).toBeTruthy();
      expect(paper?.meme?.caption).not.toBe(choice.outcomes[0]?.text.th);
    }
  },
);
