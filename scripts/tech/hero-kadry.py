"""Hero crop of the tablet (feat/tech-hero-bez-maca).

kadr-tablet.webp has transparent holes inside the screen (the wallpaper's black areas were cut out
with the background). For the hero the device sits on a dark, lit stage, so every transparent pixel
enclosed by the device silhouette is composited over the screen black; pixels connected to the
image border stay transparent. No resizing (never upscale).

Run from the repo root: python scripts/tech/hero-kadry.py
"""
from collections import deque

from PIL import Image

SRC = "frontend/public/tech/urzadzenia/kadr-tablet.webp"
OUT = "frontend/public/tech/urzadzenia/hero-tablet.webp"
SCREEN = (6, 6, 8)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = img.load()

# exterior = near-transparent pixels reachable from the border
outside = bytearray(w * h)
q = deque()
for x in range(w):
    q.extend(((x, 0), (x, h - 1)))
for y in range(h):
    q.extend(((0, y), (w - 1, y)))
while q:
    x, y = q.popleft()
    i = y * w + x
    if outside[i] or px[x, y][3] > 200:
        continue
    outside[i] = 1
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < w and 0 <= ny < h and not outside[ny * w + nx]:
            q.append((nx, ny))

base = Image.new("RGBA", (w, h), SCREEN + (255,))
inside = Image.new("L", (w, h), 0)
inside.putdata([0 if o else 255 for o in outside])
filled = Image.alpha_composite(base, img)
out = img.copy()
out.paste(filled, (0, 0), inside)
out.save(OUT, "WEBP", quality=88, method=6)
print(OUT, out.size)
