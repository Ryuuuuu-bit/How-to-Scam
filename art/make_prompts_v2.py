# ภาพชุดที่ 2: อาชีพใหม่ ไอคอนใหม่ และฉากของเหตุการณ์ใหม่
# ใช้: python art/make_prompts_v2.py → art/gen/b7..b13*.prompt.txt
import pathlib

from make_prompts import RULES, SCENE, STYLE, THAI

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "gen"

sheets = {
    "sheet-characters-2": "Landscape 1536x1024. A 4x2 grid of eight full-body chibi characters on a pure white background, evenly spaced, not overlapping, each centered in its cell: 1 loud Thai live-stream seller auntie with a ring light and phone on a stick, 2 young phone-repair guy with a screwdriver behind his ear and a toolbox, 3 flamboyant online tarot fortune teller with a purple shawl holding tarot cards (no religious symbols), 4 smug get-rich-quick seminar coach in a shiny suit with a headset microphone, 5 washed-up 1990s TV soap star in big sunglasses and a faded sequin jacket, 6 prim former bank teller lady with glasses, cardigan and a name badge (blank), 7 cheerful neighborhood savings-circle auntie with a notebook and a gold necklace, 8 a chubby orange cat sitting on a laptop keyboard wearing tiny sunglasses.",
    "sheet-icons-c": "Square 1024x1024. A 4x4 grid of 16 round game icons, evenly spaced on a pure white background, each icon centered in its cell with generous padding, same chibi sticker style: 1 donation box with a heart and a crying emoji sticker, 2 festival fair stage with colorful lights and big speakers, 3 stack of casino chips with dice, 4 golden coin with a goldfish face, 5 fancy coffee cup with latte art, 6 golden durian, 7 concert ticket with a ghost, 8 calculator with a messy ledger, 9 potted plant with white-and-green variegated leaves, 10 star-shaped microphone with sparkles, 11 rolled newspaper, 12 string of festival lanterns, 13 hourglass, 14 phone screen exploding with hearts (viral), 15 broken chain link, 16 paper flyer with a big exclamation mark.",
}

scenes = {
    # เหตุการณ์อาชีพ
    "ev-gamer_sleep": "A teenage gamer asleep face-down on a glowing RGB keyboard at dawn in a messy room, energy drink cans, monitor full of repeated letters, cat watching.",
    "ev-live_dance_request": "A Thai live-stream seller auntie dancing wildly in front of a ring light and phone, floating hearts and comment bubbles (no text), boxes of products behind her.",
    "ev-live_freeze": "A frozen live-stream frame on a big phone screen: the seller caught mid-motion putting an empty box into a bag, buffering circle, shocked viewers' faces around.",
    "ev-phone_repair_victim": "A tiny Thai phone repair shop: a kind young technician listening to a sad old man holding a cracked phone, tools and spare parts on the counter.",
    "ev-tarot_police": "An online fortune teller at a candle-lit table flipping three tarot cards that all show cartoon police officers, a shocked expression, purple curtains.",
    "ev-lottery_client_hit": "A crowd of happy Thai customers queuing at dawn outside a fortune teller's house, holding lottery tickets (no numbers), confetti.",
    "ev-coach_seminar": "A hotel ballroom seminar: a smug coach on stage with a headset mic, an audience all in identical yellow shirts cheering, a giant arrow-up chart on the screen.",
    "ev-coach_students_return": "Angry but comic former seminar students in yellow shirts lined up outside a house holding blank protest banners, the coach peeking nervously from a window.",
    "ev-star_comeback": "A washed-up 1990s star reading a new TV drama script in a dusty dressing room with old posters, a producer offering a contract, hopeful lighting.",
    "ev-banker_ex_boss": "A former bank teller on a phone call looking sweaty, split screen with a stern bank branch manager typing on a keyboard.",
    "ev-auntie_neighbors_unite": "A group of determined Thai neighborhood aunties gathered in a soi with phones held up like evidence, one with a megaphone, the savings-circle auntie sweating.",
    "ev-auntie_funeral": "A Thai neighborhood funeral gathering with plastic chairs and white flower wreaths, guests surrounding the savings-circle auntie asking questions, respectful but comic, no religious symbols.",
    "ev-cat_keyboard": "An orange cat walking across a laptop keyboard with a banking app open, numbers flying, a bag of cat food in the background.",
    "ev-cat_police_pet": "Police officers kneeling on the floor of a messy room happily petting a chubby orange cat lying belly-up on a pile of SIM cards.",
    "ev-caretaker_call": "A young man on the phone in a city room at dusk, split screen with a kind old caretaker uncle sweeping leaves at a peaceful Thai village grounds, warm emotional light, no monks, no religious symbols.",
    # เรื่องต่อเนื่อง
    "ev-henchman_love_1": "A henchman in sunglasses typing a love poem on a phone with hearts floating around, other henchmen staring, call-center room.",
    "ev-henchman_love_2": "A henchman handing a handwritten resignation letter to the boss, holding a bouquet, soft romantic lighting, call-center room.",
    "ev-henchman_love_3": "A pink wedding invitation card in the foreground, behind it a cute Thai wedding venue right next to a police station, the boss sweating.",
    "ev-inspector_1": "A chubby police inspector happily eating at a Thai mookata grill restaurant, the nervous owner grilling pork, smoke and string lights.",
    "ev-inspector_2": "The chubby police inspector returning to the mookata restaurant with six police officers filling a long table, all staring at the nervous owner.",
    "ev-reporter_aunt": "A determined auntie TV reporter thrusting a microphone toward a scammer wearing an obviously fake wig, camera crew behind her.",
    "ev-reporter_followup": "The auntie reporter in an empty garden holding a single potted plant, camera crew filming, the scammer hiding behind a wall.",
    "ev-mom_visit": "A Thai mother with a stacked tiffin food carrier standing in the doorway of a messy rented room full of SIM cards and empty boxes, emotional moment.",
    # ปฏิทิน
    "ev-songkran_phones": "Songkran water festival chaos: kids with huge water guns soaking a call-center room, phones floating, everyone laughing and dripping.",
    "ev-world_cup_strike": "Henchmen in football jerseys cheering in front of a TV in the middle of a call-center room, phones abandoned, confetti.",
    "ev-payday_rush": "Payday excitement on a Thai street: office workers with happy faces and shopping bags, money confetti, food delivery riders everywhere.",
    "ev-lottery_day_break": "Henchmen gathered around a phone watching a lottery draw broadcast, clutching lottery tickets (no numbers), tense faces.",
    "ev-loy_krathong_call": "Loy Krathong night: a scammer floating a small banana-leaf krathong in a plastic basin in front of a rented room, holding a video call, lanterns in the sky.",
    "ev-new_year_checkpoint": "A New Year police checkpoint at night with traffic cones and reflective vests, a van full of SIM cards trying to look innocent, fireworks above.",
    "ev-flood_donations": "A flooded Thai neighborhood with people on boats, a phone screen showing a donation page with hearts, a scammer looking guilty.",
    "ev-foundation_receipts": "A giant phone screen with a comment thread of netizens holding magnifying glasses over a receipt from a mookata restaurant.",
    "ev-merit_speaker": "A loud Thai fair with gigantic speakers shaking windows of nearby houses, an old uncle in pajamas covering his ears, colorful lights.",
    "ev-kathin_overflow": "A huge crowded Thai festival fair with colorful lights and food stalls, a parking lot overflowing with cars and motorbikes, no religious symbols.",
    "ev-celebrity_slip": "A glamorous celebrity on a live stream laughing with a hand over her mouth, a horrified organizer behind the camera, meme-style reaction icons.",
    "ev-gambling_real_winner": "An old uncle crying with joy in front of a phone showing a jackpot animation (no text), coins exploding out of the screen, shocked casino staff.",
    "ev-ponzi_seminar_question": "A crypto seminar hall: an auntie in the front row raising her hand, the whole audience turning to look, a giant goldfish coin on the stage screen.",
    "ev-ponzi_whale": "A wealthy fish-sauce factory owner in a luxury car showroom handing over a briefcase of money, three lawyers in suits standing behind him.",
    # ล้อข่าว
    "ev-deepfake_cat": "A TV news screen showing a deepfake video of a person with an orange cat face wearing glasses, the real person watching in shock on a sofa.",
    "ev-fake_slip_victim": "A phone screen showing a hand-drawn fake bank slip with flowers instead of numbers, the online seller laughing in disbelief.",
    "ev-whitening_cream_drama": "A celebrity live-selling a glowing whitening cream jar, the whole Thai street watching on phones with skeptical faces.",
    "ev-mindset_camp": "A motivational camp: hundreds of attendees shouting with raised fists, a scammer on stage holding a microphone, a huge glowing brain on the screen.",
    "ev-runaway_rooster": "A big proud rooster bursting through the window of a call-center room, phones flying, henchmen ducking.",
    "ev-victim_relative": "A scammer at a desk frozen staring at a phone profile picture, a memory bubble of a kind auntie at a rice shop serving free food.",
    "ev-landlord_raise": "A landlady holding a rent notice at the door of a rented room, a pile of food delivery bags stacked outside, the tenant sweating.",
    "ev-rival_gang": "Two rival chibi gangs facing off with karaoke microphones in a neon karaoke room, dramatic lighting.",
    "ev-teen_hacker": "A high-school student in uniform with a laptop smiling proudly, a hacked page on the screen, the scammer boss staring in shock.",
    "ev-loan_app_spam": "A phone flooded with spam messages and loan offers, the scammer replying with a crocodile emoji, comic.",
    "ev-tour_zero_baht": "A tour bus of tourists unloading in front of a giant latex pillow shop, a shady tour guide with a flag, pillows everywhere.",
    "ev-scam_center_rescue": "A worried young man on the phone with an embassy officer, a world map on the wall with a pin, hopeful light.",
    # ฉากจบใหม่
    "end-home_again": "Happy ending: the former scammer getting off a long-distance bus in a peaceful Thai countryside town, family waiting at a small curry rice stall, sunset.",
    "end-comeback_star": "Happy ending: the former scammer as a TV drama star on a red carpet with camera flashes, holding a script titled with a heart symbol (no text).",
}

keys = list(scenes)
batches = {
    "b7-sheets2": sheets,
    "b8-ev-a": {k: scenes[k] for k in keys[0:13]},
    "b9-ev-b": {k: scenes[k] for k in keys[13:26]},
    "b10-ev-c": {k: scenes[k] for k in keys[26:39]},
    "b11-ev-d": {k: scenes[k] for k in keys[39:]},
}

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
    (OUT / f"{name}.prompt.txt").write_text("\n".join(lines), encoding="utf-8")
print(sum(len(v) for v in batches.values()), "images in", len(batches), "batches")
