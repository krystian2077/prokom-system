"use client";

import { useEffect } from "react";
import { themeScript } from "@/lib/tech/theme";

/**
 * The inline theme script runs on full page loads only. After a client-side
 * navigation into the public site (e.g. from /client/login) React does not execute
 * inline <script> from the RSC payload, so we run the same script once here.
 */
export function ThemeBoot() {
  useEffect(() => {
    if (typeof window.__pkSetTheme === "function") return;
    try {
      new Function(themeScript)();
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
