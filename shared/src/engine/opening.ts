import { hashSeed, Rng } from './rng';

export function openingFor(seed: string, characterId: string) {
  if (!seed.startsWith('v3:')) return null;
  const rng = new Rng(hashSeed('opening-v1:' + seed));
  if (!rng.chance(60)) return null;
  const stories = ['mother', 'guild', 'parcel'] as const;
  const favorite = characterId === 'gamer_kid' ? 'guild'
    : ['live_seller', 'phone_tech'].includes(characterId) ? 'parcel' : 'mother';
  return rng.pick([...stories, favorite, favorite] as const);
}
