# ตัดแผ่นไอคอนวงกลม 4x4 จาก ChatGPT (art/gen/<sheet>.png) เป็นไอคอน 192px พื้นโปร่ง
# ใช้: python art/cut_icons.py sheet-shop-a id1 id2 ... (16 ชื่อ ตามลำดับอ่าน)
# ตั้ง GRID=2 สำหรับแผ่น 2x2
import os, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT.parent / "client" / "src" / "assets" / "img"
name, ids = sys.argv[1], sys.argv[2:]
src = Image.open(ROOT / "gen" / f"{name}.png").convert("RGB")
arr = np.array(src).astype(int)
ink = (arr.min(axis=2) < 225)
n = int(os.environ.get("GRID", "4"))
cw, ch = src.width / n, src.height / n
for i, key in enumerate(ids):
    if key == "-":
        continue
    x0, y0 = int((i % n) * cw), int((i // n) * ch)
    cell = ink[y0 : int(y0 + ch), x0 : int(x0 + cw)]
    ys, xs = np.nonzero(cell)
    # ใช้ขอบนอกของวงกลม (ตัดเศษเล็ก ๆ ด้วย percentile)
    l, r = np.percentile(xs, 0.2), np.percentile(xs, 99.8)
    t, b = np.percentile(ys, 0.2), np.percentile(ys, 99.8)
    cx, cy = x0 + (l + r) / 2, y0 + (t + b) / 2
    rad = max(r - l, b - t) / 2 + 2
    box = tuple(round(v) for v in (cx - rad, cy - rad, cx + rad, cy + rad))
    tile = src.crop(box).convert("RGBA")
    ss = 4
    mask = Image.new("L", (tile.width * ss, tile.height * ss), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, mask.width - 1, mask.height - 1), fill=255)
    tile.putalpha(mask.resize(tile.size, Image.LANCZOS))
    tile.resize((192, 192), Image.LANCZOS).save(OUT / f"{key}.webp", "WEBP", quality=88, method=6)
    print(key)
