import { questSeedPrefix } from './opening';

export const durations = [30, 60, 90] as const;
export type Duration = (typeof durations)[number];
const campaignPrefix = questSeedPrefix + 'campaign1:';

export function campaignSeed(days: Duration, nonce: string) {
  return campaignPrefix + days + ':' + nonce;
}

export function campaignDays(seed: string) {
  return durations.find(days => seed.startsWith(campaignPrefix + days + ':'));
}
