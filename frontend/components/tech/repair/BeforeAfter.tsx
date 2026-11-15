"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { deviceById, sceneOf } from "@/lib/tech/wizard-data";
import { FaultVisual } from "../subhero/FaultVisual";

/**
 * "Przed i po" on repair pages: the same wizard photo twice — the fault effect as a still
 * poster (before) over the clean device (after) — with a drag/keyboard slider between them.
 * The first time it enters the viewport the divider sweeps once to show it can be moved
 * (not with reduced motion). The slider is a native range input (keyboard, screen reader).
 */
export function BeforeAfter({ device, fault }: { device: string; fault: string }) {
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const userMoved = useRef(false);
  const rest = useRef(50);

  // rest position: the divider splits the fault region (e.g. the crack) in half
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const d = deviceById(device);
    const sc = sceneOf(d, fault);
    const centre = sc.region[0] + sc.region[2] / 2; // % of the crop frame
    const measure = () => {
      const stage = el.querySelector<HTMLElement>(".t-ba__stage");
      const frame = el.querySelector<HTMLElement>(".t-ba__layer--after .t-fault__frame");
      if (!stage || !frame) return;
      const s0 = stage.getBoundingClientRect();
      const f0 = frame.getBoundingClientRect();
      if (!s0.width) return;
      const p = ((f0.left + (f0.width * centre) / 100 - s0.left) / s0.width) * 100;
      rest.current = Math.min(82, Math.max(18, p));
      if (!userMoved.current) setPos(rest.current);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [device, fault]);

  // one gentle sweep around the rest position the first time it is seen
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (typeof window.IntersectionObserver !== "function") return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const D = 1700;
        const step = (t: number) => {
          if (userMoved.current) return;
          const k = Math.min(1, (t - t0) / D);
          setPos(rest.current + Math.sin(k * Math.PI * 2) * (1 - k * 0.15) * 16);
          if (k < 1) raf = requestAnimationFrame(step);
          else setPos(rest.current);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`t-ba${touched ? " is-touched" : ""}`} style={{ "--pos": `${pos}%` } as CSSProperties}>
      <div className="t-ba__stage">
        <div className="t-ba__layer t-ba__layer--after">
          <FaultVisual device={device} faults={[fault]} mode="fixed" tags={false} lazy />
        </div>
        <div className="t-ba__layer t-ba__layer--before">
          <FaultVisual device={device} faults={[fault]} mode="poster" tags={false} lazy />
        </div>
        <span className="t-ba__label t-ba__label--before" aria-hidden="true">
          <i /> Przed: {fault.toLocaleLowerCase("pl-PL")}
        </span>
        <span className="t-ba__label t-ba__label--after" aria-hidden="true">
          <i /> Po naprawie
        </span>
        <input
          className="t-ba__range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(pos)}
          aria-label="Porównaj sprzęt przed naprawą i po naprawie"
          aria-valuetext={`${Math.round(pos)}% widoku przed naprawą`}
          onChange={(e) => {
            userMoved.current = true;
            setTouched(true);
            setPos(Number(e.target.value));
          }}
        />
        <span className="t-ba__handle" aria-hidden="true">
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      </div>
    </div>
  );
}
