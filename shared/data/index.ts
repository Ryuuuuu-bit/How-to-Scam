import { lifeMilestones } from './events/lifeMilestones';
import { lifeStories } from './events/lifeStories';
import type { GameContent } from '../src/types/content';
import { victims, pitches, victimParts } from './callCenter';
import { festivals, news } from './calendar';
import { characters } from './characters';
import { config } from './config';
import { dangerSigns } from './dangerSigns';
import { endings } from './endings';
export { day30Ending } from './endings';
import { characterEvents } from './events/characters';
import { careerQuests } from './events/careerQuests';
import { cyberEvents } from './events/cyber';
import { karmaEvents } from './events/karma';
import { newsEvents } from './events/news';
import { soiPressEvents } from './events/soiPress';
import { sketchEvents } from './events/soiSketches';
import { firstShift } from './events/firstShift';
export { soiSketches, type SoiSketch } from './events/soiSketches';
import { seasonalEvents } from './events/seasonal';
import { storyEvents } from './events/stories';
import { luckyEvents } from './events/lucky';
import { sillyEvents } from './events/silly';
import { unluckyEvents } from './events/unlucky';
import { launderCards } from './launderCards';
import { methods } from './methods';
import { shopItems } from './shop';
import { shopV1Items } from './shopV1';
import { titles } from './titles';
import { achievements } from './achievements';
import { offers } from './offers';
import { disguises, routes } from './escape';

/** เนื้อหาเกมทั้งหมด — client และ server import ตัวนี้ตัวเดียวกัน */
export const content: GameContent = {
  config,
  methods,
  launderCards,
  events: [
    ...luckyEvents,
    ...unluckyEvents,
    ...sillyEvents,
    ...karmaEvents,
    ...characterEvents,
    ...storyEvents,
    ...seasonalEvents,
    ...newsEvents,
    ...cyberEvents,
    ...soiPressEvents,
    ...sketchEvents,
    ...firstShift,
    ...careerQuests,
    ...lifeStories,
    ...lifeMilestones,
  ],
  characters,
  shopItems: [...shopItems, ...shopV1Items],
  victims,
  victimParts,
  pitches,
  dangerSigns,
  endings,
  festivals,
  news,
  titles,
  achievements,
  offers,
  disguises,
  routes,
};
export { hideoutTiers } from './shopV1';
