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
function a(){var v=c();var r=v==='auto'?(mq.matches?'dark':'light'):v;d.setAttribute(A,r);d.setAttribute('data-tech-theme-choice',v);try{window.dispatchEvent(new CustomEvent('pk-theme',{detail:{choice:v,theme:r}}))}catch(e){}}
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
