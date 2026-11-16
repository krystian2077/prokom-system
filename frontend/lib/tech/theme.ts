/**
 * Public-site theme (docs/tech/SPEC.md §3) — fully separate from the panels:
 * attribute `data-tech-theme="light|dark"` on <html>, choice in localStorage['pk-theme']
 * ("light" | "dark" | "auto", missing = auto = system). Never touches `data-theme`
 * or `prokom-theme` (panels).
 */
export const THEME_STORAGE_KEY = "pk-theme";
export const THEME_ATTR = "data-tech-theme";
export type ThemeChoice = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

/**
 * Inline script, first element of the public layout (no flash). Also exposes
 * window.__pkSetTheme(choice) used by ThemeToggle/MenuSheet and the e2e tests,
 * and follows the system theme while the choice is "auto".
 */
export const themeScript = `(function(){try{var K='${THEME_STORAGE_KEY}',A='${THEME_ATTR}',d=document.documentElement,mq=window.matchMedia('(prefers-color-scheme: dark)');
function c(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'?v:'auto'}catch(e){return 'auto'}}
function a(){var v=c();var r=v==='auto'?(mq.matches?'dark':'light'):v;d.setAttribute(A,r);d.setAttribute('data-tech-theme-choice',v);d.style.colorScheme=r;try{window.dispatchEvent(new CustomEvent('pk-theme',{detail:{choice:v,theme:r}}))}catch(e){}}
window.__pkSetTheme=function(v){try{if(v==='light'||v==='dark')localStorage.setItem(K,v);else localStorage.removeItem(K)}catch(e){}a()};
window.__pkGetTheme=function(){return {choice:c(),theme:d.getAttribute(A)||'light'}};
if(mq.addEventListener)mq.addEventListener('change',function(){if(c()==='auto')a()});a()}catch(e){}})();`;

declare global {
  interface Window {
    __pkSetTheme?: (choice: ThemeChoice) => void;
    __pkGetTheme?: () => { choice: ThemeChoice; theme: ResolvedTheme };
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

const VT_STYLE_ID = "t-vt-theme";
// ::view-transition pseudos live on the document root and cannot be scoped under .tech,
// so the rules are injected only for the moment of a theme switch on the public site.
const VT_CSS = `html.t-vt-theme::view-transition-old(root),html.t-vt-theme::view-transition-new(root){animation:none;mix-blend-mode:normal}
html.t-vt-theme::view-transition-new(root){animation:t-vt-circle 520ms cubic-bezier(.65,0,.35,1)}
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
  const after: ResolvedTheme = choice === "auto" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice;
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
