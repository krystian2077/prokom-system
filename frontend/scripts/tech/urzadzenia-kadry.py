"""
Wizard device photos (feat/tech-kreator-wizual): calm dark screens instead of the bright
wallpapers, tablet shown front-only and whole. Run from frontend/:
    python scripts/tech/urzadzenia-kadry.py
Sources: the lossless prototype PNGs (docs/design/tech/prototyp/img, rights: PRO-KOM, 15.11.2026).
Output: public/tech/urzadzenia/kreator-iphone.webp (alpha, 2x, <= 120 kB) — only for the /lab
comparison of directions (the wizard uses vector illustrations since feat/tech-kreator-wow);
the shared tablet.webp / iphone.webp used across the site stay untouched.
"""
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SS = 4  # supersampling for masks
SRC_DIR = os.path.join("..", "docs", "design", "tech", "prototyp", "img")


def src(name: str) -> Image.Image:
    return Image.open(os.path.join(SRC_DIR, name)).convert("RGBA")


def rrect_mask(size, box, r, feather=0.0):
    """Anti-aliased rounded-rect mask (L) of `size`, box/r in px."""
    w, h = size
    m = Image.new("L", (w * SS, h * SS), 0)
    x0, y0, x1, y1 = box
    ImageDraw.Draw(m).rounded_rectangle((x0 * SS, y0 * SS, x1 * SS - 1, y1 * SS - 1), radius=r * SS, fill=255)
    m = m.resize((w, h), Image.LANCZOS)
    return m.filter(ImageFilter.GaussianBlur(feather)) if feather else m


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def calm_screen(w, h):
    """Dark, quiet screen: graphite base, soft warm glow top-left, faint cool glow bottom-right,
    one diagonal glass reflection. Effects stay readable on it in both themes."""
    base = Image.new("RGB", (w, h), (12, 13, 16))
    glow = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(glow)
    d.ellipse((-w * 0.55, -h * 0.35, w * 0.85, h * 0.55), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.28))
    base = Image.composite(Image.new("RGB", (w, h), (42, 36, 38)), base, glow)
    glow2 = Image.new("L", (w, h), 0)
    ImageDraw.Draw(glow2).ellipse((w * 0.35, h * 0.62, w * 1.45, h * 1.35), fill=120)
    glow2 = glow2.filter(ImageFilter.GaussianBlur(w * 0.3))
    base = Image.composite(Image.new("RGB", (w, h), (24, 30, 40)), base, glow2)
    # glass reflection: a wide soft diagonal band
    refl = Image.new("L", (w, h), 0)
    ImageDraw.Draw(refl).polygon([(w * 0.18, -2), (w * 0.52, -2), (-2, h * 0.52), (-2, h * 0.18)], fill=22)
    refl = refl.filter(ImageFilter.GaussianBlur(w * 0.06))
    base = Image.composite(Image.new("RGB", (w, h), (255, 255, 255)), base, refl)
    # fine noise against banding
    noise = Image.effect_noise((w, h), 6).convert("RGB")
    return Image.blend(base, ImageChops.overlay(base, noise), 0.25)


def save(im: Image.Image, name: str, quality=88):
    path = f"public/tech/urzadzenia/{name}"
    for q in (quality, 84, 80, 76, 72):
        im.save(path, "WEBP", quality=q, alpha_quality=90, method=6)
        size = len(open(path, "rb").read())
        if size <= 120_000:
            break
    print(name, im.size, f"{size / 1024:.1f} kB", f"q={q}")


def iphone():
    im = src("iphone.png")
    S = 2
    w, h = im.size[0] * S, im.size[1] * S
    big = im.resize((w, h), Image.LANCZOS)
    sbox = (191 * S, 59 * S, 407 * S, 527 * S)
    scr = calm_screen(sbox[2] - sbox[0], sbox[3] - sbox[1]).convert("RGBA")
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer.paste(scr, (sbox[0], sbox[1]))
    smask = rrect_mask((w, h), sbox, 26 * S)
    a = big.getchannel("A")
    out = Image.composite(layer, big, smask)
    # Dynamic Island
    island = rrect_mask((w, h), (267 * S, 65 * S, 328 * S, 83 * S), 9 * S)
    out = Image.composite(Image.new("RGBA", (w, h), (2, 2, 3, 255)), out, island)
    out.putalpha(a)
    save(out, "kreator-iphone.webp")
    return out.size, sbox


if __name__ == "__main__":
    print(iphone())
