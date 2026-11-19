"use client";

import { useEffect } from "react";

const MAX_DEG = 6;

/**
 * Model cards tilt towards the pointer (runda 18.11 v2 §3 „karty modeli z przechyłem przy kursorze”):
 * one delegated listener for every `.t-mcard__link` on the page, only for a mouse on a device that
 * hovers and without reduced motion. The card gets --rx/--ry; CSS does the 3D transform.
 */
export function CardTilt() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches || document.documentElement.hasAttribute("data-tech-reduced")) return;
    let card: HTMLElement | null = null;
    let frame = 0;
    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      el.removeAttribute("data-tilt");
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.(".t-mcard__link") as HTMLElement | null;
      if (el !== card) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        reset(card);
        card = el;
      }
      if (!el) return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (card !== el) return; // the pointer left before this frame
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${(x * MAX_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * MAX_DEG * 2).toFixed(2)}deg`);
        el.setAttribute("data-tilt", "");
      });
    };
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      reset(card);
      card = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      reset(card);
    };
  }, []);
  return null;
}
