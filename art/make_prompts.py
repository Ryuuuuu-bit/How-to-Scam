# สร้างไฟล์ prompt สำหรับ Codex เป็นชุดๆ (ภาพทั้งหมดของเกม)
# ใช้: python art/make_prompts.py  → ได้ไฟล์ art/gen/*.prompt.txt
import pathlib

ROOT = pathlib.Path(__file__).parent

STYLE = (
    "Cute chibi 2D cartoon game illustration, same style as the attached style board: "
    "big heads and small bodies, thick clean dark outlines, flat vivid saturated colors, "
    "soft cel shading, playful goofy mood. "
)
THAI = (
    "Rich everyday Thai atmosphere and Thai-ness: Thai shophouses, tangled electric wires on concrete poles, "
    "street food carts, plastic stools, tuk-tuks, motorbike taxis in orange vests, potted plants, "
    "Thai-style signboards (shapes only). "
)
RULES = (
    "STRICT RULES: no readable text, letters, numbers or logos anywhere; no real brands; "
    "no Buddha images, no monks, no religious symbols; lighthearted satire, nothing gory."
)
SCENE = (
    "Vertical portrait 1024x1536 background scene for a mobile game; keep the lower third calmer "
    "and simpler so UI cards can sit on top. "
)

scenes = {
    # ฉากประจำ phase
    "bg-menu": "A lively Bangkok soi at dusk with neon lights, shophouses, a corner convenience store (no logo), a sneaky chibi scammer peeking from behind a noodle cart.",
    "bg-plan": "A tiny messy rented room hideout: ceiling fan, mattress on the floor, a desk with a laptop and a pile of cheap phones, instant noodle cups, a wall calendar with no numbers, laundry hanging by the window, city view.",
    "bg-invest": "A bustling Thai phone-accessory market of tiny stalls selling SIM cards, phone cases and ring lights, vendors waving, morning light.",
    "bg-call": "A cramped call-center room on the second floor of a shophouse: rows of plastic tables, old desk phones, headsets, a whiteboard with doodles, an electric fan, chibi henchmen talking on phones with exaggerated fake smiles.",
    "bg-launder": "A shady but funny back room behind a Thai mookata restaurant at night: grill pans stacked, a giant goldfish tank, sacks of money disguised as rice sacks, a cat painting on the wall.",
    "bg-shop": "A colorful Thai night market with string lights, stalls selling gadgets, sunglasses and cheap suits, smoke from grilled pork skewers.",
    "bg-escape": "A Thai street chase at night: red and blue police lights reflecting on a wet road, a motorbike taxi zooming away, a chibi scammer disguised as a som-tam vendor pushing a cart, comic action lines.",
    # เหตุการณ์
    "ev-celebrity_scandal": "A huge TV news drama: a flamboyant chibi celebrity in sparkling clothes hiding their face from camera flashes, piles of money, a Thai street crowd all staring at their phones, the player relaxing with popcorn in the corner.",
    "ev-lonely_tycoon": "A rich lonely old chibi man in a silk shirt by a luxurious koi pond in a Thai mansion garden, talking excitedly on a smartphone, dozens of koi fish.",
    "ev-lottery_hit": "A Thai lottery street vendor stand with lottery ticket sheets (no numbers), a chibi crowd cheering, a meatball-skewer cart in background, confetti.",
    "ev-viral_fake_review": "A giant smartphone screen exploding with hearts and share icons, delivery riders lining up, a chibi scammer overwhelmed with orders in a room full of empty cardboard boxes.",
    "ev-social_detective": "Online sleuths: chibi netizens with magnifying glasses and laptops in a cafe, a corkboard with photos and red strings, one blurry photo of the back of someone's funny haircut.",
    "ev-henchman_snitch": "A police station room: a nervous chibi henchman in sunglasses telling a long dramatic story to a bored police officer who is typing, comic sweat drops.",
    "ev-frozen_mule": "A fictional bank branch interior with a giant ice block freezing a piggy bank on the counter, a confused old uncle scratching his head, a queue ticket machine.",
    "ev-cyber_cop_call": "Split-screen phone call: left a sweating chibi scammer in a call room, right a smug chibi cyber police officer with headset in a high-tech police office.",
    "ev-customer_mob": "A funny crowd of annoyed chibi customers holding empty boxes and air fryers outside a random Thai townhouse, taking selfies, a confused homeowner peeking from the window.",
    "ev-called_mom": "A cozy Thai home kitchen: a chibi mom in a house dress holding a phone and a ladle, rice cooker steaming, a framed family photo, warm light.",
    "ev-scammer_vs_scammer": "Two chibi scammers on a split-screen phone call, both in identical messy rooms, both sweating and holding scripts, mirrored poses.",
    "ev-goldfish_funeral": "A ridiculous grand funeral for three goldfish in a Thai neighborhood: tiny flower wreaths, plastic chairs, crying chibi henchmen, a fishbowl on a small table, neighbors with hand fans.",
    "ev-uncle_filter": "A smartphone video call showing a chibi uncle with a mustache in a checkered tank top caught by surprise while a broken beauty filter glitches with sparkles, messy room behind.",
    "ev-grandma_savings": "A gentle Thai wooden house with a porch: a sweet chibi grandmother holding an old savings passbook and a phone, a photo of a grandchild in school uniform, potted jasmine. Warm and a little emotional.",
    "ev-foreign_gang_offer": "A shady glossy recruitment scene: a chibi recruiter in a shiny suit offering a plane ticket and a contract, a dark compound with barbed wire in the background, stacks of SIM cards.",
    "ev-sick_child_victim": "A quiet call-center room at night: a chibi scammer frozen at the phone, henchmen turning to look, a hospital silhouette through the window. Soft dramatic lighting, not gloomy.",
    # ฉากจบ
    "end-redeemed": "Happy ending: the former chibi scammer in a helper vest teaching a crowd of aunties at a Thai fresh market how to spot scam calls, a friendly police officer giving a thumbs up.",
    "end-jailed": "A comedic prison cell: the chibi scammer in a prison uniform, a cellmate holding an air fryer box and glaring, tiny window, food tray.",
    "end-out_scammed_abroad": "A tropical island paradise turning sour: the chibi scammer on a beach chair staring at a phone showing a crashing chart, a goldfish-shaped balloon popping, palm trees.",
    "end-rich_alone": "A luxurious riverside condo at night overlooking a Thai river city skyline, the chibi rich scammer alone on a huge sofa, three sports cars below, a phone ringing.",
    "end-confused_retiree": "A small honest mookata restaurant on a Thai street in the evening, the chibi former scammer happily grilling pork for three customers, string lights, peaceful.",
}

sheets = {
    "sheet-icons-a": "Square 1024x1024. A 4x4 grid of 16 round game icons, evenly spaced on a pure white background, each icon centered in its cell with generous padding, same chibi sticker style: 1 dirty money bag with stink lines, 2 sparkling clean money bag, 3 cartoon flame, 4 heart with megaphone, 5 calendar page, 6 henchman face with sunglasses, 7 padlock, 8 sleeping face on pillow, 9 police siren light, 10 cute goldfish, 11 cardboard parcel box, 12 smartphone with a heart and arrow, 13 old desk telephone with headset, 14 yellow warning triangle without text, 15 pack of SIM cards, 16 loudspeaker with sparkles.",
    "sheet-icons-b": "Square 1024x1024. A 4x4 grid of 16 round game icons, evenly spaced on a pure white background, each icon centered in its cell with generous padding, same chibi sticker style: 1 goldfish in a plastic bag, 2 pillow with banknotes peeking out, 3 framed silly cat painting, 4 Thai mookata grill pan with pork, 5 red envelope with a flower, 6 shiny new smartphone, 7 lawyer briefcase with balance scale, 8 blank name tag label, 9 four-leaf clover with gold coin, 10 comic explosion burst, 11 goofy crazy face, 12 balance scale with heart and coin, 13 cartoon handcuffs, 14 palm tree island, 15 tall condo tower, 16 grilled pork skewer.",
    "sheet-characters": "Landscape 1536x1024. Three full-body chibi characters standing side by side on a pure white background, evenly spaced, not overlapping, same designs as the style board: 1 sweaty overconfident former insurance salesman in a too-tight suit holding two phones, 2 sleepy teenage gamer in an oversized purple hoodie with headset and controller, 3 mischievous temple-fair helper boy in a plain white shirt holding a pink piggy-bank donation box (no robes, no religious symbols).",
    "sheet-victims": "Landscape 1536x1024. A 3x2 grid of six chibi head-and-shoulders portraits on a pure white background, evenly spaced: 1 cheerful Thai rice-and-curry street vendor auntie with apron, 2 chubby middle-aged hardware-store owner with gold necklace, 3 kind retired old man with glasses and a polo shirt, 4 tired young office worker woman with lanyard and iced coffee, 5 young amateur stock trader guy with headphones and chart reflections on his glasses, 6 sweet 80-year-old durian orchard grandma with a straw hat.",
}

ev = [k for k in scenes if k.startswith("ev-")]
batches = {
    "b1-sheets": sheets,
    "b2-phase": {k: v for k, v in scenes.items() if k.startswith("bg-")},
    "b3-events-a": {k: scenes[k] for k in ev[:8]},
    "b4-events-b": {k: scenes[k] for k in ev[8:]},
    "b5-endings": {k: v for k, v in scenes.items() if k.startswith("end-")},
}

out = ROOT / "gen"
out.mkdir(exist_ok=True)
for name, items in batches.items():
    lines = [
        "Use your built-in image generation tool to create the following images, ONE image per item, in order. "
        "Use the attached image as the style reference. After each image, copy the generated PNG into this "
        "repository at the exact path given. Do not write code or modify any other files. If one image fails, "
        "retry it once, then continue with the next.\n"
    ]
    for key, desc in items.items():
        extra = "" if key.startswith("sheet") else SCENE + THAI
        lines.append(f"- Save to art/gen/{key}.png :: {STYLE}{extra}{desc} {RULES}")
    (out / f"{name}.prompt.txt").write_text("\n".join(lines), encoding="utf-8")
print(sum(len(v) for v in batches.values()), "images in", len(batches), "batches")
