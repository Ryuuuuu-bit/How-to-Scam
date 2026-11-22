import { hashSeed, Rng } from './rng';
import type { GameState } from '../types/state';

export const originSeedPrefix = 'v3:soi:live:origin:';
export const origins = ['curry', 'arcade', 'dorm'] as const;
export type Origin = typeof origins[number];
export const originRewards = { help: { fame: 3 }, later: { cleanCash: 150 } } as const;

export function originFor(seed: string): Origin | null {
  if (!seed.startsWith(originSeedPrefix)) return null;
  const rng = new Rng(hashSeed(seed + ':neighborhood'));
  return rng.chance(75) ? rng.pick(origins) : null;
}

export function originStage(s: GameState) {
  if (s.phase !== 'plan' || !originFor(s.seed)) return null;
  if (s.day === 1 && !s.originStory) return 'opening';
  if (s.day >= 3 && s.originStory && !s.originStory.followedUpOn) return 'followup';
  return null;
}

export function openingFor(seed: string, characterId: string) {
  if (originFor(seed)) return null;
  if (!seed.startsWith('v3:')) return null;
  const rng = new Rng(hashSeed('opening-v1:' + seed));
  if (!rng.chance(60)) return null;
  const stories = ['mother', 'guild', 'parcel'] as const;
  const favorite = characterId === 'gamer_kid' ? 'guild'
    : ['live_seller', 'phone_tech'].includes(characterId) ? 'parcel' : 'mother';
  return rng.pick([...stories, favorite, favorite] as const);
}
