/**
 * Device silhouettes in the variant's colour (runda 18.11 v2 §0 „Zdjęcia”, fallback (3)): our own
 * drawing per kind, never a copy of a manufacturer render. Returns an SVG string so it works in
 * server components, as a data URI and in tests. The body takes the swatch colour with a soft light
 * from the top-left; the screen stays dark glass, so every colour reads well in both themes.
 */
import type { Kind } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Lighter (amount > 0) or darker (< 0) shade of a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => (amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)));
  return `#${ch.map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

const SIZES: Record<Kind, { w: number; h: number }> = {
  phone: { w: 240, h: 480 },
  tablet: { w: 380, h: 500 },
  laptop: { w: 520, h: 340 },
  desktop: { w: 480, h: 440 },
  watch: { w: 240, h: 360 },
  audio: { w: 320, h: 300 },
};

export function silhouetteSize(kind: Kind) {
  return SIZES[kind];
}

/** `id` keeps gradient ids unique when several silhouettes share a page. */
export function silhouetteSvg(kind: Kind, hex: string, id = "s"): string {
  const { w, h } = SIZES[kind];
  const hi = shade(hex, 0.35);
  const lo = shade(hex, -0.28);
  const edge = shade(hex, -0.45);
  const defs = `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${hex}"/><stop offset="1" stop-color="${lo}"/></linearGradient><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2d33"/><stop offset="1" stop-color="#0c0d10"/></linearGradient><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".28"/><stop offset=".4" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`;
  let body = "";
  switch (kind) {
    case "phone":
      body = `<rect x="14" y="8" width="212" height="464" rx="40" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="24" y="18" width="192" height="444" rx="31" fill="url(#${id}g)"/><rect x="92" y="30" width="56" height="16" rx="8" fill="#000"/><rect x="24" y="18" width="192" height="444" rx="31" fill="url(#${id}r)"/>`;
      break;
    case "tablet":
      body = `<rect x="10" y="10" width="360" height="480" rx="30" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="24" y="24" width="332" height="452" rx="18" fill="url(#${id}g)"/><circle cx="190" cy="17" r="3" fill="#000"/><rect x="24" y="24" width="332" height="452" rx="18" fill="url(#${id}r)"/>`;
      break;
    case "laptop":
      body = `<rect x="70" y="10" width="380" height="250" rx="16" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="82" y="22" width="356" height="226" rx="8" fill="url(#${id}g)"/><rect x="82" y="22" width="356" height="226" rx="8" fill="url(#${id}r)"/><path d="M20 270h480l-18 40a14 14 0 0 1-13 8H51a14 14 0 0 1-13-8z" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="220" y="270" width="80" height="8" rx="4" fill="${lo}"/>`;
      break;
    case "desktop":
      body = `<rect x="20" y="10" width="440" height="300" rx="18" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="34" y="24" width="412" height="236" rx="6" fill="url(#${id}g)"/><rect x="34" y="24" width="412" height="236" rx="6" fill="url(#${id}r)"/><path d="M200 310h80l18 100h-116z" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="150" y="406" width="180" height="16" rx="8" fill="${lo}"/>`;
      break;
    case "watch":
      body = `<rect x="70" y="0" width="100" height="70" rx="14" fill="${lo}"/><rect x="70" y="290" width="100" height="70" rx="14" fill="${lo}"/><rect x="30" y="60" width="180" height="240" rx="52" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><rect x="44" y="74" width="152" height="212" rx="40" fill="url(#${id}g)"/><rect x="210" y="130" width="12" height="44" rx="6" fill="${edge}"/><rect x="44" y="74" width="152" height="212" rx="40" fill="url(#${id}r)"/>`;
      break;
    case "audio":
      body = `<rect x="40" y="90" width="240" height="190" rx="70" fill="url(#${id}b)" stroke="${edge}" stroke-width="2"/><path d="M48 168h224" stroke="${edge}" stroke-width="2"/><rect x="40" y="90" width="240" height="190" rx="70" fill="url(#${id}r)"/><circle cx="160" cy="226" r="5" fill="${edge}"/>`;
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${defs}${body}</svg>`;
}

export function silhouetteDataUri(kind: Kind, hex: string, id?: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(silhouetteSvg(kind, hex, id))}`;
}
