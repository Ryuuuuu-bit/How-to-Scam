import type { GameContent } from '../src/types/content';
import { victims, pitches } from './callCenter';
import { characters } from './characters';
import { config } from './config';
import { dangerSigns } from './dangerSigns';
import { endings } from './endings';
import { karmaEvents } from './events/karma';
import { luckyEvents } from './events/lucky';
import { sillyEvents } from './events/silly';
import { unluckyEvents } from './events/unlucky';
import { launderCards } from './launderCards';
import { methods } from './methods';
import { shopItems } from './shop';

/** เนื้อหาเกมทั้งหมด — client และ server import ตัวนี้ตัวเดียวกัน */
export const content: GameContent = {
  config,
  methods,
  launderCards,
  events: [...luckyEvents, ...unluckyEvents, ...sillyEvents, ...karmaEvents],
  characters,
  shopItems,
  victims,
  pitches,
  dangerSigns,
  endings,
};
