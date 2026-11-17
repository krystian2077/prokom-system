"""Laptop photos without the manufacturer's logo (feat/tech-szkic-formularza, audit 16.11).

laptop.webp and kadr-laptop.webp show a laptop lid with a dark apple logo in the middle. A non
authorised service should not show a trademark that big, so the logo is retouched away:

1. In a search box around the logo, a smooth surface (2nd order polynomial per channel) is fitted
   to the matte lid, robustly: pixels much darker than the fit (the logo) are dropped and the fit
   is repeated.
2. The logo mask = pixels clearly darker than that surface, grown by a few pixels (anti-aliased
   edge) and feathered.
3. The masked area gets the fitted surface plus fine grain with the same strength as the lid's
   own texture around it (sampled from the residual of the fit), blended through the feathered
   mask. The alpha channel, size and everything outside the box stay untouched.

Pure Pillow + numpy (no OpenCV needed). Writes NEW files next to the originals.
kadr-laptop.webp (with the logo) is no longer in the repo: to rebuild, run glowna-kadry.py first
(it recreates it from the prototype PNG), then this script, then delete kadr-laptop.webp again.
laptop.webp stays while subhero/HubCollage.tsx still points at it.
Run from frontend/: python scripts/tech/laptop-bez-logo.py
"""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter

DIR = "public/tech/urzadzenia"
# source -> (output, search box x0, y0, x1, y1 — on the lid, around the logo, away from the lid edge)
JOBS = {
    "laptop.webp": ("laptop-bez-logo.webp", (180, 180, 330, 340)),
    "kadr-laptop.webp": ("kadr-laptop-bez-logo.webp", (160, 100, 310, 255)),
}
DARK_DELTA = 6.0  # luminance below the lid surface that counts as logo
GROW = 3  # px added around the detected logo (its soft edge)
FEATHER = 1.6  # gaussian radius of the mask edge
SEED = 1611  # fixed grain, reproducible output


def design(xs: np.ndarray, ys: np.ndarray) -> np.ndarray:
    return np.stack([np.ones_like(xs), xs, ys, xs * xs, xs * ys, ys * ys], axis=1)


def fit_surface(vals: np.ndarray, xs: np.ndarray, ys: np.ndarray, keep: np.ndarray) -> np.ndarray:
    coef, *_ = np.linalg.lstsq(design(xs[keep], ys[keep]), vals[keep], rcond=None)
    return design(xs, ys) @ coef


def retouch(src: str, out: str, box: tuple[int, int, int, int]) -> None:
    img = Image.open(f"{DIR}/{src}").convert("RGBA")
    arr = np.asarray(img).astype(np.float64)
    x0, y0, x1, y1 = box
    crop = arr[y0:y1, x0:x1]
    h, w = crop.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    xs = xx.ravel() / w
    ys = yy.ravel() / h
    rgb = crop[..., :3].reshape(-1, 3)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    opaque = crop[..., 3].ravel() > 250

    keep = opaque.copy()
    for _ in range(6):  # robust fit: drop the logo (darker) and refit
        surf = fit_surface(lum, xs, ys, keep)
        keep = opaque & (lum > surf - DARK_DELTA)
    logo = (opaque & (lum < surf - DARK_DELTA)).reshape(h, w)

    # grow + feather the mask
    m = Image.fromarray((logo * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(GROW * 2 + 1)).filter(ImageFilter.GaussianBlur(FEATHER))
    alpha = np.asarray(m).astype(np.float64) / 255.0
    lid = keep.reshape(h, w) & (alpha.ravel() == 0).reshape(h, w)

    fill = np.empty_like(rgb)
    resid_sd = []
    for c in range(3):
        surf_c = fit_surface(rgb[:, c], xs, ys, lid.ravel())
        fill[:, c] = surf_c
        resid_sd.append(np.std(rgb[lid.ravel(), c] - surf_c[lid.ravel()]))
    # grain: luminance noise (same for all channels, like sensor/matte texture), slightly blurred
    rng = np.random.default_rng(SEED)
    noise = Image.fromarray(np.clip(rng.normal(128, 40, (h, w)), 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    n = (np.asarray(noise).astype(np.float64) - 128) / 40
    n /= max(n.std(), 1e-6)
    sd = float(np.mean(resid_sd))
    fill = fill.reshape(h, w, 3) + n[..., None] * sd

    a = alpha[..., None]
    crop[..., :3] = crop[..., :3] * (1 - a) + fill * a
    arr[y0:y1, x0:x1] = crop
    res = Image.fromarray(np.clip(np.rint(arr), 0, 255).astype(np.uint8), "RGBA")
    assert res.size == img.size
    res.save(f"{DIR}/{out}", "WEBP", quality=90, alpha_quality=100, method=6)
    print(f"{src} -> {out}: logo {int(logo.sum())} px, grain sd {sd:.2f}")


if __name__ == "__main__":
    for s, (o, b) in JOBS.items():
        retouch(s, o, b)
