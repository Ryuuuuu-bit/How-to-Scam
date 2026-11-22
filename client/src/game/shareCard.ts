// การ์ดแชร์ผลงานตอนจบรอบ (วาดด้วย canvas แล้วแชร์หรือบันทึกเป็น PNG)
import { titleFor } from '@hts/shared';
import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { ART, sceneUrl } from '../assets/art';
import { fmt, lt, t } from '../i18n';

const W = 1080;
const H = 1350;
const INK = '#2b2140';

function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y, iw, ih);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** ตัดบรรทัดภาษาไทยตามความกว้าง (ตัดทีละตัวอักษร เพราะภาษาไทยไม่มีช่องว่างระหว่างคำ) */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of Array.from(text)) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      lines.push(line);
      line = ch.trimStart();
      if (lines.length === maxLines) break;
    } else line += ch;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

export interface ShareInfo {
  state: GameState;
  titleId?: string | undefined;
  rank?: number | undefined;
  daily?: string | null | undefined;
}

export async function makeShareCard(info: ShareInfo): Promise<Blob> {
  const { state } = info;
  const end = state.end;
  if (!end) throw new Error('run not ended');
  await Promise.all([
    document.fonts.load('600 64px Mitr'),
    document.fonts.load('400 32px Sarabun'),
  ]).catch(() => undefined);
  const ending = content.endings.find((e) => e.id === end.endingId);
  const [bg, char] = await Promise.all([
    loadImage(sceneUrl(`end_${end.endingId}`) ?? sceneUrl('menu')),
    loadImage(ART[`char:${state.characterId}`]?.src),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');

  ctx.fillStyle = '#fff4dc';
  ctx.fillRect(0, 0, W, H);
  if (bg) cover(ctx, bg, 0, 0, W, 820);
  const grad = ctx.createLinearGradient(0, 500, 0, 860);
  grad.addColorStop(0, 'rgba(255,244,220,0)');
  grad.addColorStop(1, 'rgba(255,244,220,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 500, W, 360);

  // โลโก้
  ctx.fillStyle = INK;
  roundRect(ctx, 40, 40, 480, 96, 28);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.font = '600 56px Mitr';
  ctx.fillText('HOW TO SCAM', 70, 108);

  // แผงผลงาน
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  roundRect(ctx, 40, 700, W - 80, 560, 48);
  ctx.fill();
  ctx.stroke();

  if (char) {
    const h = 420;
    const w = (char.width / char.height) * h;
    ctx.drawImage(char, W - 60 - w, 520, w, h);
  }

  ctx.fillStyle = INK;
  ctx.font = '600 34px Mitr';
  ctx.fillText(
    t(`end.reason.${end.reason}`) + (info.daily ? ` · Daily ${info.daily}` : ''),
    90,
    780,
  );
  ctx.font = '600 60px Mitr';
  const titleLines = wrap(ctx, ending ? lt(ending.title) : '', 600, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, 90, 852 + i * 68));
  // เนื้อเรื่องฉากจบสั้นๆ
  ctx.fillStyle = '#6b5f80';
  ctx.font = '400 28px Sarabun';
  const bodyTop = 852 + titleLines.length * 68 - 20;
  wrap(ctx, ending ? lt(ending.body) : '', 600, 2).forEach((l, i) =>
    ctx.fillText(l, 92, bodyTop + i * 38),
  );
  const title = content.titles.find((x) => x.id === (info.titleId ?? titleFor(state, content)));
  if (title) {
    ctx.fillStyle = '#7b5cff';
    ctx.font = '600 40px Mitr';
    ctx.fillText(`ฉายา: ${lt(title.name)}`, 90, 1040);
  }
  ctx.fillStyle = '#ff4f8b';
  ctx.font = '600 110px Mitr';
  ctx.fillText(fmt(end.score), 90, 1140);
  ctx.fillStyle = INK;
  ctx.font = '400 34px Sarabun';
  const days = end.reason === 'survived' ? content.config.maxDays : state.day;
  const rank = info.rank ? ` · อันดับ ${info.rank}` : '';
  ctx.fillText(`คะแนน · อยู่รอด ${days} วัน${rank}`, 92, 1196);

  // ข้อความเตือนภัยจริง (ส่วนสำคัญของเกม)
  const sign = content.dangerSigns.find((d) => d.id === end.dangerSignIds[0]);
  ctx.fillStyle = INK;
  roundRect(ctx, 40, 1275, W - 80, 56, 20);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.font = '400 28px Sarabun';
  const tip = `⚠ รู้ทันมิจฉาชีพ: ${sign ? lt(sign.title) : 'โทรสายด่วน 1441'} · how-to-scam.up.railway.app`;
  ctx.fillText(wrap(ctx, tip, W - 140, 1)[0] ?? '', 70, 1313);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'),
  );
}

/** แชร์ผ่านเมนูแชร์ของมือถือ ถ้าไม่รองรับให้ดาวน์โหลดเป็นไฟล์ */
export async function shareCard(info: ShareInfo): Promise<'shared' | 'saved'> {
  const blob = await makeShareCard(info);
  const file = new File([blob], 'how-to-scam.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: t('share.caption') });
      return 'shared';
    } catch {
      // ผู้เล่นกดยกเลิก → ไปดาวน์โหลดแทน
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'how-to-scam.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return 'saved';
}
