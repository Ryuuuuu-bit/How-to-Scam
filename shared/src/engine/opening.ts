import { hashSeed, Rng } from './rng';
import type { GameState } from '../types/state';

export const originSeedPrefix = 'v3:soi:live:origin:';
export const careerSeedPrefix = originSeedPrefix + 'career:';
export const sketchSeedPrefix = careerSeedPrefix + 'sketch:';
export const origins = ['curry', 'arcade', 'dorm'] as const;
export const careerOrigins = {
  ex_insurance: 'policy', gamer_kid: 'arcade', temple_kid: 'fair', live_seller: 'studio',
  phone_tech: 'workbench', fortune_teller: 'horoscope', rich_coach: 'seminar',
  fallen_star: 'cinema', ex_banker: 'counter', share_auntie: 'ledger', orange_cat: 'parcelCat',
} as const;
export type Origin = typeof origins[number] | (typeof careerOrigins)[keyof typeof careerOrigins];
export const originRewards = { help: { fame: 3 }, later: { cleanCash: 150 } } as const;

export function originFor(seed: string, characterId?: string): Origin | null {
  if (!seed.startsWith(originSeedPrefix)) return null;
  const rng = new Rng(hashSeed(seed + ':neighborhood'));
  if (!rng.chance(75)) return null;
  if (seed.startsWith(careerSeedPrefix)) {
    return characterId && Object.hasOwn(careerOrigins, characterId)
      ? careerOrigins[characterId as keyof typeof careerOrigins] : null;
  }
  return rng.pick(origins);
}

export function originStage(s: GameState) {
  if (s.phase !== 'plan' || !originFor(s.seed, s.characterId)) return null;
  if (s.day === 1 && !s.originStory) return 'opening';
  if (s.day >= 3 && s.originStory && !s.originStory.followedUpOn) return 'followup';
  return null;
}

export function openingFor(seed: string, characterId: string) {
  if (originFor(seed, characterId)) return null;
  if (!seed.startsWith('v3:')) return null;
  const rng = new Rng(hashSeed('opening-v1:' + seed));
  if (!rng.chance(60)) return null;
  const stories = ['mother', 'guild', 'parcel'] as const;
  const favorite = characterId === 'gamer_kid' ? 'guild'
    : ['live_seller', 'phone_tech'].includes(characterId) ? 'parcel' : 'mother';
  return rng.pick([...stories, favorite, favorite] as const);
}
