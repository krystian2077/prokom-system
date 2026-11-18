"use client";

import { useEffect } from "react";
import { carryHref } from "@/lib/tech/theme-carry";
import { getTechTheme } from "@/lib/tech/theme";

/**
 * One global listener (MOTYW-PASEK-LINII §3.2): a click or middle click on a link to another PRO-KOM
 * domain carries the current choice as ?motyw=…, then the original href comes back right away.
 */
export function ThemeCarry() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const original = a.getAttribute("href")!;
      const next = carryHref(original, window.location.host, getTechTheme().choice);
      if (!next) return;
      a.setAttribute("href", next);
      window.setTimeout(() => a.setAttribute("href", original), 0);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);
  return null;
}
