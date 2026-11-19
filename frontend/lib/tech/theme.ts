/**
 * Public-site theme (docs/tech/SPEC.md §3, docs/tech/MOTYW-PASEK-LINII.md §2–§3) — fully separate
 * from the panels: attribute `data-tech-theme="light|dark"` on <html>, choice in
 * localStorage['pk-theme'] ("light" | "dark", missing = Auto). Never touches `data-theme` or
 * `prokom-theme` (panels).
 */
import { DAYLIGHT_TABLE } from "./daylight.generated";
import { NIGHT_OFFSET_MIN } from "./daylight";

export const THEME_STORAGE_KEY = "pk-theme";
export const THEME_ATTR = "data-tech-theme";
/** Carries the choice between PRO-KOM domains (§3): ?motyw=jasny|ciemny|auto. */
export const THEME_PARAM = "motyw";
export const THEME_PARAM_VALUES = { light: "jasny", dark: "ciemny", auto: "auto" } as const;
export type ThemeChoice = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

/** §2.1 as a pure function (the inline script below follows the same order). */
export function resolveTheme(input: { stored: ThemeChoice; systemDark: boolean; night: boolean }): ResolvedTheme {
  if (input.stored !== "auto") return input.stored; // a person's choice always wins
  return input.systemDark || input.night ? "dark" : "light";
}

/** ?motyw value → choice; unknown or missing → null (ignored, still removed from the address). */
export function parseThemeParam(value: string | null): ThemeChoice | null {
  if (value === THEME_PARAM_VALUES.light) return "light";
  if (value === THEME_PARAM_VALUES.dark) return "dark";
  if (value === THEME_PARAM_VALUES.auto) return "auto";
  return null;
}

/**
 * Inline script, first element of the public layout (no flash). Order (§2.1): ?motyw (saved, auto =
 * key removed) → saved choice → system dark → night in Rabka-Zdrój (DAYLIGHT_TABLE, UTC minutes,
 * interpolated between the 15ths) → light. Always sets data-tech-theme. In Auto it checks again only
 * on return to the tab and on a system change (never while reading); a changed result fades for
 * 300 ms (instant with reduced motion). Exposes window.__pkSetTheme / __pkGetTheme / __pkAutoTheme.
 */
export const themeScript = `(function(){try{var K='${THEME_STORAGE_KEY}',A='${THEME_ATTR}',d=document.documentElement,mq=window.matchMedia('(prefers-color-scheme: dark)'),T=${JSON.stringify(DAYLIGHT_TABLE)},O=${NIGHT_OFFSET_MIN},M=[15,46,74,105,135,166,196,227,258,288,319,349];
try{var q=new URLSearchParams(location.search).get('${THEME_PARAM}');if(q==='${THEME_PARAM_VALUES.light}')localStorage.setItem(K,'light');else if(q==='${THEME_PARAM_VALUES.dark}')localStorage.setItem(K,'dark');else if(q==='${THEME_PARAM_VALUES.auto}')localStorage.removeItem(K)}catch(e){}
function c(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'?v:'auto'}catch(e){return 'auto'}}
function n(t){var y=t.getUTCFullYear(),o=(Date.UTC(y,t.getUTCMonth(),t.getUTCDate())-Date.UTC(y,0,0))/864e5,i=-1;for(var k=0;k<12;k++)if(M[k]>o){i=k-1;break}if(k===12)i=11;var a=i<0?11:i,b=(a+1)%12,f0=i<0?M[11]-365:M[a],f1=i<0?M[0]:b===0?M[0]+365:M[b],f=(o-f0)/(f1-f0),r=T[a*2]+(T[b*2]-T[a*2])*f,s=T[a*2+1]+(T[b*2+1]-T[a*2+1])*f,m=t.getUTCHours()*60+t.getUTCMinutes();return m<r-O||m>=s+O}
function u(){return mq.matches||n(new Date())?'dark':'light'}
function a(soft){var v=c(),r=v==='auto'?u():v,p=d.getAttribute(A);if(soft&&p===r)return;d.setAttribute(A,r);d.setAttribute('data-tech-theme-choice',v);d.style.colorScheme=r;if(soft&&p){var R=document.querySelector('.tech');if(R&&!d.hasAttribute('data-tech-reduced')&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){R.classList.add('t-theme-autofade');setTimeout(function(){R.classList.remove('t-theme-autofade')},320)}}try{window.dispatchEvent(new CustomEvent('pk-theme',{detail:{choice:v,theme:r}}))}catch(e){}}
window.__pkSetTheme=function(v){try{if(v==='light'||v==='dark')localStorage.setItem(K,v);else localStorage.removeItem(K)}catch(e){}a()};
window.__pkGetTheme=function(){return {choice:c(),theme:d.getAttribute(A)||'light'}};
window.__pkAutoTheme=u;
if(!window.__pkThemeWatch){window.__pkThemeWatch=1;if(mq.addEventListener)mq.addEventListener('change',function(){if(c()==='auto')a(1)});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&c()==='auto')a(1)})}
a()}catch(e){}})();`;

declare global {
  interface Window {
    __pkSetTheme?: (choice: ThemeChoice) => void;
    __pkGetTheme?: () => { choice: ThemeChoice; theme: ResolvedTheme };
    /** What Auto resolves to right now (system dark or night in Rabka → dark). */
    __pkAutoTheme?: () => ResolvedTheme;
    __pkThemeWatch?: number;
  }
}

export function setTechTheme(choice: ThemeChoice): void {
  window.__pkSetTheme?.(choice);
}

export function getTechTheme(): { choice: ThemeChoice; theme: ResolvedTheme } {
  if (typeof window === "undefined" || !window.__pkGetTheme) return { choice: "auto", theme: "light" };
  return window.__pkGetTheme();
}

/** theme-color per resolved theme (browser UI on phones) — mirrors --theme-color in tech-theme.css. */
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#f4f5f1", dark: "#0e0a09" };

/** Theme circle (MOTYW-PASEK-LINII §1.5): one duration and curve for every PRO-KOM line. */
export const THEME_REVEAL_MS = 600;
export const THEME_REVEAL_EASE = "cubic-bezier(.2,.8,.2,1)";

const VT_STYLE_ID = "t-vt-theme";
// ::view-transition pseudos live on the document root and cannot be scoped under .tech,
// so the rules are injected only for the moment of a theme switch on the public site.
const VT_CSS = `html.t-vt-theme::view-transition-old(root),html.t-vt-theme::view-transition-new(root){animation:none;mix-blend-mode:normal}
html.t-vt-theme::view-transition-new(root){animation:t-vt-circle ${THEME_REVEAL_MS}ms ${THEME_REVEAL_EASE}}
@keyframes t-vt-circle{0%{clip-path:circle(0 at var(--t-vt-x,50%) var(--t-vt-y,0))}100%{clip-path:circle(var(--t-vt-r,150vmax) at var(--t-vt-x,50%) var(--t-vt-y,0))}}`;

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/** Updates (or adds) <meta name="theme-color"> for the public site; returns the previous value. */
export function applyThemeColor(theme: ResolvedTheme): string | null {
  if (typeof document === "undefined") return null;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const prev = meta?.getAttribute("content") ?? null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("data-tech", "");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", THEME_COLORS[theme]);
  return prev;
}

/**
 * Switch with motion (PREMIUM §3): a View Transition circle growing from `from`
 * (the toggle), or a 200 ms crossfade where View Transitions are missing.
 * Reduced motion → instant. `.t-theme-switching` on the .tech root mutes component
 * transitions for the duration.
 */
export function switchTechTheme(choice: ThemeChoice, from?: { x: number; y: number } | null): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const root = document.querySelector<HTMLElement>(".tech");
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-tech-reduced");
  const apply = () => {
    setTechTheme(choice);
    applyThemeColor(getTechTheme().theme);
  };
  const before = getTechTheme().theme;
  const after: ResolvedTheme = choice === "auto" ? (window.__pkAutoTheme?.() ?? "light") : choice;
  if (reduced || before === after || !root) {
    apply();
    return Promise.resolve();
  }
  root.classList.add("t-theme-switching");
  const done = () => {
    root.classList.remove("t-theme-switching");
    document.documentElement.classList.remove("t-vt-theme");
  };
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition === "function") {
    if (!document.getElementById(VT_STYLE_ID)) {
      const s = document.createElement("style");
      s.id = VT_STYLE_ID;
      s.textContent = VT_CSS;
      document.head.appendChild(s);
    }
    const x = from?.x ?? window.innerWidth - 40;
    const y = from?.y ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const html = document.documentElement.style;
    html.setProperty("--t-vt-x", `${x}px`);
    html.setProperty("--t-vt-y", `${y}px`);
    html.setProperty("--t-vt-r", `${Math.ceil(r)}px`);
    document.documentElement.classList.add("t-vt-theme");
    try {
      return doc.startViewTransition(apply).finished.then(done, done);
    } catch {
      /* fall through to the crossfade */
    }
  }
  apply();
  root.classList.remove("t-theme-fade");
  void root.offsetWidth;
  root.classList.add("t-theme-fade");
  return new Promise((resolve) =>
    window.setTimeout(() => {
      root.classList.remove("t-theme-fade");
      done();
      resolve();
    }, 220),
  );
}
