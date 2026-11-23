import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newGame } from '@hts/shared';
import { content } from '@hts/shared/data';
import { sceneUrl } from '../src/assets/art';
import { EventPhase } from '../src/screens/phases';

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
    expect(opening, event.id).toBeDefined();
    expect(event.illustration?.scene).toBe(opening?.id);
    const markup = renderToStaticMarkup(createElement(EventPhase, {
      state: { ...player, phase: 'event', pendingEvents: [event.id] },
      dispatch: () => {},
    }));
    expect(markup).toContain(sceneUrl(opening!.id));
    expect(markup).toContain('alt="' + opening!.illustration!.alt + '"');
    expect(markup.includes('ภาพเปิดเรื่อง')).toBe(Boolean(event.chainOnly));
  }
});
