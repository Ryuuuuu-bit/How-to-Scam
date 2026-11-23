import type { GameState, LastResult, NpcId, PlaceForm, PlaceId } from '@hts/shared';
import { evidenceInfo, npcs, places } from '@hts/shared';
import { content } from '@hts/shared/data';
import { fmt, lt, t } from '../i18n';

export interface ResultLine {
  tone: 'good' | 'bad' | 'neutral';
  title: string;
  body?: string;
  art?: string;
}

/** แปลงผลจาก engine เป็นข้อความสำหรับแสดงบนจอ */
export function describeResult(r: LastResult, s: GameState): ResultLine | null {
  switch (r.kind) {
    case 'resolve': {
      const income = (r.dirtyCash ?? 0) + (r.cleanCash ?? 0);
      const heat = r.heat ?? 0;
      return {
        tone: income > 0 ? 'good' : 'bad',
        title: income > 0 ? `${r.cleanCash ? t('hud.clean') : t('result.income')} +฿${fmt(income)}` : t('result.noIncome'),
        ...(heat > 0 ? { body: `${t('result.heatUp')} +${heat}` } : {}),
        art: income > 0 ? (r.cleanCash ? 'icon:clean' : 'icon:dirty') : 'icon:rest',
      };
    }
    case 'call': {
      const [victimId, pitchId, nameIdx] = (r.textKey ?? '').split(':');
      const name = content.victimParts.names[Number(nameIdx)];
      const pitch = content.pitches.find((p) => p.id === pitchId);
      return {
        tone: r.success ? 'good' : 'bad',
        title: r.success ? t('result.callSuccess') : t('result.callFail'),
          body: `ปลายสายคือ${name ? lt(name) : 'ผู้รับสาย'} · คุณพูดว่า “${pitch ? lt(pitch.text) : ''}”`,
        art: `victim:${victimId}`,
      };
    }
    case 'event': {
      const [eventId, ci, oi] = (r.textKey ?? '').split(':');
      const ev = content.events.find((e) => e.id === eventId);
      const outcome = ev?.choices[Number(ci)]?.outcomes[Number(oi)];
      if (!ev || !outcome) return null;
      const parts: string[] = [];
      if (r.dirtyCash)
        parts.push(
          `${t('hud.dirty')} ${r.dirtyCash > 0 ? '+' : '−'}฿${fmt(Math.abs(r.dirtyCash))}`,
        );
      if (r.cleanCash)
        parts.push(
          `${t('hud.clean')} ${r.cleanCash > 0 ? '+' : '−'}฿${fmt(Math.abs(r.cleanCash))}`,
        );
      if (r.heat) parts.push(`Heat ${r.heat > 0 ? '+' : ''}${r.heat}`);
      return {
        tone:
          (r.dirtyCash ?? 0) + (r.cleanCash ?? 0) >= 0 && (r.heat ?? 0) <= 0 ? 'good' : 'neutral',
        title: lt(outcome.text),
        ...(parts.length ? { body: parts.join(' · ') } : {}),
        art: `event:${ev.category}`,
      };
    }
    case 'launder': {
      const card = content.launderCards.find((c) => c.id === r.textKey);
      if (!card) return null;
      return {
        tone: r.success ? 'good' : 'bad',
        title: r.success ? t('result.launderSuccess') : t('result.launderFail'),
        body: lt(r.success ? card.successText : card.failText),
        art: `card:${card.id}`,
      };
    }
    case 'romanceFled':
      return { tone: 'bad', title: t('result.romanceFled'), art: 'method:romance' };
    case 'levelUp':
      return {
        tone: 'good',
        title: t('result.levelUp', { level: s.gangLevel }),
        art: 'icon:clean',
      };
    case 'viral':
      return { tone: 'good', title: t('result.viral'), art: 'icon:viral' };
    case 'exposed':
      return { tone: 'bad', title: t('result.exposed'), art: 'icon:exposed' };
    case 'ponziCrash':
      return { tone: 'bad', title: t('result.ponziCrash'), art: 'icon:ponzi_crash' };
    case 'news': {
      const n = content.news.find((x) => x.id === r.textKey);
      if (!n) return null;
      return {
        tone: 'neutral',
        title: t('result.newsTitle', { title: lt(n.title) }),
        body: lt(n.body),
        art: 'icon:news',
      };
    }
    case 'offer':
    case 'missionDone':
    case 'missionFail': {
      const o = content.offers.find((x) => x.id === r.textKey);
      if (!o) return null;
      const title =
        r.kind === 'offer'
          ? t('offer.accepted', { name: lt(o.name) })
          : r.kind === 'missionDone'
            ? t('offer.missionDone', { name: lt(o.name) })
            : t('offer.missionFail', { name: lt(o.name) });
      return {
        tone: r.kind === 'missionFail' ? 'bad' : 'good',
        title,
        art: r.kind === 'missionFail' ? 'icon:cooldown' : 'icon:clean',
      };
    }
    case 'baited':
      return {
        tone: 'bad',
        title: t('result.baited'),
        body: t('result.baitedBody', { n: fmt(-(r.dirtyCash ?? 0)) }),
        art: 'icon:baitback',
      };
    case 'sting':
      return {
        tone: 'bad',
        title: t('result.sting'),
        body: t('result.stingBody', { n: r.heat ?? 0 }),
        art: 'icon:undercover',
      };
    case 'hangup':
      return r.success
        ? {
            tone: 'good',
            title: t('result.hangupTrap'),
            body: t('result.hangupTrapBody', {
              who: r.textKey === 'baiter' ? t('result.whoBaiter') : t('result.whoUndercover'),
            }),
            art: r.textKey === 'baiter' ? 'icon:baitback' : 'icon:undercover',
          }
        : {
            tone: 'neutral',
            title: t('result.hangupNormal'),
            body: t('result.hangupNormalBody'),
            art: 'icon:rest',
          };
    case 'evidence': {
      const info = evidenceInfo[(r.textKey ?? 'shift') as keyof typeof evidenceInfo];
      return { tone: 'bad', title: `สารวัตรปักหมุดใหม่: ${info.name}`, body: info.note, art: 'icon:police' };
    }
    case 'raid':
      if (r.textKey === 'decoy') return {
        tone: 'good', title: 'สารวัตรตามเบาะแสปลอมไปโกดังร้าง',
        body: 'ทีมบุกค้นเจอแต่แมวกับลังเปล่า ข่าวเย็นนี้ทั้งซอยหัวเราะกันทั้งคืน · ชื่อเสียง +2', art: 'icon:police',
      };
      return {
        tone: 'bad',
        title: r.textKey === 'warned' ? 'สารวัตรบุกค้น แต่เจ๊หมวยส่งข่าวทัน' : 'สารวัตรหมูกระทะบุกค้นกลางดึก',
        body: `Heat +${r.heat ?? 0} · ยึดเงินสกปรก ฿${fmt(-(r.dirtyCash ?? 0))} · หลักฐานครึ่งบอร์ดเข้าแฟ้มคดีแล้ว`,
        art: 'icon:police',
      };
    case 'caseMove':
      return {
        tone: 'good',
        title: r.textKey === 'burn' ? 'หลักฐานชิ้นนั้นหายไปจากบอร์ด' : r.textKey === 'decoy' ? 'วางเบาะแสปลอมไว้แล้ว' : 'ป้อนข่าวแก๊งคู่แข่งให้สารวัตร',
        body: r.textKey === 'burn' ? 'แต่การเคลื่อนไหวแบบนี้ทำให้ Heat ขึ้น 2' : r.textKey === 'decoy' ? 'ครั้งหน้าที่สารวัตรบุก เขาจะไปผิดที่' : 'สารวัตรไล่จับคนอื่นไปก่อน แต่ใจคุณหนักขึ้นนิดหน่อย',
        art: 'icon:sting',
      };
    case 'soiShaped': {
      const [place, form] = (r.textKey ?? '').split(':') as [PlaceId, PlaceForm];
      const f = places[place]?.forms[form];
      return f ? { tone: 'good', title: `${places[place].name} กลายเป็น “${f.name}”`, body: f.news, art: 'icon:festival' } : null;
    }
    case 'soiMemory': {
      const [kind, npc] = (r.textKey ?? '').split(':') as [string, NpcId];
      const n = npcs[npc];
      if (!n) return null;
      if (kind === 'ally') return { tone: 'good', title: `${n.name} อยู่ข้างคุณแล้ว`, body: n.ally, art: 'icon:fame' };
      if (kind === 'foe') return { tone: 'bad', title: `${n.name} เริ่มพูดกับสารวัตร`, body: n.foe, art: 'icon:exposed' };
      return { tone: 'good', title: `ไปช่วย${n.name}มาแล้ว`, body: n.thanks, art: 'icon:fame' };
    }
    case 'escape':
      if (r.textKey === 'dream_escape') return {
        tone: 'good', title: 'จำถูกทั้งสามใบ! ส้มพากลับตลาดแล้ว',
        body: 'เงินสกปรกถูกยึดไปแล้ว แต่คุณได้เล่นรอบนี้ต่อ ส่วนส้มขอค่าตัวเป็นปลาทู', art: 'char:orange_cat',
      };
      return {
        tone: r.success ? 'good' : 'bad',
        title: r.success ? t('result.escapeOk') : t('result.escapeFail'),
        ...(r.success && s.escapes === 1 && {
          body: 'ข่าวด่วน: สายตรวจไปไม่ถึงปากซอย รถกับข้าวจอดขวางอยู่ พยานบอกว่าตำรวจลงจากรถแล้ว… ได้ไข่มาสิบฟอง',
        }),
        art: 'icon:police',
      };
  }
}
