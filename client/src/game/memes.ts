import type { DayLog, GameState } from '@hts/shared';

export interface Meme {
  art: string;
  caption: string;
}

const heat: Meme = {
  art: 'icon:police',
  caption: 'ว้าวุ่นเลย… ไฟแดงทั้งซอยมาจากรถคันเดียว',
};
const loss: Meme = {
  art: 'char:orange_cat',
  caption: 'สภาพ… ต้นทุนเดินนำ กำไรยังหาทางมา',
};
const windfall: Meme = {
  art: 'icon:dirty',
  caption: 'จึ้งเกินคาด เครื่องคิดเลขขอนับอีกรอบ',
};
const failedCard: Meme = {
  art: 'char:orange_cat',
  caption: 'ช็อตฟีลทั้งโต๊ะ ใบสรุปบอกให้กลับไปคิดใหม่',
};
const eventMemes: ReadonlyMap<string, Meme> = new Map([
  ['runaway_rooster', { art: 'icon:news', caption: 'ตัวตึงประจำซอย ไก่หนึ่งตัวทำคนทั้งแก๊งวิ่ง' }],
  ['cat_keyboard', { art: 'char:orange_cat', caption: 'น้อนกดไปปุ่มเดียว คนทั้งแก๊งประชุมด่วน' }],
  ['deepfake_cat', { art: 'char:orange_cat', caption: 'น้อนมองกล้องแล้วถาม ใครเอาหนูไปเล่นเป็นคุณ' }],
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
