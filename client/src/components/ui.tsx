import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ART } from '../assets/art';

type Tone = 'pink' | 'mint' | 'sun' | 'grape' | 'paper' | 'danger';

const toneClass: Record<Tone, string> = {
  pink: 'bg-pink text-white',
  mint: 'bg-mint text-white',
  sun: 'bg-sun text-ink',
  grape: 'bg-grape text-white',
  paper: 'bg-paper text-ink',
  danger: 'bg-danger text-white',
};

export function Button({
  tone = 'pink',
  block,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; block?: boolean }) {
  return (
    <button
      type="button"
      className={`font-display rounded-2xl border-[3px] border-ink px-4 py-3 text-base font-medium shadow-pop transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0 disabled:active:shadow-pop ${toneClass[tone]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = '',
  tone = 'paper',
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={`rounded-3xl border-[3px] border-ink p-4 shadow-pop ${toneClass[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/** ภาพประกอบ: ถ้ามีไฟล์ภาพใช้ภาพ ถ้ายังไม่มีใช้ emoji แทน */
export function Art({
  id,
  size = 48,
  className = '',
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const art = ART[id];
  if (art?.src) {
    return (
      <img
        src={art.src}
        alt=""
        width={size}
        height={size}
        className={`object-contain select-none ${className}`}
        draggable={false}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center leading-none select-none ${className}`}
      style={{ fontSize: size * 0.8, width: size, height: size }}
    >
      {art?.emoji ?? '❓'}
    </span>
  );
}

export function ScreenTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {hint && <p className="text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}
