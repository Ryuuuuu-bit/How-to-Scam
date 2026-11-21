import type { GameContent } from '../types/content';
import { invariant } from './errors';

type Keyed = { id: string };

function find<T extends Keyed>(list: readonly T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  invariant(item, `unknown ${what}: ${id}`);
  return item;
}

export const getMethod = (c: GameContent, id: string) => find(c.methods, id, 'method');
export const getCard = (c: GameContent, id: string) => find(c.launderCards, id, 'launder card');
export const getEvent = (c: GameContent, id: string) => find(c.events, id, 'event');
export const getCharacter = (c: GameContent, id: string) => find(c.characters, id, 'character');
export const getShopItem = (c: GameContent, id: string) => find(c.shopItems, id, 'shop item');
export const getVictim = (c: GameContent, id: string) => find(c.victims, id, 'victim');
export const getPitch = (c: GameContent, id: string) => find(c.pitches, id, 'pitch');
