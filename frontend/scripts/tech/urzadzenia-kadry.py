"""
Wizard device photos (feat/tech-kreator-wizual): calm dark screens instead of the bright
wallpapers, tablet shown front-only and whole. Run from frontend/:
    python scripts/tech/urzadzenia-kadry.py
Sources: the original WebP files are read from git (develop, commit 1bec177), so the script is
repeatable. Output: public/tech/urzadzenia/{tablet,iphone}.webp (alpha, 2x, <= 120 kB).
"""
import io
import subprocess

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SS = 4  # supersampling for masks
SRC_REV = "1bec177"


def src(name: str) -> Image.Image:
    data = subprocess.run(["git", "show", f"{SRC_REV}:frontend/public/tech/urzadzenia/{name}"], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(data)).convert("RGBA")


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


def tablet():
    im = src("tablet.webp")
    # front panel only (the back peeking out on the left is dropped — it read as overlap)
    fx0, fy0, fx1, fy1, fr = 129, 31, 541, 609, 30
    pad = 2
    crop = im.crop((fx0 - pad, fy0 - pad, fx1 + pad, fy1 + pad))
    S = 2
    w, h = crop.size[0] * S, crop.size[1] * S
    big = crop.resize((w, h), Image.LANCZOS)
    outer = (pad * S, pad * S, w - pad * S, h - pad * S)
    alpha = rrect_mask((w, h), outer, fr * S)
    # rim: aluminium edge from the photo, bezel black, then the calm screen
    body = big.copy()
    body.putalpha(255)
    bez = rrect_mask((w, h), (outer[0] + 3 * S, outer[1] + 3 * S, outer[2] - 3 * S, outer[3] - 3 * S), (fr - 3) * S)
    body = Image.composite(Image.new("RGBA", (w, h), (6, 6, 8, 255)), body, bez)
    inset = 14 * S
    sbox = (outer[0] + inset, outer[1] + inset, outer[2] - inset, outer[3] - inset)
    scr = calm_screen(sbox[2] - sbox[0], sbox[3] - sbox[1]).convert("RGBA")
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layer.paste(scr, (sbox[0], sbox[1]))
    smask = rrect_mask((w, h), sbox, 17 * S)
    body = Image.composite(layer, body, smask)
    # front camera on the long edge (landscape camera, iPad Pro), drawn in the bezel
    d = ImageDraw.Draw(body)
    cx, cy, r = outer[2] - 8.5 * S, h / 2, 2.2 * S
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(28, 30, 36, 255))
    d.ellipse((cx - r * 0.45, cy - r * 0.45, cx + r * 0.1, cy + r * 0.1), fill=(60, 66, 80, 255))
    body.putalpha(alpha)
    save(body, "tablet.webp")
    return body.size, sbox


def iphone():
    im = src("iphone.webp")
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
    save(out, "iphone.webp")
    return out.size, sbox


if __name__ == "__main__":
    print(tablet())
    print(iphone())
