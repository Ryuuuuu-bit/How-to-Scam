import type { ReactNode } from 'react';

const plum = '#2d1d36';
const cream = '#fff0cf';
const gold = '#ffbe52';
const coral = '#ff696b';
const purple = '#ad77e6';
const mint = '#65dda7';

// Shapes use the same 32-unit canvas and outline so icon sizes stay consistent across the game.
const icons: Record<string, ReactNode> = {
  'icon:dirty': (
    <>
      <path fill="#c98626" d="m3 15 20-8 6 7v9l-20 7-6-7z" />
      <path fill={gold} d="m3 15 20-8 6 7-20 8z" />
      <path fill={cream} d="m11 12 6-3 6 8v8l-6 2v-8z" />
      <path fill="none" d="m4 19 5 7 6-2m9-4 5-2" />
    </>
  ),
  'icon:clean': (
    <>
      <path fill={mint} d="M9 5h14l6 7-13 15L3 12z" />
      <path fill="#37a982" d="m16 27 5-15h8z" />
      <path fill="#c3ffe0" d="m9 5-6 7h9l4-7z" />
      <path fill="none" d="M4 12h24m-16 0 4 15 5-15" />
    </>
  ),
  'icon:heat': (
    <>
      <path
        fill={coral}
        d="M17 3c1 7-6 8-5 14-2-1-3-3-3-5-3 3-5 6-4 10 1 5 5 7 11 7s11-4 11-9c0-3-2-6-4-8 0 2-1 3-2 4 0-5-1-9-4-13z"
      />
      <path fill={gold} d="M17 16c0 4-5 5-5 9 0 2 2 4 4 4 3 0 6-2 6-5 0-3-3-5-5-8z" />
    </>
  ),
  'icon:fame': (
    <>
      <path fill={purple} d="m11 19 2 9 6-1-2-9zM3 13l18-8 4 16-21-2z" />
      <ellipse cx="24" cy="13" rx="5.5" ry="9" fill={cream} transform="rotate(-15 24 13)" />
      <path fill={plum} d="m20 14 4-3 2 5z" />
    </>
  ),
  'icon:day': (
    <>
      <rect x="4" y="7" width="24" height="21" rx="4" fill={cream} />
      <path fill={coral} d="M4 12V9q0-2 3-2h18q3 0 3 2v3z" />
      <path fill="none" d="M10 4v5m12-5v5" />
      <path fill={coral} stroke="none" d="M15 17h7v6h-7z" />
      <path fill={plum} opacity=".28" stroke="none" d="M9 17h3v2H9zm0 5h3v2H9zm15-5h2v2h-2z" />
    </>
  ),
  'icon:henchman': (
    <>
      <path fill={purple} d="M5 28c1-5 5-7 11-7s10 2 11 7z" />
      <path fill={purple} d="M7 15c0-6 4-10 9-10s9 4 9 10-4 10-9 10-9-4-9-10z" />
      <path fill={plum} d="M6 13c-1-5 3-9 9-9 5 0 9 1 11 7l-6-1-5 2zM6 14h20l-2 5h-6l-2-4-2 4H8z" />
      <path stroke={cream} strokeWidth="1.3" d="m10 17 2-2m9 2 2-2" />
      <path fill="none" d="M15 22h4" />
    </>
  ),
  'icon:news': (
    <>
      <path fill={cream} d="M7 4h21l-2 21q0 3-4 3H6q-3 0-3-4z" />
      <path fill={purple} stroke="none" d="M9 8h15l-.5 4H8z" />
      <path fill={coral} stroke="none" d="M8 15h7l-.7 8H7z" />
      <path fill="none" d="M18 16h5m-5 4h4m-5 4h5" />
    </>
  ),
  'icon:lock': (
    <>
      <path fill="none" stroke={plum} strokeWidth="6" d="M9 15v-4a7 7 0 0 1 14 0v4" />
      <path fill="none" stroke={gold} strokeWidth="2.8" d="M9 15v-4a7 7 0 0 1 14 0v4" />
      <rect x="5" y="13" width="22" height="16" rx="4" fill={gold} />
      <path fill={plum} d="M14 21a2 2 0 1 1 4 0l1 4h-6z" />
    </>
  ),
  'icon:police': (
    <>
      <path fill={coral} d="m7 22 2-12a7 7 0 0 1 14 0l2 12z" />
      <path stroke={cream} d="m12 17 1-6" />
      <rect x="4" y="22" width="24" height="6" rx="2" fill={purple} />
    </>
  ),
  'icon:rest': (
    <>
      <path
        fill={purple}
        d="M4 7c2-2 5 0 7 1h10c2-1 5-3 7-1 2 2 0 4-1 6v7c1 2 3 4 1 6-2 2-5 0-7-1H11c-2 1-5 3-7 1-2-2 0-4 1-6v-7c-1-2-3-4-1-6z"
      />
      <path fill={gold} d="M19 10a7 7 0 1 0 3 11c-6 1-9-6-3-11z" />
    </>
  ),
  'icon:wardrobe': (
    <>
      <path fill="none" d="M13 6a3 3 0 1 1 5 2l-2 2v2" />
      <path fill={mint} d="m10 12 6-2 6 2 5 4 3 10-7 2-2-7v8H11v-8l-2 7-7-2 3-10z" />
      <path fill={cream} d="m12 12 4 12 4-12-4 2z" />
    </>
  ),
  'icon:volume': (
    <>
      <path fill={coral} d="M3 12h6l9-6v20l-9-6H3z" />
      <path fill={cream} d="m9 12 9-6v20l-9-6z" />
      <path fill="none" stroke={cream} d="M22 12c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
    </>
  ),
  'icon:volume_off': (
    <>
      <path fill={cream} d="M3 12h6l9-6v20l-9-6H3z" />
      <path fill="none" stroke={coral} strokeWidth="2.8" d="m23 12 6 8m0-8-6 8" />
    </>
  ),
  'icon:trophy': (
    <>
      <path fill="none" stroke={gold} strokeWidth="3" d="M8 8H4c0 7 3 9 7 9m13-9h4c0 7-3 9-7 9" />
      <path fill={gold} d="M9 5h14v6c0 5-3 8-5 9v4h5v4H9v-4h5v-4c-2-1-5-4-5-9z" />
      <path fill="#fff0cf" stroke="none" d="M12 8h3v6h-3z" />
    </>
  ),
  'icon:medal': (
    <>
      <path fill={purple} d="m7 4 5 11h8l5-11h-7l-2 6-2-6z" />
      <circle cx="16" cy="21" r="8" fill={gold} />
      <path
        fill={cream}
        stroke="none"
        d="m16 16 1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.7-3.1 1.7.6-3.5-2.5-2.5 3.5-.5z"
      />
    </>
  ),
  'icon:profile': (
    <>
      <rect x="4" y="4" width="24" height="24" rx="6" fill={cream} />
      <circle cx="16" cy="12" r="4" fill={purple} />
      <path fill={purple} d="M8 24c0-5 3-7 8-7s8 2 8 7z" />
    </>
  ),
};

export function renderGameIcon(id: string, size: number, className: string) {
  const key = id === 'shop:henchman' ? 'icon:henchman' : id;
  if (!Object.hasOwn(icons, key)) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      stroke={plum}
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {icons[key]}
    </svg>
  );
}
