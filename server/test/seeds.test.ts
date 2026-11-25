import { describe, expect, it } from 'vitest';
import { campaignDays, isLivingSoi, riskRules, riskSeed } from '@hts/shared';
import { dailySeed, newSeed, RISK_RULES_FROM } from '../src/game';

describe('risk rules start with the new season', () => {
  it('keeps older rules for runs started before the start date (Bangkok time)', () => {
    const lastNovEvening = new Date('2026-11-30T16:59:00Z'); // 23:59 เวลาไทย
    const seed = newSeed(60, lastNovEvening);
    expect(riskRules(seed)).toBe(false);
    expect(campaignDays(seed)).toBe(60);
  });

  it('switches normal runs to risk rules from the start date', () => {
    const firstDecMorning = new Date('2026-11-30T17:00:00Z'); // 00:00 1 ธ.ค. เวลาไทย
    const seed = newSeed(90, firstDecMorning);
    expect(riskRules(seed)).toBe(true);
    expect(isLivingSoi(seed)).toBe(true);
    expect(campaignDays(seed)).toBe(90);
  });

  it('gives every player the same daily seed, and switches it on the start date', () => {
    expect(riskRules(dailySeed('2026-11-30', 'secret'))).toBe(false);
    expect(dailySeed(RISK_RULES_FROM, 'secret')).toBe(dailySeed(RISK_RULES_FROM, 'secret'));
    expect(riskRules(dailySeed(RISK_RULES_FROM, 'secret'))).toBe(true);
    expect(riskSeed(30, 'x')).not.toBe(dailySeed(RISK_RULES_FROM, 'secret'));
  });
});
