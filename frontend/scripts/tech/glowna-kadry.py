"""
Home page photo crops (feat/tech-glowna-zdjecia): every device photo trimmed to its own
silhouette (alpha bbox + a small margin), so the hero and the "Co naprawiamy" cards can
anchor them precisely. Run from frontend/:
    python scripts/tech/glowna-kadry.py
Sources: the lossless prototype PNGs (docs/design/tech/prototyp/img, rights: PRO-KOM, 15.11.2026).
Output: public/tech/urzadzenia/kadr-*.webp — separate files; the shared iphone.webp,
laptop.webp, … used elsewhere stay untouched. Never upscaled: each crop keeps the source
pixels 1:1 (the sources are 433–640 px, see config/media-zrodla.json). samsung.webp has
no margin, so the shared file is used as is.
"""
import os

from PIL import Image, ImageChops, ImageDraw

SRC_DIR = os.path.join("..", "docs", "design", "tech", "prototyp", "img")
OUT_DIR = os.path.join("public", "tech", "urzadzenia")
PAD = 4  # px of transparent margin around the silhouette (antialiased edge + drop-shadow start)

CROPS = {
    "laptop.png": "kadr-laptop.webp",
    "iphone.png": "kadr-iphone.webp",
    "tablet.png": "kadr-tablet.webp",
    "komputer.png": "kadr-komputer.webp",
    "konsola.png": "kadr-konsola.webp",
    "drukarka.png": "kadr-drukarka.webp",
}

# Hero: single phones (front only) cut out of the prototype's front + back pairs. The front phone
# lies on top of the back one, so a rounded-rect mask on its outline isolates it cleanly.
# box = outline in source px (x0, y0, x1, y1), r = corner radius in px (measured at 4x zoom).
FRONTS = {
    "iphone.png": ("hero-iphone.webp", (182, 51, 414, 536), 24),
    "samsung.png": ("hero-samsung.webp", (189.5, 2, 451.5, 548), 23),
}
SS = 4  # supersampling for the mask


def trim(im: Image.Image) -> Image.Image:
    alpha = im.getchannel("A").point(lambda v: 255 if v > 8 else 0)
    x0, y0, x1, y1 = alpha.getbbox()
    return im.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)))


def fronts() -> None:
    for name, (out, (x0, y0, x1, y1), r) in FRONTS.items():
        im = Image.open(os.path.join(SRC_DIR, name)).convert("RGBA")
        mask = Image.new("L", (im.width * SS, im.height * SS), 0)
        ImageDraw.Draw(mask).rounded_rectangle((x0 * SS, y0 * SS, x1 * SS, y1 * SS), radius=r * SS, fill=255)
        mask = mask.resize(im.size, Image.LANCZOS)
        im.putalpha(ImageChops.multiply(im.getchannel("A"), mask))
        crop = trim(im)
        path = os.path.join(OUT_DIR, out)
        crop.save(path, "WEBP", quality=92, method=6, exact=False)
        print(f"{out}: {crop.width}x{crop.height} ({os.path.getsize(path) // 1024} kB) from {name}")


def main() -> None:
    for name, out in CROPS.items():
        im = Image.open(os.path.join(SRC_DIR, name)).convert("RGBA")
        # ignore near-transparent fringe pixels when measuring the silhouette
        alpha = im.getchannel("A").point(lambda v: 255 if v > 8 else 0)
        x0, y0, x1, y1 = alpha.getbbox()
        box = (max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD))
        crop = im.crop(box)
        path = os.path.join(OUT_DIR, out)
        crop.save(path, "WEBP", quality=92, method=6, exact=False)
        print(f"{out}: {crop.width}x{crop.height} ({os.path.getsize(path) // 1024} kB) from {name} box={box}")
    fronts()


if __name__ == "__main__":
    main()
