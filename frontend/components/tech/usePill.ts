"use client";

import { useLayoutEffect, useEffect, type RefObject } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Sliding pill under the active item of a group (PREMIUM §1 "zakładki z pigułką").
 * Writes `--pill-x`, `--pill-y`, `--pill-w`, `--pill-h` on the container from the
 * active child's box; CSS (`.t-pilltabs__pill` and friends) animates the transform.
 * `activeSelector` picks the active child, `deps` re-measure (e.g. the selected value).
 */
export function usePill(ref: RefObject<HTMLElement>, activeSelector: string, deps: unknown[]): void {
  useIsoLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const measure = () => {
      const active = box.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        box.style.setProperty("--pill-w", "0px");
        return;
      }
      box.style.setProperty("--pill-x", `${active.offsetLeft}px`);
      box.style.setProperty("--pill-y", `${active.offsetTop}px`);
      box.style.setProperty("--pill-w", `${active.offsetWidth}px`);
      box.style.setProperty("--pill-h", `${active.offsetHeight}px`);
      // enable the slide only after the first placement (no fly-in from 0 on load)
      if (!box.hasAttribute("data-pill-ready")) requestAnimationFrame(() => box.setAttribute("data-pill-ready", ""));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed by the caller
  }, deps);
}
