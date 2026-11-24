import { describe, expect, it } from 'vitest';
import { content } from '../data';
import {
  bestHome,
  campaignSeed,
  escapeChance,
  heatBonusPct,
  homeKey,
  incomeBonusPct,
  isLivingSoi,
  loadoutFor,
  loadoutOf,
  marketPrice,
  marketRequires,
  newGame,
  outfitKey,
  replay,
  seedWithLoadout,
} from '../src';
import { autoPlay } from './helpers';

const base = campaignSeed(30, 'loadout-test');
/** รอบเปล่า ไม่มีข่าวหรือข้อเสนอสุ่ม เทียบเฉพาะผลของบ้านกับชุด */
const bare = (seed: string) => ({ ...newGame(seed, 'ex_insurance', content), news: null, offer: null, modifiers: [] });

describe('บ้านกับตู้เสื้อผ้า', () => {
  it('seed ปกติได้ห้องเช่ากับเสื้อยืด และ seed ไม่เปลี่ยน', () => {
    expect(loadoutOf(base)).toEqual({ home: 'room', outfit: 'casual' });
    expect(seedWithLoadout(base, { home: 'room', outfit: 'casual' })).toBe(base);
  });

  it('ต่อท้าย seed แล้วอ่านกลับได้ และยังเป็นซอยมีชีวิตเหมือนเดิม', () => {
    const seed = seedWithLoadout(base, { home: 'house', outfit: 'banker' });
    expect(loadoutOf(seed)).toEqual({ home: 'house', outfit: 'banker' });
    expect(isLivingSoi(seed)).toBe(isLivingSoi(base));
    expect(newGame(seed, 'ex_insurance', content).maxDays).toBe(30);
  });

  it('ใช้ได้เฉพาะของที่มีจริง บ้านใช้หลังที่ดีที่สุด', () => {
    expect(loadoutFor([], 'banker')).toEqual({ home: 'room', outfit: 'casual' });
    expect(bestHome([homeKey('condo')])).toBe('condo');
    expect(bestHome([homeKey('condo'), homeKey('house')])).toBe('house');
    expect(loadoutFor([outfitKey('banker')], 'banker').outfit).toBe('banker');
  });

  it('ราคาอยู่ในตลาดใต้ดิน และบ้านเดี่ยวต้องมีคอนโดก่อน', () => {
    expect(marketPrice(content, homeKey('condo'))).toBe(4_000);
    expect(marketPrice(content, homeKey('room'))).toBeNull();
    expect(marketPrice(content, outfitKey('casual'))).toBeNull();
    expect(marketPrice(content, outfitKey('banker'))).toBe(2_500);
    expect(marketRequires(homeKey('house'))).toBe(homeKey('condo'));
  });

  it('ชุดเพิ่มรายได้เฉพาะงานที่เข้ากัน และเสื้อไรเดอร์ลด Heat', () => {
    const plain = bare(base);
    const white = bare(seedWithLoadout(base, { home: 'room', outfit: 'white' }));
    expect(incomeBonusPct(white, content, 'foundation') - incomeBonusPct(plain, content, 'foundation')).toBe(15);
    expect(incomeBonusPct(white, content, 'romance')).toBe(incomeBonusPct(plain, content, 'romance'));
    const rider = bare(seedWithLoadout(base, { home: 'room', outfit: 'rider' }));
    expect(heatBonusPct(rider, content, 'fake_shop') - heatBonusPct(plain, content, 'fake_shop')).toBe(-8);
  });

  it('บ้านดีขึ้นหนีตำรวจรอดง่ายขึ้น', () => {
    const plain = bare(base);
    const house = bare(seedWithLoadout(base, { home: 'house', outfit: 'casual' }));
    plain.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    house.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    expect(escapeChance(house, content, 0) - escapeChance(plain, content, 0)).toBe(10);
  });

  it('เล่นจบทั้งรอบแล้ว replay ได้ผลเดิม', () => {
    const seed = seedWithLoadout(base, { home: 'condo', outfit: 'trader' });
    const { state, actions } = autoPlay(seed, 'ex_insurance');
    expect(state.end).not.toBeNull();
    expect(replay(seed, 'ex_insurance', actions, content)).toEqual(state);
  });
});
