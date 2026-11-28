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
  'icon:bounty': { emoji: '🎯' },
  'icon:undermoney': { emoji: '💴' },
  'icon:audition': { emoji: '🎤' },
  'icon:undermarket': { emoji: '🏮' },
  'icon:home': { emoji: '🏠' },

  // บ้านกับตู้เสื้อผ้า
  'home:room': { emoji: '🛏️' },
  'home:condo': { emoji: '🏢' },
  'home:house': { emoji: '🏡' },
  'outfit:casual': { emoji: '👕' },
  'outfit:banker': { emoji: '👔' },
  'outfit:white': { emoji: '🤍' },
  'outfit:influencer': { emoji: '🕶️' },
  'outfit:trader': { emoji: '💼' },
  'outfit:rider': { emoji: '🛵' },

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
  'card:coin_laundry': { emoji: '🧺' },
  'card:claw_machine': { emoji: '🧸' },
  'card:bubble_tea_franchise': { emoji: '🧋' },
  'card:mini_golf': { emoji: '⛳' },
  'card:empty_rooms': { emoji: '🏢' },
  'card:chicken_rice': { emoji: '🍗' },
  'card:honest_tax': { emoji: '🧾' },
  'card:registered_shop': { emoji: '📜' },
  'card:crypto_closet': { emoji: '🪙' },
  'card:lottery_rebuy': { emoji: '🎟️' },
  'card:temple_fair_booth': { emoji: '🎯' },
  'card:festival_lantern': { emoji: '🏮' },
  'card:stall_account': { emoji: '🍉' },
  'card:merit_counting': { emoji: '🙏' },
  'card:mookata_receipts': { emoji: '🍖' },
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
  'ending:honest_shop': { emoji: '🏪' },

  // สัตว์เลี้ยง รถ ยศในซอย สมุดภาพ
  'pet:dog': { emoji: '🐕' },
  'pet:cat': { emoji: '🐈' },
  'pet:parrot': { emoji: '🦜' },
  'car:scooter': { emoji: '🛵' },
  'car:pickup': { emoji: '🛻' },
  'car:sports': { emoji: '🏎️' },
  'rank:rookie': { emoji: '🐣' },
  'rank:sim_runner': { emoji: '📱' },
  'rank:desk_boss': { emoji: '☎️' },
  'rank:soi_tycoon': { emoji: '💰' },
  'rank:godfather': { emoji: '👑' },
  'icon:reform': { emoji: '🏪' },
  'icon:scrapbook': { emoji: '📔' },
  'victim:baiter': { emoji: '🎥' },
  'victim:undercover': { emoji: '🕵️' },
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
ART['shop:intern_nat'] = { emoji: '📋' };
ART['shop:host_tuk'] = { emoji: '🎤' };

// Illustrated sets used for the neighborhood broadcasts and retirement scenes.
const neighborhoodSets = {
  end_soi_landlord: 'escape_market', end_soi_cinema: 'life_cinema', end_soi_shop: 'shop',
  end_soi_cart: 'escape_market', end_soi_table: 'end_home_again',
  end_jail_return: 'menu_jail', end_jail_cards: 'end_jailed',
  end_retire_radio: 'life_radio', end_retire_crew: 'ev_auntie_neighbors_unite',
  end_retire_kitchen: 'life_kitchen', end_retire_repair: 'ev_phone_repair_victim',
  end_retire_arcade: 'life_arcade', end_retire_cat: 'ev_cat_keyboard',
  end_retire_breakfast: 'escape_market', ev_soi_basin: 'escape_market',
  ev_soi_lifter: 'menu', ev_soi_binder: 'ev_cat_keyboard',
  ev_soi_rice: 'end_home_again',
};
for (const [scene, set] of Object.entries(neighborhoodSets)) {
  const art = ART['scene:' + set];
  if (art) ART['scene:' + scene] = art;
}

/** URL ของฉากพื้นหลัง (ถ้ายังไม่มีภาพคืน undefined) */
export const sceneUrl = (id: string): string | undefined => ART[`scene:${id}`]?.src;

const jobScenes: Record<string, string> = {
  fake_shop: 'ev_live_freeze', romance: 'ev_romance_reverse', soi_football: 'ev_world_cup_strike',
  mystery_stall: 'escape_market', cat_dub: 'ev_cat_keyboard', call_center: 'call',
  foundation: 'ev_foundation_receipts', merit: 'ev_merit_speaker', gambling: 'ev_gambling_real_winner',
  ponzi: 'ev_ponzi_seminar_question',
};
export const jobSceneUrl = (id: string) => sceneUrl(jobScenes[id] ?? 'plan');
const newArt: Record<string, string> = {
  'newsphoto:soi_football': 'scene:ev_world_cup_strike', 'newsphoto:mystery_stall': 'scene:escape_market',
  'newsphoto:cat_dub': 'scene:ev_cat_keyboard',
  'method:soi_football': 'scene:ev_world_cup_strike', 'method:mystery_stall': 'method:fake_shop',
  'method:cat_dub': 'char:orange_cat', 'shop:scoreboard': 'icon:day', 'shop:display_rack': 'method:fake_shop',
  'shop:studio_mic': 'shop:celebrity_promo', 'shop:soft_launch': 'shop:rename_page',
  'scene:ev_soi_derby': 'scene:ev_world_cup_strike', 'scene:ev_soi_unboxing': 'scene:escape_market',
  'scene:ev_soi_cat_voice': 'scene:ev_cat_keyboard',
};
for (const [id, source] of Object.entries(newArt)) {
  if (ART[source]) ART[id] = ART[source];
}

// 1.0 ซอยมีชีวิต: ภาพสถานที่ "soi--market.webp" และร่างที่เปลี่ยนแล้ว "soi--market_local.webp"
// ถ้ายังไม่มีภาพร่างใหม่ ใช้ภาพสถานที่เดิม และถ้ายังไม่มีภาพสถานที่เลย ใช้ฉากที่ใกล้เคียง
const soiFallback: Record<string, string> = {
  market: 'scene:escape_market', temple: 'scene:ev_merit_speaker', field: 'scene:ev_world_cup_strike',
  dorm: 'scene:call', mookata: 'scene:ev_inspector_1',
};
export const soiArtUrl = (place: string, form?: string): string | undefined =>
  (form && ART[`soi:${place}_${form}`]?.src) || ART[`soi:${place}`]?.src || (form ? undefined : ART[soiFallback[place] ?? '']?.src);
// ห้องลับ 4 ขั้น: hideout--0.webp ถึง hideout--3.webp
export const hideoutArtUrl = (tier: number): string | undefined => ART[`hideout:${tier}`]?.src;
// ตอนจบใหม่ใช้ภาพโต๊ะยาวทั้งซอยก่อน ถ้าไม่มีค่อยใช้ฉากเดิม
for (const [scene, sets] of Object.entries({ end_soi_for_all: ['soi:mookata_local', 'scene:ev_auntie_neighbors_unite'], end_case_cold: ['scene:ev_inspector_2'] })) {
  const art = sets.map((id) => ART[id]).find(Boolean);
  if (!ART['scene:' + scene] && art) ART['scene:' + scene] = art;
}
