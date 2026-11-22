// ทะเบียนภาพของเกม: id → ไฟล์ภาพ (ถ้ามี) หรือ emoji ชั่วคราว
// พอได้ภาพ Chibi จริง แค่ใส่ src ที่นี่ หน้าจอจะเปลี่ยนเองทั้งหมด
export interface ArtEntry {
  emoji: string;
  src?: string;
}

const EMOJI: Record<string, ArtEntry> = {
  // ไอคอน HUD
  'icon:dirty': { emoji: '💰' },
  'icon:clean': { emoji: '💎' },
  'icon:heat': { emoji: '🔥' },
  'icon:fame': { emoji: '📣' },
  'icon:day': { emoji: '📅' },
  'icon:henchman': { emoji: '🕶️' },
  'icon:lock': { emoji: '🔒' },
  'icon:rest': { emoji: '😴' },
  'icon:police': { emoji: '🚨' },
  'icon:goldfish': { emoji: '🐟' },
  'icon:news': { emoji: '📰' },
  'icon:festival': { emoji: '🏮' },
  'icon:cooldown': { emoji: '⏳' },
  'icon:viral': { emoji: '💥' },
  'icon:ponzi_crash': { emoji: '📉' },
  'icon:exposed': { emoji: '🔍' },
  'icon:bribe': { emoji: '✉️' },

  // โหมดหนีตำรวจ
  'disguise:somtam': { emoji: '🥗' },
  'disguise:rider': { emoji: '🛵' },
  'disguise:tourist': { emoji: '🤳' },
  'disguise:mascot': { emoji: '🐻' },
  'disguise:none': { emoji: '🕶️' },
  'route:province': { emoji: '🌾' },
  'route:border': { emoji: '🚧' },
  'route:island': { emoji: '🏝️' },
  'route:market': { emoji: '🏮' },

  // ตัวละคร
  'char:ex_insurance': { emoji: '🤵' },
  'char:gamer_kid': { emoji: '🎮' },
  'char:temple_kid': { emoji: '🐷' },
  'char:live_seller': { emoji: '🤳' },
  'char:phone_tech': { emoji: '🔧' },
  'char:fortune_teller': { emoji: '🔮' },
  'char:rich_coach': { emoji: '📈' },
  'char:fallen_star': { emoji: '🕶️' },
  'char:ex_banker': { emoji: '🏦' },
  'char:share_auntie': { emoji: '📒' },
  'char:orange_cat': { emoji: '🐈' },

  // วิธีโกง
  'method:fake_shop': { emoji: '📦' },
  'method:romance': { emoji: '💘' },
  'method:call_center': { emoji: '☎️' },
  'method:foundation': { emoji: '🎗️' },
  'method:merit': { emoji: '🎪' },
  'method:gambling': { emoji: '🎰' },
  'method:ponzi': { emoji: '🪙' },

  // การ์ดฟอกเงิน
  'card:goldfish': { emoji: '🐠' },
  'card:grandma_pillow': { emoji: '👵' },
  'card:cat_painting': { emoji: '🖼️' },
  'card:empty_mookata': { emoji: '🥓' },
  'card:temple_change': { emoji: '🧧' },
  'card:specialty_cafe': { emoji: '☕' },
  'card:golden_durian': { emoji: '🍈' },
  'card:ghost_concert': { emoji: '🎫' },
  'card:accounting_firm': { emoji: '🧮' },
  'card:variegated_plant': { emoji: '🪴' },
  'shop:celebrity_promo': { emoji: '🎤' },

  // ร้านค้า
  'shop:sim_pack': { emoji: '📱' },
  'shop:ads': { emoji: '📢' },
  'shop:henchman': { emoji: '🕶️' },
  'shop:new_phone': { emoji: '📲' },
  'shop:lucky_lawyer': { emoji: '⚖️' },
  'shop:rename_page': { emoji: '🏷️' },

  // หมวดเหตุการณ์
  'event:lucky': { emoji: '🍀' },
  'event:unlucky': { emoji: '💥' },
  'event:silly': { emoji: '🤪' },
  'event:karma': { emoji: '⚖️' },

  // เหยื่อ
  'victim:v_somsri': { emoji: '👩‍🍳' },
  'victim:v_tong': { emoji: '👷' },
  'victim:v_boonma': { emoji: '👴' },
  'victim:v_praewa': { emoji: '👩‍💼' },
  'victim:v_kong': { emoji: '🧑‍💻' },
  'victim:v_mali': { emoji: '👵' },

  // ฉากจบ
  'ending:redeemed': { emoji: '👮' },
  'ending:jailed': { emoji: '⛓️' },
  'ending:out_scammed_abroad': { emoji: '🏝️' },
  'ending:rich_alone': { emoji: '🏙️' },
  'ending:confused_retiree': { emoji: '🍖' },
  'ending:home_again': { emoji: '🏡' },
  'ending:comeback_star': { emoji: '🌟' },
  danger: { emoji: '⚠️' },
};

// ภาพจริงใน ./img โหลดอัตโนมัติ: ชื่อไฟล์ "icon--dirty.webp" → id "icon:dirty"
const files = import.meta.glob<string>('./img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const ART: Record<string, ArtEntry> = { ...EMOJI };
for (const [path, url] of Object.entries(files)) {
  const id = path.replace('./img/', '').replace('.webp', '').replace('--', ':');
  ART[id] = { emoji: EMOJI[id]?.emoji ?? '', src: url };
}
if (ART['icon:henchman']?.src) ART['shop:henchman'] = ART['icon:henchman'];
ART['shop:intern_nat'] = ART['char:gamer_kid'] ?? { emoji: '📋' };
ART['shop:host_tuk'] = ART['shop:celebrity_promo'] ?? { emoji: '🎤' };

/** URL ของฉากพื้นหลัง (ถ้ายังไม่มีภาพคืน undefined) */
export const sceneUrl = (id: string): string | undefined => ART[`scene:${id}`]?.src;
