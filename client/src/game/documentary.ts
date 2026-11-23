import { careerTracks, isAlly, isFoe, npcIds, npcs, places } from '@hts/shared';
import type { GameState } from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt } from '../i18n';
import { jobSceneUrl, sceneUrl, soiArtUrl } from '../assets/art';

export interface DocSlide {
  id: string;
  day: number | null;
  kicker: string;
  headline: string;
  body: string;
  image?: string | undefined;
  tone: 'cover' | 'money' | 'heat' | 'soi' | 'case' | 'career' | 'end';
}

const methodName = (id: string | null) =>
  id ? lt(content.methods.find((m) => m.id === id)?.name ?? { th: id }) : 'พักงาน';

/** ตัดต่อสารคดีสั้นจากบันทึกของรอบนี้: เลือกเฉพาะวันที่มีเรื่องเล่า */
export function buildDocumentary(s: GameState): DocSlide[] {
  const name = lt(content.characters.find((c) => c.id === s.characterId)?.name ?? { th: 'คุณ' });
  const days = s.end?.reason === 'survived' ? s.maxDays : s.day;
  const slides: DocSlide[] = [
    {
      id: 'cover',
      day: null,
      kicker: `สารคดีชีวิต · ${days} วันในซอย`,
      headline: `${name}: กว่าจะถึงวันนี้`,
      body: `เริ่มจากเงินติดกระเป๋า ฿${fmt(content.config.startDirtyCash)} ลองงานมาแล้ว ${s.methodsUsed.length} แบบ และจบด้วยเงินสะอาด ฿${fmt(s.cleanCash)}`,
      image: sceneUrl('menu'),
      tone: 'cover',
    },
  ];
  const worked = s.history.filter((h) => h.methodId);
  const first = worked[0];
  if (first) {
    slides.push({
      id: 'first',
      day: first.day,
      kicker: `วันที่ ${first.day} · งานแรก`,
      headline: `ก้าวแรกคือ “${methodName(first.methodId)}”`,
      body: first.income > 0 ? `วันนั้นได้มา ฿${fmt(first.income)} มือยังสั่นตอนนับแบงก์` : 'วันนั้นไม่ได้สักบาท แต่ได้รู้ว่าซอยนี้ไม่ง่าย',
      image: jobSceneUrl(first.methodId ?? ''),
      tone: 'money',
    });
  }
  const best = [...worked].sort((a, b) => b.income - a.income)[0];
  if (best && best.income > 0 && best !== first) {
    slides.push({
      id: 'best',
      day: best.day,
      kicker: `วันที่ ${best.day} · วันที่รวยที่สุด`,
      headline: `฿${fmt(best.income)} ในวันเดียว`,
      body: `จาก${methodName(best.methodId)} คืนนั้นทั้งซอยได้ยินเสียงหัวเราะจากห้องคุณ`,
      image: jobSceneUrl(best.methodId ?? ''),
      tone: 'money',
    });
  }
  const hottest = [...s.history].sort((a, b) => b.heatGained - a.heatGained)[0];
  if (hottest && hottest.heatGained >= 10) {
    slides.push({
      id: 'heat',
      day: hottest.day,
      kicker: `วันที่ ${hottest.day} · วันที่เกือบพัง`,
      headline: `Heat พุ่ง +${hottest.heatGained} ในวันเดียว`,
      body: `${methodName(hottest.methodId)}วันนั้นเสียงดังเกินไป เสียงไซเรนไกล ๆ ทำให้คุณนอนไม่หลับ`,
      image: sceneUrl('escape'),
      tone: 'heat',
    });
  }
  for (const [methodId, career] of Object.entries(s.careers ?? {})) {
    const track = careerTracks[methodId];
    if (!track) continue;
    const route = track[career.branch];
    slides.push({
      id: 'career-' + methodId,
      day: career.since,
      kicker: `วันที่ ${career.since} · เลือกเส้นทาง`,
      headline: `จาก${track.rookie}สู่ “${route.title}”`,
      body: career.finale ? route.finale : route.commission,
      image: jobSceneUrl(methodId),
      tone: 'career',
    });
    if (slides.length > 7) break;
  }
  for (const shaped of s.soi?.shapedDays ?? []) {
    const p = places[shaped.place];
    const f = p.forms[shaped.form];
    slides.push({
      id: 'soi-' + shaped.place,
      day: shaped.day,
      kicker: `วันที่ ${shaped.day} · ซอยเปลี่ยน`,
      headline: `${p.name} กลายเป็น${f.name}`,
      body: f.news,
      image: soiArtUrl(shaped.place, shaped.form) ?? soiArtUrl(shaped.place),
      tone: 'soi',
    });
  }
  if (s.soi) {
    const allies = npcIds.filter((n) => isAlly(s, n)).map((n) => npcs[n].name);
    const foes = npcIds.filter((n) => isFoe(s, n)).map((n) => npcs[n].name);
    if (allies.length || foes.length || s.soi.kept?.length) {
      slides.push({
        id: 'neighbours',
        day: null,
        kicker: 'เสียงจากเพื่อนบ้าน',
        headline: allies.length ? `${allies.join(' · ')} ยืนข้างคุณ` : foes.length ? `${foes.join(' · ')} ไม่ลืมสิ่งที่คุณทำ` : 'ซอยนี้ยังจำคุณได้',
        body: `ไปช่วยเพื่อนบ้านตามนัด ${s.soi.kept?.length ?? 0} ครั้ง${foes.length && allies.length ? ` · ส่วน${foes.join(' · ')}ยังพูดถึงคุณกับสารวัตร` : ''}`,
        image: sceneUrl('ev_auntie_neighbors_unite'),
        tone: 'soi',
      });
    }
  }
  if (s.case && (s.case.peak > 0 || s.case.raids > 0)) {
    const raidDay = s.history.find((h) => h.raid)?.day ?? null;
    slides.push({
      id: 'case',
      day: raidDay,
      kicker: raidDay ? `วันที่ ${raidDay} · สารวัตรหมูกระทะ` : 'แฟ้มของสารวัตรหมูกระทะ',
      headline: s.case.raids > 0 ? `โดนบุกค้น ${s.case.raids} ครั้ง` : `หลักฐานบนบอร์ดสูงสุด ${s.case.peak} ขั้น`,
      body: s.flags.includes('case_cold')
        ? 'สุดท้ายบอร์ดว่างเปล่า สารวัตรปิดแฟ้มโดยไม่มีชื่อคุณ'
        : s.history.some((h) => h.raid === 'decoy')
          ? 'มีอยู่คืนหนึ่งที่สารวัตรตามเบาะแสปลอมไปโกดังร้าง เรื่องนี้ยังเล่ากันทั้งซอย'
          : 'หมุดแดงทุกตัวบนบอร์ดคือวันที่คุณเสียงดังเกินไป',
      image: sceneUrl('ev_inspector_2'),
      tone: 'case',
    });
  }
  if (s.escapes > 0) {
    slides.push({
      id: 'escape',
      day: null,
      kicker: 'หนีตายมาแล้ว',
      headline: `รอดจากตำรวจ ${s.escapes} ครั้ง`,
      body: 'ทุกครั้งที่หนีพ้น ซอยจะเล่าเรื่องนี้ต่อให้ดังกว่าเดิมนิดหนึ่ง',
      image: sceneUrl('escape'),
      tone: 'heat',
    });
  }
  const ending = content.endings.find((e) => e.id === s.end?.endingId);
  if (ending) {
    slides.push({
      id: 'end',
      day: days,
      kicker: `วันที่ ${days} · ตอนจบ`,
      headline: lt(ending.title),
      body: lt(ending.body),
      image: sceneUrl('end_' + ending.id),
      tone: 'end',
    });
  }
  // เรียงตามวัน (สไลด์ที่ไม่มีวันอยู่ท้ายเรื่องก่อนตอนจบ) และตัดให้ไม่เกิน 10 ตอน
  const cover = slides.shift();
  const end = slides.pop();
  const dated = slides.filter((x) => x.day !== null).sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  const loose = slides.filter((x) => x.day === null);
  const middle = [...dated, ...loose].slice(0, 8);
  return [...(cover ? [cover] : []), ...middle, ...(end ? [end] : [])];
}
