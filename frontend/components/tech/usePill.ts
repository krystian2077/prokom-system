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
    // Web fonts swap in after the first paint and shift the items (Blog: 384 → 420 px);
    // place the pill again without the slide, so it does not glide across the nav on load.
    let alive = true;
    // Only while fonts are still loading: later deps changes (hover) must keep the slide.
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => {
      if (!alive || !box.isConnected) return;
      box.removeAttribute("data-pill-ready");
      measure();
      void box.offsetHeight; // commit the new position before the transition is re-enabled
    });
    if (typeof ResizeObserver !== "function") {
      return () => {
        alive = false;
      };
    }
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => {
      alive = false;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are passed by the caller
  }, deps);
}
