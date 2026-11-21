import type { LocalizedText } from '@hts/shared';
import { th } from './th';

type Join<P extends string, K> = K extends string ? `${P}.${K}` : never;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T & string];

export type MessageKey = Paths<typeof th>;

const messages: Record<string, unknown> = th;

/** ดึงข้อความ UI ตาม key แล้วแทนค่า {ชื่อ} */
export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  const raw = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages,
    );
  if (typeof raw !== 'string') return key;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = vars[name];
    return v === undefined ? `{${name}}` : typeof v === 'number' ? fmt(v) : v;
  });
}

/** ข้อความจากเนื้อหาเกม (ตอนนี้ภาษาไทยอย่างเดียว) */
export const lt = (text: LocalizedText): string => text.th;

export const fmt = (n: number): string => Math.round(n).toLocaleString('th-TH');
