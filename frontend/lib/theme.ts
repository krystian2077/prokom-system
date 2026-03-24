/** Motyw panelu — PROKOM_DOKUMENTACJA_FRONTEND.md §2.5 */

const STORAGE_KEY = "prokom-theme";

export function initTheme(): void {
  if (typeof document === "undefined") return;
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const system =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  document.documentElement.setAttribute("data-theme", saved || system);
}

export function toggleTheme(): void {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const next = isLight ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE_KEY, next);
}

export function getTheme(): "dark" | "light" {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "light" ? "light" : "dark";
}
