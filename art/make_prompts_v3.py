"""ภาพชุดใหม่: เหยื่อฉลาด/ตำรวจไซเบอร์/ฉากจบกลับใจ + ฉากเมนูปลดล็อก + สกิน + ภาพข่าว
ใช้: python art/make_prompts_v3.py แล้ว bash art/run_batch.sh b13-cyber / b14-meta
"""
import pathlib

GEN = pathlib.Path(__file__).resolve().parent / "gen"
STYLE = (
    "Cute chibi 2D cartoon game illustration, same style as the attached style board: big heads and "
    "small bodies, thick clean dark outlines, flat vivid saturated colors, soft cel shading, playful goofy mood."
)
RULES = (
    "STRICT RULES: no readable text, letters, numbers or logos anywhere; no real brands; no Buddha images, "
    "no monks, no religious symbols; lighthearted satire, nothing gory."
)
SCENE = (
    "Vertical portrait 1024x1536 background scene for a mobile game; keep the lower third calmer and simpler "
    "so UI cards can sit on top. Rich everyday Thai atmosphere and Thai-ness."
)
HEAD = (
    "Use your built-in image generation tool to create the following images, ONE image per item, in order. "
    "Use the attached image as the style reference. After each image, copy the generated PNG into this "
    "repository at the exact path given. Do not write code or modify any other files. If one image fails, "
    "retry it once, then continue with the next.\n\n"
)

CYBER = {
    "end-surrendered": "Ending: a relieved chibi scammer without sunglasses at a friendly small Thai police station front desk, placing a big box of SIM cards on the counter, an officer handing over a glass of water, warm morning light, potted plants.",
    "end-whistleblower": "Ending: a chibi person wearing a funny chicken-rice mascot mask on a stage giving an anti-scam talk to grandparents in a community hall, police officers clapping in the back, a projector showing a cartoon crocodile in a parcel.",
    "end-scam_hunter": "Ending: two chibi youtubers in a cozy bedroom studio with ring lights and headsets, laughing while a scammer on speakerphone is confused, a wall of cute plushies, gaming chair.",
    "ev-cyber_sting_order": "A scammer at a laptop staring at a giant online order for 300 air fryers, a suspiciously smiling customer avatar on the screen wearing an obvious fake mustache, piles of empty cardboard boxes.",
    "ev-cyber_sting_raid": "Five white vans parked in front of a small warehouse full of empty boxes, a cheerful plain-clothes officer waving a document, an orange cat sitting on a box, the scammer peeking from behind a door.",
    "ev-cyber_deal": "A Thai chicken rice shop at noon, a man in a loud flower shirt leaning in to whisper to the nervous scammer, two plates of chicken rice, a ceiling fan, steam.",
    "ev-cyber_informant_mission": "A secret undercover mission: the scammer in a chicken mask hiding behind a potted plant in a fancy office, watching a gang boss wearing golden sandals, police silhouettes outside the window.",
    "ev-romance_reverse": "Split-screen chat: two chibi scammers on opposite phones both sending hearts and fake money charts to each other, sweating, a broken heart sticker floating between them.",
    "ev-baiter_stream": "A youtuber streaming with a big microphone, a cartoon soundwave of a crying scammer on the monitor, chat bubbles full of laughing emojis (no text), the scammer at home hiding under a blanket watching it.",
}

MENUS = {
    "bg-menu_condo": "Main menu background: a luxurious riverside condo balcony at night with the city skyline, the chibi crew posing on fancy sofas with sparkling drinks (soda), gold everywhere, a bit too much bling.",
    "bg-menu_jail": "Main menu background: a funny cramped jail cell, the chibi crew in orange uniforms playing cards, one cellmate holding an air fryer, a guard sleeping on a plastic chair outside.",
    "bg-menu_farm": "Main menu background: a peaceful Thai rice farm at golden hour, the reformed chibi crew planting rice and eating sticky rice under a wooden hut, a buffalo napping.",
    "bg-menu_island": "Main menu background: a tiny deserted island hideout, the chibi crew under palm trees with coconuts and a hammock, a review drone hovering, turquoise sea.",
    "bg-menu_studio": "Main menu background: a colorful youtuber studio with ring lights and cameras, the chibi crew now making anti-scam videos, plushies and neon lights.",
}

SKINS = (
    f"{STYLE} Landscape 1536x1024. A 3x2 grid of six full-body chibi characters on a pure white background, "
    "evenly spaced, not overlapping, each centered in its cell, all are alternate outfits: "
    "1 a smug former insurance salesman in a shiny gold suit with a golden briefcase, "
    "2 a teen gamer in a pro esports jersey with a big headset and a trophy, "
    "3 a chubby young temple-fair volunteer in a cheerful festival outfit holding balloons and a cotton candy (no monks, no religious symbols), "
    "4 a live-stream seller dressed as a sparkly pop idol with a heart-shaped ring light, "
    "5 a phone-repair guy dressed as a movie hacker in a hoodie with green glowing glasses, "
    "6 a chubby orange cat in a tiny business suit sitting on a stack of cardboard boxes like a boss. "
    f"{RULES}"
)
NEWS = (
    f"{STYLE} Landscape 1536x768. A 4x2 grid of eight square cartoon news photos, each photo a framed square with "
    "a light pastel background, separated by wide pure white gutters: "
    "1 a mountain of empty delivery boxes, 2 a lovesick person hugging a phone with heart eyes, "
    "3 a messy call-center room with headsets, 4 a donation box with a sad face and a flood in the background, "
    "5 a temple-fair style stage with lights and a long queue (no monks, no religious symbols), 6 a slot machine "
    "spitting coins, 7 a pyramid of goldfish coins collapsing, 8 a police car chasing a person in a mascot costume. "
    f"{RULES}"
)


def scene_items(d: dict[str, str]) -> list[tuple[str, str]]:
    return [(f"{k}.png", f"{STYLE} {SCENE} {v} {RULES}") for k, v in d.items()]


def write(batch: str, items: list[tuple[str, str]]) -> None:
    body = HEAD + "\n".join(f"- Save to art/gen/{n} :: {p}" for n, p in items) + "\n"
    (GEN / f"{batch}.prompt.txt").write_text(body, encoding="utf-8")
    print(batch, len(items))


if __name__ == "__main__":
    write("b13-cyber", scene_items(CYBER))
    write("b14-meta", [("sheet-skins.png", SKINS), ("sheet-newsphotos.png", NEWS)] + scene_items(MENUS))
