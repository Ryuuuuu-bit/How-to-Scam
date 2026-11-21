// ปฏิทินของรอบ: แต่ละรอบเริ่มคนละเดือน เพื่อให้เจอเทศกาลไม่ซ้ำกัน
import type { Festival, GameContent, ModifierSpec, News } from '../types/content';
import type { GameState } from '../types/state';

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** วันที่จริงของวันที่ N ในเกม */
export function dateOf(s: Pick<GameState, 'startMonth' | 'startDate'>, day: number) {
  let month = s.startMonth;
  let date = s.startDate + day - 1;
  while (date > (DAYS_IN_MONTH[month - 1] ?? 30)) {
    date -= DAYS_IN_MONTH[month - 1] ?? 30;
    month = (month % 12) + 1;
  }
  return { month, date };
}

const key = (month: number, date: number) => month * 100 + date;

function inFestival(f: Festival, month: number, date: number): boolean {
  const k = key(month, date);
  const from = key(f.from[0], f.from[1]);
  const to = key(f.to[0], f.to[1]);
  return from <= to ? k >= from && k <= to : k >= from || k <= to; // ช่วงข้ามปี
}

export function activeFestivals(s: GameState, c: GameContent): Festival[] {
  const { month, date } = dateOf(s, s.day);
  return c.festivals.filter((f) => inFestival(f, month, date));
}

export function currentNews(s: GameState, c: GameContent): News | undefined {
  if (!s.news || s.news.untilDay < s.day) return undefined;
  return c.news.find((n) => n.id === s.news?.id);
}

/** ตัวคูณที่มาจากปฏิทินและข่าว (คำนวณสด ไม่เก็บใน state) */
export function ambientModifiers(s: GameState, c: GameContent): ModifierSpec[] {
  return [
    ...activeFestivals(s, c).flatMap((f) => f.modifiers),
    ...(currentNews(s, c)?.modifiers ?? []),
  ];
}
