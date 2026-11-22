# แปลงภาพดิบจาก GPT (art/gen/*.png) เป็นไฟล์ที่เกมใช้ใน client/src/assets/img
#  - ฉาก: ย่อเป็น 720x1080 WebP
#  - แผ่นไอคอน/ตัวละคร: ตัดตามช่อง ลบพื้นขาวให้โปร่งใส แล้ว crop ให้พอดี
# ใช้: python art/process.py
import pathlib

import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent
GEN = ROOT / "gen"
OUT = ROOT.parent / "client" / "src" / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# ชื่อไฟล์ใช้ "--" แทน ":" (Windows ห้ามใช้ :) เช่น icon--dirty.webp → id "icon:dirty"
SHEETS = {
    "sheet-icons-a": (4, 4, [
        "icon--dirty", "icon--clean", "icon--heat", "icon--fame",
        "icon--day", "icon--henchman", "icon--lock", "icon--rest",
        "icon--police", "icon--goldfish", "method--fake_shop", "method--romance",
        "method--call_center", "danger", "shop--sim_pack", "shop--ads",
    ]),
    "sheet-icons-b": (4, 4, [
        "card--goldfish", "card--grandma_pillow", "card--cat_painting", "card--empty_mookata",
        "card--temple_change", "shop--new_phone", "shop--lucky_lawyer", "shop--rename_page",
        "event--lucky", "event--unlucky", "event--silly", "event--karma",
        "misc--handcuffs", "misc--island", "misc--condo", "misc--skewer",
    ]),
    "sheet-characters": (3, 1, ["char--ex_insurance", "char--gamer_kid", "char--temple_kid"]),
    "sheet-characters-2": (4, 2, [
        "char--live_seller", "char--phone_tech", "char--fortune_teller", "char--rich_coach",
        "char--fallen_star", "char--ex_banker", "char--share_auntie", "char--orange_cat",
    ]),
    "sheet-icons-c": (4, 4, [
        "method--foundation", "method--merit", "method--gambling", "method--ponzi",
        "card--specialty_cafe", "card--golden_durian", "card--ghost_concert", "card--accounting_firm",
        "card--variegated_plant", "shop--celebrity_promo", "icon--news", "icon--festival",
        "icon--cooldown", "icon--viral", "icon--ponzi_crash", "icon--exposed",
    ]),
    "sheet-icons-d": (4, 4, [
        "disguise--somtam", "disguise--rider", "disguise--tourist", "disguise--mascot",
        "disguise--none", "route--province", "route--border", "route--island",
        "route--market", "icon--bribe", "icon--undercover", "icon--sting",
        "icon--baitback", "icon--fakenews", "icon--wardrobe", "icon--reform",
    ]),
    "sheet-victims": (3, 2, [
        "victim--v_somsri", "victim--v_tong", "victim--v_boonma",
        "victim--v_praewa", "victim--v_kong", "victim--v_mali",
    ]),
}
SPRITE_MAX = {"sheet-characters": 360, "sheet-characters-2": 360, "sheet-victims": 256}


def remove_white_bg(img: Image.Image, tol: int = 38) -> Image.Image:
    """ลบพื้นขาวที่ต่อจากขอบภาพ (flood fill) ส่วนสีขาวด้านในตัวละครยังอยู่"""
    rgb = img.convert("RGB")
    pad = Image.new("RGB", (rgb.width + 4, rgb.height + 4), (255, 255, 255))
    pad.paste(rgb, (2, 2))
    sentinel = (255, 0, 255)
    ImageDraw.floodfill(pad, (0, 0), sentinel, thresh=tol)
    arr = np.array(pad)[2:-2, 2:-2]
    bg = (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 255)
    rgba = np.dstack([np.array(rgb), np.where(bg, 0, 255).astype(np.uint8)])
    return Image.fromarray(rgba, "RGBA")


def trim(img: Image.Image, margin: int = 6) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - margin), max(0, t - margin), min(img.width, r + margin), min(img.height, b + margin)))


def fit(img: Image.Image, max_side: int) -> Image.Image:
    s = max_side / max(img.size)
    if s >= 1:
        return img
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


def keep_main_blob(img: Image.Image) -> Image.Image:
    """เก็บเฉพาะก้อนภาพที่อยู่กลางช่อง ตัดเศษของช่องข้างๆ ทิ้ง"""
    import cv2

    arr = np.array(img)
    alpha = arr[:, :, 3]
    # กัดขอบก่อน เพื่อตัดสะพานบางๆ ที่เชื่อมกับเศษของช่องข้างๆ แล้วค่อยขยายกลับ
    kernel = np.ones((15, 15), np.uint8)
    mask = cv2.erode((alpha > 0).astype(np.uint8), kernel)
    n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return img
    h, w = alpha.shape
    best = max(
        range(1, n),
        key=lambda i: stats[i][4] / (1 + np.hypot(cents[i][0] - w / 2, cents[i][1] - h / 2) / max(w, h)) ** 4,
    )
    keep = cv2.dilate((labels == best).astype(np.uint8), np.ones((19, 19), np.uint8))
    arr[:, :, 3] = np.where(keep > 0, alpha, 0)
    return Image.fromarray(arr, "RGBA")


def process_icon_sheet(name: str, ids: list[str]) -> bool:
    """แผ่นไอคอนวงกลม: หาวงกลมด้วย Hough แล้วตัดเป็นวงกลมพอดี (กันเศษไอคอนข้างๆ ติดมา)"""
    import cv2

    bgr = cv2.imread(str(GEN / f"{name}.png"))
    gray = cv2.medianBlur(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), 5)
    cell = bgr.shape[1] / 4
    found = cv2.HoughCircles(
        gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=cell * 0.7, param1=120, param2=40,
        minRadius=int(cell * 0.38), maxRadius=int(cell * 0.55),
    )
    if found is None or len(found[0]) != len(ids):
        return False
    circles = sorted((tuple(map(float, c)) for c in found[0]), key=lambda c: c[1])
    circles = [c for i in range(0, len(circles), 4) for c in sorted(circles[i : i + 4], key=lambda c: c[0])]
    src = Image.open(GEN / f"{name}.png").convert("RGB")
    for key, (cx, cy, r) in zip(ids, circles):
        nearest = min(np.hypot(cx - ox, cy - oy) for ox, oy, _ in circles if (ox, oy) != (cx, cy))
        radius = min(r + 4, nearest / 2 - 2)
        box = (round(cx - radius), round(cy - radius), round(cx + radius), round(cy + radius))
        tile = src.crop(box).convert("RGBA")
        ss = 4
        big = Image.new("L", (tile.width * ss, tile.height * ss), 0)
        ImageDraw.Draw(big).ellipse((0, 0, big.width - 1, big.height - 1), fill=255)
        tile.putalpha(big.resize(tile.size, Image.LANCZOS))
        fit(tile, 192).save(OUT / f"{key}.webp", "WEBP", quality=88, method=6)
    return True


def process_sheet(name: str, cols: int, rows: int, ids: list[str]) -> None:
    if name.startswith("sheet-icons") and process_icon_sheet(name, ids):
        print("sheet", name, len(ids), "circles")
        return
    src = Image.open(GEN / f"{name}.png").convert("RGB")
    cw, ch = src.width / cols, src.height / rows
    mx, my = cw * 0.08, ch * 0.08
    for i, key in enumerate(ids):
        c, r = i % cols, i // cols
        box = (
            max(0, round(c * cw - mx)),
            max(0, round(r * ch - my)),
            min(src.width, round((c + 1) * cw + mx)),
            min(src.height, round((r + 1) * ch + my)),
        )
        sprite = keep_main_blob(remove_white_bg(src.crop(box)))
        sprite = fit(trim(sprite), SPRITE_MAX.get(name, 192))
        sprite.save(OUT / f"{key}.webp", "WEBP", quality=88, method=6)
    print("sheet", name, len(ids))


def process_scene(path: pathlib.Path) -> None:
    img = Image.open(path).convert("RGB")
    # บังคับสัดส่วน 2:3 แนวตั้ง (crop ตรงกลางถ้าภาพไม่ตรง)
    target = 2 / 3
    if img.width / img.height > target:
        w = round(img.height * target)
        x = (img.width - w) // 2
        img = img.crop((x, 0, x + w, img.height))
    img = img.resize((720, 1080), Image.LANCZOS)
    key = path.stem.replace("bg-", "scene--").replace("ev-", "scene--ev_").replace("end-", "scene--end_")
    img.save(OUT / f"{key}.webp", "WEBP", quality=78, method=6)
    print("scene", key)


if __name__ == "__main__":
    for name, (cols, rows, ids) in SHEETS.items():
        if (GEN / f"{name}.png").exists():
            process_sheet(name, cols, rows, ids)
    for p in sorted(GEN.glob("*.png")):
        if p.stem.startswith(("bg-", "ev-", "end-")):
            process_scene(p)
