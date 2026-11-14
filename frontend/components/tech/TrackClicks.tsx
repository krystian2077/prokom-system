"use client";

import { useEffect } from "react";
import { trackEvent, type TechEventName } from "@/lib/tech/track-event";

/**
 * Delegated click measurement for server-rendered links:
 * `<a data-track="telefon_klik" data-track-miejsce="stopka">` → trackEvent("telefon_klik", { miejsce: "stopka" }).
 * No-op without Umami.
 */
export function TrackClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-track]");
      if (!el) return;
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(el.dataset)) {
        if (k.startsWith("track") && k !== "track" && v) params[k.slice(5).toLowerCase()] = v;
      }
      (trackEvent as (n: TechEventName, p?: Record<string, string>) => void)(el.dataset.track as TechEventName, params);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
