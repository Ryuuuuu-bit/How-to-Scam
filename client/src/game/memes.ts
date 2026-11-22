import type { DayLog, GameState } from '@hts/shared';

export interface Meme {
  art: string;
  caption: string;
}

const heat: Meme = {
  art: 'icon:police',
  caption: 'ไฟหน้าบ้านกะพริบ นึกว่ารถพุ่มพวง… รถตำรวจนี่หว่า',
};
const loss: Meme = {
  art: 'char:orange_cat',
  caption: 'เงินเข้าก็จริง หักทุนแล้ว… กำไรหายไปไหนหมด',
};
const windfall: Meme = {
  art: 'icon:dirty',
  caption: 'เดี๋ยวนะ ศูนย์เกินมาตัวนึงปะ? อ้าว ยอดจริง',
};
const failedCard: Meme = {
  art: 'char:orange_cat',
  caption: 'เมื่อกี้ใครพูดว่า “รอบนี้ชัวร์” นะ',
};
const eventMemes: ReadonlyMap<string, Meme> = new Map([
  ['soi_basin', { art: 'icon:news', caption: 'แชตหกสิบหน้า สวัสดีวันจันทร์ไปห้าสิบแปด' }],
  ['soi_lifter', { art: 'shop:henchman', caption: 'ทีมพร้อม รถพร้อม เดี๋ยวถามยายอีกทีว่าตู้ไหน' }],
  ['soi_binder', { art: 'shop:lucky_lawyer', caption: 'ช้อนสิบบาท โต๊ะหกร้อย คิดดี ๆ ก่อนวางแฟ้ม' }],
  ['soi_rice', { art: 'icon:news', caption: 'ยอดขาดหนึ่งกล่อง ลองนับคนถือกล้องหรือยัง' }],
  ['runaway_rooster', { art: 'icon:news', caption: 'ไก่หลุดตัวเดียว ได้คาร์ดิโอกันทั้งซอย' }],
  ['cat_keyboard', { art: 'char:orange_cat', caption: 'แมวเหยียบไปทีเดียว หัวหน้าเรียกประชุมทั้งแก๊ง' }],
  ['deepfake_cat', { art: 'char:orange_cat', caption: 'แมวส้มฝากบอก คลิปนั้นมีคนตัดต่อ ปกติผมหล่อกว่านี้' }],
]);

export function reactionMeme(
  state: Pick<GameState, 'phase' | 'escape' | 'lastResults'>,
  net: number | null,
): Meme | null {
  if (state.phase === 'escape' && state.escape?.step === 'disguise') return heat;
  for (const result of state.lastResults) {
    if (result.kind !== 'event') continue;
    const meme = eventMemes.get(result.textKey?.split(':', 1)[0] ?? '');
    if (meme) return meme;
  }
  if (state.lastResults.some(({ kind, success }) => kind === 'launder' && success === false)) {
    return failedCard;
  }
  if (!state.lastResults.some(({ kind }) => kind === 'resolve') || net === null) return null;
  if (net < 0) return loss;
  return net >= 20_000 ? windfall : null;
}

export function newspaperMeme(log: DayLog): Meme | null {
  for (const eventId of log.events) {
    const meme = eventMemes.get(eventId);
    if (meme) return meme;
  }
  if (log.income >= 20_000) return windfall;
  return log.launderSuccess === false ? failedCard : null;
}
