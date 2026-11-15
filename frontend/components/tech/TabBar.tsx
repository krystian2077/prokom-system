"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { POINTS_HREF, SUBMIT_HREF, isActive, mainNav } from "@/lib/tech/nav";
import { DeviceGlyph, IconHome, IconMenu, IconPin, IconPlus } from "./icons";
import { useShell } from "./ShellContext";
import { usePill } from "./usePill";

/** Phone / tablet portrait bottom bar (RESPONSYWNOSC §2): Start · Naprawy · Zgłoś · Punkty · Menu.
 * Glass background, a sliding pill under the active tab and a raised "Zgłoś" (PREMIUM §3). */
export function TabBar() {
  const pathname = usePathname() || "/";
  const { sheet, openSheet } = useShell();
  const repairs = mainNav.find((n) => n.key === "naprawy")!;
  const points = mainNav.find((n) => n.key === "punkty")!;
  const on = {
    start: pathname === "/" && !sheet,
    naprawy: sheet === "naprawy" || (!sheet && isActive(repairs, pathname)),
    punkty: !sheet && isActive(points, pathname),
    menu: sheet === "menu",
  };
  const ref = useRef<HTMLElement>(null);
  const onKey = (Object.keys(on) as (keyof typeof on)[]).find((k) => on[k]) ?? "none";
  usePill(ref, `[data-tab="${onKey}"]`, [onKey]);
  return (
    <nav ref={ref} className="t-tabbar" aria-label="Nawigacja" data-t-tabbar="">
      <span className="t-tabbar__pill" aria-hidden="true" />
      <Link href="/" data-tab="start" className={on.start ? "is-on" : undefined} aria-current={on.start ? "page" : undefined}>
        <IconHome />
        Start
      </Link>
      <button type="button" data-tab="naprawy" className={on.naprawy ? "is-on" : undefined} aria-haspopup="dialog" aria-expanded={sheet === "naprawy"} onClick={(e) => openSheet("naprawy", e.currentTarget)}>
        <DeviceGlyph icon="phone" size={21} />
        Naprawy
      </button>
      <Link href={SUBMIT_HREF} className="t-tabbar__mid" aria-label="Zgłoś naprawę" aria-current={pathname === SUBMIT_HREF ? "page" : undefined}>
        <IconPlus />
      </Link>
      <Link href={POINTS_HREF} data-tab="punkty" className={on.punkty ? "is-on" : undefined} aria-current={on.punkty ? "page" : undefined}>
        <IconPin size={21} />
        Punkty
      </Link>
      <button type="button" data-tab="menu" className={on.menu ? "is-on" : undefined} aria-haspopup="dialog" aria-expanded={sheet === "menu"} onClick={(e) => openSheet("menu", e.currentTarget)}>
        <IconMenu />
        Menu
      </button>
    </nav>
  );
}
