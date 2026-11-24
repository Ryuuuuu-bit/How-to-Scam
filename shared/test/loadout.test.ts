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
  carKey,
  petKey,
  reformKey,
  type Loadout,
} from '../src';
import { pickEnding } from '../src/engine/score';
import { autoPlay } from './helpers';

const L = (p: Partial<Loadout> = {}): Loadout => ({ home: 'room', outfit: 'casual', pet: 'none', car: 'none', reform: false, ...p });
const base = campaignSeed(30, 'loadout-test');
/** รอบเปล่า ไม่มีข่าวหรือข้อเสนอสุ่ม เทียบเฉพาะผลของบ้านกับชุด */
const bare = (seed: string) => ({ ...newGame(seed, 'ex_insurance', content), news: null, offer: null, modifiers: [] });

describe('บ้านกับตู้เสื้อผ้า', () => {
  it('seed ปกติได้ห้องเช่ากับเสื้อยืด และ seed ไม่เปลี่ยน', () => {
    expect(loadoutOf(base)).toEqual(L({ home: 'room', outfit: 'casual' }));
    expect(seedWithLoadout(base, L({ home: 'room', outfit: 'casual' }))).toBe(base);
  });

  it('ต่อท้าย seed แล้วอ่านกลับได้ และยังเป็นซอยมีชีวิตเหมือนเดิม', () => {
    const seed = seedWithLoadout(base, L({ home: 'house', outfit: 'banker' }));
    expect(loadoutOf(seed)).toEqual(L({ home: 'house', outfit: 'banker' }));
    expect(isLivingSoi(seed)).toBe(isLivingSoi(base));
    expect(newGame(seed, 'ex_insurance', content).maxDays).toBe(30);
  });

  it('ใช้ได้เฉพาะของที่มีจริง บ้านใช้หลังที่ดีที่สุด', () => {
    expect(loadoutFor([], { outfit: 'banker' })).toEqual(L({ home: 'room', outfit: 'casual' }));
    expect(bestHome([homeKey('condo')])).toBe('condo');
    expect(bestHome([homeKey('condo'), homeKey('house')])).toBe('house');
    expect(loadoutFor([outfitKey('banker')], { outfit: 'banker' }).outfit).toBe('banker');
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
    const white = bare(seedWithLoadout(base, L({ home: 'room', outfit: 'white' })));
    expect(incomeBonusPct(white, content, 'foundation') - incomeBonusPct(plain, content, 'foundation')).toBe(15);
    expect(incomeBonusPct(white, content, 'romance')).toBe(incomeBonusPct(plain, content, 'romance'));
    const rider = bare(seedWithLoadout(base, L({ home: 'room', outfit: 'rider' })));
    expect(heatBonusPct(rider, content, 'fake_shop') - heatBonusPct(plain, content, 'fake_shop')).toBe(-8);
  });

  it('บ้านดีขึ้นหนีตำรวจรอดง่ายขึ้น', () => {
    const plain = bare(base);
    const house = bare(seedWithLoadout(base, L({ home: 'house', outfit: 'casual' })));
    plain.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    house.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    expect(escapeChance(house, content, 0) - escapeChance(plain, content, 0)).toBe(10);
  });

  it('เล่นจบทั้งรอบแล้ว replay ได้ผลเดิม', () => {
    const seed = seedWithLoadout(base, L({ home: 'condo', outfit: 'trader' }));
    const { state, actions } = autoPlay(seed, 'ex_insurance');
    expect(state.end).not.toBeNull();
    expect(replay(seed, 'ex_insurance', actions, content)).toEqual(state);
  });
});

describe('สัตว์เลี้ยง รถ และทางกลับใจ', () => {
  it('seed แบบเก่าสองส่วนยังอ่านได้ และแบบใหม่อ่านกลับครบ', () => {
    expect(loadoutOf(`${base}|L=condo.banker`)).toEqual(L({ home: 'condo', outfit: 'banker' }));
    const full = L({ home: 'condo', outfit: 'banker', pet: 'parrot', car: 'sports', reform: true });
    const seed = seedWithLoadout(base, full);
    expect(seed.endsWith('|L=condo.banker.parrot.sports.reform')).toBe(true);
    expect(loadoutOf(seed)).toEqual(full);
    expect(loadoutOf(seedWithLoadout(base, L({ pet: 'cat' })))).toEqual(L({ pet: 'cat' }));
  });

  it('ใช้ได้เฉพาะของที่ซื้อแล้ว', () => {
    expect(loadoutFor([], { pet: 'dog', car: 'sports', reform: true })).toEqual(L());
    const owned = [petKey('dog'), carKey('sports'), reformKey];
    expect(loadoutFor(owned, { pet: 'dog', car: 'sports', reform: true })).toEqual(
      L({ pet: 'dog', car: 'sports', reform: true }),
    );
    expect(marketPrice(content, petKey('dog'))).toBe(3_000);
    expect(marketPrice(content, carKey('none'))).toBeNull();
    expect(marketPrice(content, reformKey)).toBe(6_000);
  });

  it('หมากับรถช่วยหนีตำรวจ รถสปอร์ตทำให้ Heat ขึ้น', () => {
    const plain = bare(base);
    const crew = bare(seedWithLoadout(base, L({ pet: 'dog', car: 'pickup' })));
    plain.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    crew.escape = { step: 'qte', bonus: 0, routeId: 'province' };
    expect(escapeChance(crew, content, 0) - escapeChance(plain, content, 0)).toBe(15);
    // เทียบสถานะเดียวกัน เปลี่ยนแค่ seed เพื่อไม่ให้วันที่หรือเทศกาลที่สุ่มต่างกันมาปน
    const sports = { ...plain, seed: seedWithLoadout(base, L({ car: 'sports' })) };
    expect(heatBonusPct(sports, content, 'fake_shop') - heatBonusPct(plain, content, 'fake_shop')).toBe(5);
  });

  it('ตั้งใจกลับใจ: เริ่มด้วยกรรมดี รายได้ลด และได้ฉากจบร้านสุจริต', () => {
    const plain = bare(base);
    const reform = bare(seedWithLoadout(base, L({ reform: true })));
    expect(reform.flags).toContain('reform_shop');
    expect(reform.karma - plain.karma).toBe(5);
    expect(incomeBonusPct(reform, content, 'fake_shop') - incomeBonusPct(plain, content, 'fake_shop')).toBe(-10);
    expect(pickEnding(reform, content, 'survived')).toBe('honest_shop');
    expect(pickEnding({ ...reform, karma: -1 }, content, 'survived')).not.toBe('honest_shop');
  });

  it('เล่นจบทั้งรอบพร้อมของครบชุดแล้ว replay ได้ผลเดิม', () => {
    const seed = seedWithLoadout(base, L({ home: 'house', outfit: 'rider', pet: 'cat', car: 'scooter', reform: true }));
    const { state, actions } = autoPlay(seed, 'ex_insurance');
    expect(state.end).not.toBeNull();
    expect(replay(seed, 'ex_insurance', actions, content)).toEqual(state);
  });
});
