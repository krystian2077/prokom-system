"use client";

import { useEffect } from "react";
import { applyThemeColor, getTechTheme, themeScript } from "@/lib/tech/theme";
import { withoutThemeParam } from "@/lib/tech/theme-carry";

/**
 * The inline theme script runs on full page loads only. After a client-side
 * navigation into the public site (e.g. from /client/login) React does not execute
 * inline <script> from the RSC payload, so we run the same script once here.
 * Also keeps <meta name="theme-color"> in step with the public theme and restores
 * the previous value (and html color-scheme) when the public layout unmounts, so the
 * panels look exactly as before (SPEC §2).
 */
export function ThemeBoot() {
  useEffect(() => {
    if (typeof window.__pkSetTheme !== "function") {
      try {
        new Function(themeScript)();
      } catch {
        /* ignore */
      }
    }
    // ?motyw from another PRO-KOM line was read by the head script; drop it from the address now.
    // Next 14.2 App Router patches history.replaceState and syncs usePathname/useSearchParams — but
    // only when the state has no `__NA` flag, so pass null (not history.state): Next copies its own
    // internal state in. No router.replace — that would fetch the RSC payload again.
    const clean = withoutThemeParam(window.location.href);
    if (clean !== null) window.history.replaceState(null, "", clean);
    const prev = applyThemeColor(getTechTheme().theme);
    const added = document.querySelector('meta[name="theme-color"][data-tech]');
    const onTheme = () => applyThemeColor(getTechTheme().theme);
    window.addEventListener("pk-theme", onTheme);
    return () => {
      window.removeEventListener("pk-theme", onTheme);
      document.documentElement.style.removeProperty("color-scheme");
      if (added) added.remove();
      else if (prev !== null) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", prev);
    };
  }, []);
  return null;
}
