"use client";

import { useEffect } from "react";
import { SW_EXCLUDED_PREFIXES, SW_PATH } from "@/lib/tech/pwa";
import { trackEvent } from "@/lib/tech/track-event";

/**
 * Registers the offline-only service worker on public pages, after `load` (SPEC §12.2).
 * NEXT_PUBLIC_TECH_SW=0 unregisters it instead (kill switch, docs/tech/WDROZENIE.md).
 */
export function SwRegister() {
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("src") === "pwa") trackEvent("pwa_start");
    } catch {
      /* ignore */
    }
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // The public 404 also renders for unknown panel URLs (catch-all) — never register there.
    const path = window.location.pathname;
    if (SW_EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return;
    if (process.env.NEXT_PUBLIC_TECH_SW === "0") {
      void navigator.serviceWorker.getRegistrations().then((list) => list.forEach((r) => void r.unregister()));
      return;
    }
    const register = () => void navigator.serviceWorker.register(SW_PATH, { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}
