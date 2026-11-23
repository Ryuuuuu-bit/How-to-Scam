import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { content } from '@hts/shared/data';
import { careerTracks, newGame } from '@hts/shared';
import { CareerDesk, CareerDirectory, ReliefDesk } from '../src/components/CareerDesk';

it('shows all career destinations and the three budget recovery choices', () => {
  const state = newGame('desk', 'grey_lawyer', content);
  const dispatch = () => {};
  const directory = renderToStaticMarkup(createElement(CareerDirectory, { state }));
  for (const method of content.methods) {
    const track = careerTracks[method.id];
    if (!track) throw Error(method.id);
    const detail = renderToStaticMarkup(createElement(CareerDesk, { state, dispatch, method: method.id }));
    for (const r of [track.face, track.boss]) {
      expect(directory).toContain(r.title);
      expect(detail).toContain(r.commission);
    }
  }
  state.dirtyCash = 0;
  const view = () => renderToStaticMarkup(createElement(ReliefDesk, { state, dispatch }));
  for (const text of ['มาสคอต', 'รับไมค์', 'รับซอง']) expect(view()).toContain(text);
  state.favorDay = state.day;
  expect(view()).toContain('ไปเฝ้าตลาดให้เจ๊');
  expect(view()).not.toContain('รับซอง');
});
