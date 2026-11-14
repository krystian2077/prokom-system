"use client";

import { useId, useState } from "react";
import type { ServicePoint } from "@/config/prokom";
import { trackEvent } from "@/lib/tech/track-event";
import { IconArrowUpRight, IconPin } from "./icons";

type App = "google" | "apple" | "waze";

export function navigationLinks(geo: { lat: number; lng: number }): { app: App; label: string; href: string }[] {
  const ll = `${geo.lat},${geo.lng}`;
  return [
    { app: "google", label: "Mapy Google", href: `https://www.google.com/maps/dir/?api=1&destination=${ll}` },
    { app: "apple", label: "Mapy Apple", href: `https://maps.apple.com/?daddr=${ll}` },
    { app: "waze", label: "Waze", href: `https://waze.com/ul?ll=${ll}&navigate=yes` },
  ];
}

/**
 * "Nawiguj do punktu" (SPEC §12.8): on phones one button with the choice of app,
 * on larger screens a link to Google Maps. Renders nothing without coordinates.
 * The full variant with parkingNote comes with the points page (TD4).
 */
export function NavigateButtons({ point, dark = false }: { point: Pick<ServicePoint, "key" | "geo" | "parkingNote">; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!point.geo) return null;
  const links = navigationLinks(point.geo);
  const track = (app: App) => trackEvent("nawigacja_klik", { punkt: point.key, aplikacja: app });
  return (
    <div className={`t-navto${dark ? " t-navto--dark" : ""}`}>
      <a className="t-navto__desktop t-btn t-btn--sm t-btn--ghost" href={links[0].href} target="_blank" rel="noopener noreferrer" onClick={() => track("google")}>
        Wyznacz trasę <IconArrowUpRight />
      </a>
      <div className="t-navto__phone">
        <button type="button" className="t-btn t-btn--sm t-btn--ghost" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          <IconPin size={18} /> Nawiguj
        </button>
        <ul id={id} className="t-navto__list" hidden={!open}>
          {links.map((l) => (
            <li key={l.app}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => track(l.app)}>
                {l.label} <IconArrowUpRight />
              </a>
            </li>
          ))}
        </ul>
      </div>
      {point.parkingNote ? <p className="t-navto__note">{point.parkingNote}</p> : null}
    </div>
  );
}
