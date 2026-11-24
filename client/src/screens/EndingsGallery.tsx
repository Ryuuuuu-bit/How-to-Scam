import { useState } from 'react';
import { content } from '@hts/shared/data';
import { useAuth } from '../net/auth';
import { progressFor } from '../game/meta';
import { lt } from '../i18n';
import { Button, ScreenTitle } from '../components/ui';
import { sceneUrl } from '../assets/art';
import '../components/documentary.css';

// คำใบ้ของฉากจบที่ยังไม่เคยเห็น บอกทางแบบไม่เฉลยทั้งหมด
const hints: Record<string, string> = {
  soi_landlord: 'อยู่ครบรอบพร้อมเงินสะอาดครึ่งล้าน',
  soi_cinema: 'อยู่ครบรอบพร้อมเงินสะอาดหลักแสนกลาง ๆ',
  soi_shop: 'อยู่ครบรอบพร้อมเงินสะอาดห้าหมื่นขึ้นไป',
  soi_cart: 'อยู่ครบรอบพร้อมเงินสะอาดหลักหมื่น',
  soi_table: 'อยู่ให้ครบรอบ ถึงจะไม่มีเงินเหลือก็ตาม',
  jail_return: 'โดนจับแล้วจำไพ่ของส้มได้ครบ',
  jail_cards: 'โดนจับแล้วจำไพ่ของส้มผิด',
  soi_for_all: 'รอบ 1.0: เปลี่ยนทุกสถานที่ในซอยให้เป็นของชุมชน',
  case_cold: 'รอบ 1.0: ปล่อยให้บอร์ดคดีหนักจนสารวัตรบุกได้ แล้วล้างบอร์ดให้ว่างก่อนจบ',
  surrendered: 'ยอมมอบตัวระหว่างหนี',
  whistleblower: 'เป็นสายลับให้ตำรวจไซเบอร์จนแก๊งใหญ่ถูกจับ',
  scam_hunter: 'เคยโดนคนแกล้งกลับ แล้วเลือกเป็นคนดีจนสุดทาง',
  home_again: 'สัญญากับครอบครัวไว้ แล้วรักษาสัญญานั้น',
  honest_shop: 'ซื้อทุนเปิดร้านสุจริต ตั้งใจกลับใจ แล้วอยู่ให้รอดโดยไม่ใจดำ',
  comeback_star: 'ช่วยดาราตกอับให้กลับมาดังอีกครั้ง',
  redeemed: 'สะสมความดีจนหัวใจเปลี่ยนข้าง',
  jailed: 'หนีตำรวจไม่พ้น',
  out_scammed_abroad: 'รวยด้วยวิธีที่ใจดำที่สุด แล้วหนีไปต่างประเทศ',
  rich_alone: 'รวยมาก แต่ไม่เหลือใครข้างตัว',
  retire_radio: 'วางมือตอนคนทั้งซอยรู้จักเสียงคุณ',
  retire_crew: 'วางมือพร้อมทีมงานอย่างน้อยสองคน',
  retire_kitchen: 'วางมือหลังเคยเลี้ยงข้าวคนทั้งซอย',
  retire_repair: 'วางมือในฐานะช่างซ่อมมือถือ',
  retire_arcade: 'วางมือในฐานะเด็กติดเกม',
  retire_cat: 'วางมือในฐานะแมวส้ม',
  retire_breakfast: 'วางมือแบบเงียบ ๆ ไม่มีใครรู้จัก',
  confused_retiree: 'จบแบบที่ไม่เข้าเงื่อนไขไหนเลย',
};

/** หอฉากจบ: สะสมตอนจบทั้งหมดของเกม */
export function EndingsGallery({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const seen = new Set(progressFor(auth.user).endings);
  const all = [...content.endings].sort((a, b) => Number(seen.has(b.id)) - Number(seen.has(a.id)));
  const got = content.endings.filter((e) => seen.has(e.id)).length;
  const [open, setOpen] = useState<string | null>(null);
  const opened = content.endings.find((e) => e.id === open && seen.has(e.id));
  return (
    <main className="collection-screen mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <ScreenTitle title="หอฉากจบ" hint={`เห็นแล้ว ${got}/${content.endings.length} ตอนจบ`} />
      <progress className="collection-progress" aria-label="ฉากจบที่สะสมแล้ว" value={got} max={content.endings.length} />
      <div className="endings-grid pb-24">
        {all.map((e) => {
          const unlocked = seen.has(e.id);
          const img = sceneUrl('end_' + e.id);
          return (
            <button
              key={e.id}
              type="button"
              className="ending-tile"
              data-locked={!unlocked || undefined}
              disabled={!unlocked}
              onClick={() => setOpen(e.id)}
            >
              <span className="ending-tile-art">
                {img ? <img src={img} alt="" /> : <span aria-hidden="true">🎬</span>}
                {!unlocked && <b aria-hidden="true">?</b>}
              </span>
              <strong>{unlocked ? lt(e.title) : 'ยังไม่เคยเห็น'}</strong>
              <small>{unlocked ? 'แตะเพื่ออ่านอีกครั้ง' : hints[e.id] ?? 'ลองทางที่ยังไม่เคยเลือก'}</small>
            </button>
          );
        })}
      </div>
      {opened && (
        <div className="phone-overlay" onClick={() => setOpen(null)}>
          <div role="dialog" aria-modal="true" aria-label={lt(opened.title)} className="ending-reader anim-rise-in" onClick={(ev) => ev.stopPropagation()}>
            {sceneUrl('end_' + opened.id) && <img src={sceneUrl('end_' + opened.id)} alt="" />}
            <h2>{lt(opened.title)}</h2>
            <p>{lt(opened.body)}</p>
            <Button tone="sun" block autoFocus onClick={() => setOpen(null)}>ปิด</Button>
          </div>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-[3px] border-ink bg-cream/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="mx-auto max-w-md">
          <Button tone="paper" block onClick={onBack}>กลับเมนู</Button>
        </div>
      </div>
    </main>
  );
}
