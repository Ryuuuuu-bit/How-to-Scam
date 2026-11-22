import type { Meme } from '../game/memes';
import { Art } from './ui';

export function MemeSticker({ meme }: { meme: Meme }) {
  return (
    <figure className="my-3 flex items-center gap-3 rounded-xl border-2 border-[#60466b] bg-[#f2e0fa] px-3 py-2 text-[#302039] shadow-[0_2px_0_#60466b]">
      <Art id={meme.art} size={40} className="shrink-0" />
      <figcaption className="font-display text-sm leading-snug font-semibold">
        {meme.caption}
      </figcaption>
    </figure>
  );
}
