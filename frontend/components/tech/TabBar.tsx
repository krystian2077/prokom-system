"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { POINTS_HREF, SUBMIT_HREF, isActive, mainNav } from "@/lib/tech/nav";
import { DeviceGlyph, IconHome, IconMenu, IconPin, IconPlus } from "./icons";
import { useShell } from "./ShellContext";

/** Phone / tablet portrait bottom bar (RESPONSYWNOSC §2): Start · Naprawy · Zgłoś · Punkty · Menu. */
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
  return (
    <nav className="t-tabbar" aria-label="Nawigacja" data-t-tabbar="">
      <Link href="/" className={on.start ? "is-on" : undefined} aria-current={on.start ? "page" : undefined}>
        <IconHome />
        Start
      </Link>
      <button type="button" className={on.naprawy ? "is-on" : undefined} aria-haspopup="dialog" aria-expanded={sheet === "naprawy"} onClick={(e) => openSheet("naprawy", e.currentTarget)}>
        <DeviceGlyph icon="phone" size={21} />
        Naprawy
      </button>
      <Link href={SUBMIT_HREF} className="t-tabbar__mid" aria-label="Zgłoś naprawę" aria-current={pathname === SUBMIT_HREF ? "page" : undefined}>
        <IconPlus />
      </Link>
      <Link href={POINTS_HREF} className={on.punkty ? "is-on" : undefined} aria-current={on.punkty ? "page" : undefined}>
        <IconPin size={21} />
        Punkty
      </Link>
      <button type="button" className={on.menu ? "is-on" : undefined} aria-haspopup="dialog" aria-expanded={sheet === "menu"} onClick={(e) => openSheet("menu", e.currentTarget)}>
        <IconMenu />
        Menu
      </button>
    </nav>
  );
}
