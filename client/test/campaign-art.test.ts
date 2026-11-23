import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newGame } from '@hts/shared';
import { content } from '@hts/shared/data';
import { ART, sceneUrl } from '../src/assets/art';
import { EndingCard } from '../src/components/EndingCard';
import { EventPhase } from '../src/screens/phases';

it('renders every ending with a real scene and the selected career portrait', () => {
  for (const character of content.characters) {
    const state = newGame('ending-art', character.id, content);
    const portrait = ART['char:' + character.id]?.src;
    if (!portrait) throw Error('Missing portrait for ' + character.id);
    for (const ending of content.endings) {
      const scene = sceneUrl('end_' + ending.id);
      if (!scene) throw Error('Missing ending scene for ' + ending.id);
      state.end = { endingId: ending.id, reason: ending.when.reasons?.[0] ?? 'retired', score: 0, dangerSignIds: [] };
      const markup = renderToStaticMarkup(createElement(EndingCard, { state }));
      expect(markup).toContain(scene);
      expect(markup).toContain(portrait);
      expect(markup).toContain(character.name.th);
    }
  }
});

it('loads distinct campaign artwork for every opening and keeps each branch with its original story', () => {
  const campaign = content.events.filter(event => event.lifeStory);
  const openings = campaign.filter(event => !event.chainOnly);
  const player = newGame('check-art', 'orange_cat', content);
  const urls = new Set<string>();
  for (const event of openings) {
    expect(event.illustration?.scene).toBe(event.id);
    const url = sceneUrl(event.id);
    expect(url, event.id).toBeTruthy();
    if (url) urls.add(url);
  }
  expect(urls.size).toBe(46);
  for (const event of campaign) {
    const opening = openings.find(root => root.id === event.id || event.id.startsWith(root.id + '_'));
    if (!opening?.illustration) throw Error('Missing opening illustration for ' + event.id);
    expect(event.illustration?.scene).toBe(opening?.id);
    const markup = renderToStaticMarkup(createElement(EventPhase, {
      state: { ...player, phase: 'event', pendingEvents: [event.id] },
      dispatch: () => {},
    }));
    expect(markup).toContain(sceneUrl(opening.id));
    expect(markup).toContain('alt="' + opening.illustration.alt + '"');
    expect(markup.includes('ภาพเปิดเรื่อง')).toBe(Boolean(event.chainOnly));
  }
});
