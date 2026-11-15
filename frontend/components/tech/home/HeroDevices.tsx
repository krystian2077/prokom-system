"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/tech/motion";

/**
 * Hero product scene (>= 768): the laptop at the back, two single phones in front of it, all on one
 * lit floor with their own contact shadows. Each device floats on its own rhythm and its shadow
 * breathes with it; with a fine pointer the devices drift by depth (the front phone most).
 * Crops: scripts/tech/glowna-kadry.py (never upscaled). The laptop is the largest image above the
 * fold → the only `priority` one (LCP).
 */
export function HeroDevices() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const stage = el?.closest<HTMLElement>(".t-hero__stage");
    if (!el || !stage || prefersReducedMotion() || !window.matchMedia?.("(pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className="t-hero__devices" aria-hidden="true">
      <span className="t-hero__floor" />
      <span className="t-hero__shadow t-hero__shadow--laptop" />
      <span className="t-hero__shadow t-hero__shadow--samsung" />
      <span className="t-hero__shadow t-hero__shadow--iphone" />
      <span className="t-hero__dev t-hero__dev--laptop">
        <span className="t-hero__float">
          <Image src="/tech/urzadzenia/kadr-laptop.webp" alt="" width={608} height={414} priority unoptimized />
        </span>
      </span>
      <span className="t-hero__dev t-hero__dev--samsung">
        <span className="t-hero__float">
          <Image src="/tech/urzadzenia/hero-samsung.webp" alt="" width={269} height={549} unoptimized />
        </span>
      </span>
      <span className="t-hero__dev t-hero__dev--iphone">
        <span className="t-hero__float">
          <Image src="/tech/urzadzenia/hero-iphone.webp" alt="" width={242} height={493} unoptimized />
        </span>
      </span>
    </div>
  );
}
