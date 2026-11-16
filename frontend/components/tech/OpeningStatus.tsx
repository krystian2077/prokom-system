"use client";

import { useEffect, useRef, useState } from "react";
import type { ServicePoint } from "@/config/prokom";
import { getOpeningStatus, type OpeningStatus as Status } from "@/lib/tech/hours";

type Props = {
  /** One point, or several: then the one open / nearest to opening is shown. */
  points: ServicePoint[];
  /** Prefix the text with the point name (several points). */
  withName?: boolean;
  variant?: "text" | "pill";
  className?: string;
  /** Skeleton width before hydration (CLS = 0). */
  skeletonCh?: number;
};

function pick(points: ServicePoint[], now: Date): { point: ServicePoint; status: Status } | null {
  const all = points
    .map((point) => ({ point, status: getOpeningStatus(point, now) }))
    .filter((x): x is { point: ServicePoint; status: Status } => x.status !== null);
  if (!all.length) return null;
  return all.reduce((best, x) => (x.status.minutesToOpen < best.status.minutesToOpen ? x : best));
}

/**
 * Live "Otwarte do 17:00" (SPEC §12.1). Computed only in the browser after hydration
 * (no guessing on the server), refreshed every minute while visible.
 */
export function OpeningStatus({ points, withName = false, variant = "text", className, skeletonCh = 22 }: Props) {
  const [state, setState] = useState<{ point: ServicePoint; status: Status } | null | undefined>(undefined);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => setState(pick(points, new Date()));
    update();
    let timer: number | undefined;
    const start = () => {
      if (timer === undefined) timer = window.setInterval(update, 60_000);
    };
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const el = ref.current;
    const io =
      el && "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
              update();
              start();
            } else stop();
          })
        : null;
    if (io && el) io.observe(el);
    else start();
    return () => {
      stop();
      io?.disconnect();
    };
  }, [points]);

  const cls = `t-status t-status--${variant}${state?.status.isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`;
  if (state === undefined) {
    return <span ref={ref} className={`${cls} is-loading`} style={{ minWidth: `${skeletonCh}ch` }} aria-hidden="true" />;
  }
  if (state === null) return <span ref={ref} hidden />;
  const text = withName ? `${state.point.name}: ${state.status.text}` : state.status.text;
  return (
    <span ref={ref} className={cls} role="status" aria-live="off">
      <i className="t-status__dot" aria-hidden="true" />
      {text}
    </span>
  );
}
