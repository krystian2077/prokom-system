"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { pointPhone, telHref } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import type { VisiblePoint } from "@/lib/tech/points";
import { ACCOUNT_HREF, POINTS_HREF, REPAIRS_HREF, SUBMIT_HREF, isActive, mainNav, repairLinks, type NavItem } from "@/lib/tech/nav";
import { DeviceGlyph, IconArrow, IconChevronDown, IconSearch, IconUser, IconWrench } from "./icons";
import { Logo } from "./Logo";
import { OpeningStatus } from "./OpeningStatus";
import { useShell } from "./ShellContext";
import { ThemeToggle } from "./ThemeToggle";

const CLOSE_DELAY = 250;

/**
 * Main capsule (design T.Naglowek). ≥ 1024: full menu with mega menus (hover with a
 * bridge under the cursor and a close delay, click and keyboard too). < 1024: logo,
 * "Zgłoś" and search; hides while scrolling down and returns on scroll up.
 */
export function Capsule() {
  const pathname = usePathname() || "/";
  const { points, openSheet } = useShell();
  const [open, setOpen] = useState<NavItem["mega"] | null>(null);
  const [hidden, setHidden] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLElement>(null);
  const uid = useId();

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY);
  }, []);

  // close on route change, Esc and click outside
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // phone/tablet: hide on scroll down, show on scroll up
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (!mq.matches || y < 80) setHidden(false);
        else if (Math.abs(y - last) > 6) setHidden(y > last);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`t-capwrap${hidden ? " is-hidden" : ""}`}>
      <div className="t-container">
        <header ref={rootRef} className="t-capsule" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
          <Link href="/" className="t-capsule__logo" aria-label="PRO-KOM Tech — strona główna">
            <Logo size={28} />
          </Link>

          <nav aria-label="Menu główne" className="t-capsule__nav">
            {mainNav.map((item) => {
              const active = isActive(item, pathname);
              if (!item.mega) {
                return (
                  <Link key={item.key} href={item.href} className={`t-navlink${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                );
              }
              const panelId = `${uid}-${item.mega}`;
              const isOpen = open === item.mega;
              return (
                <div
                  key={item.key}
                  className="t-navitem"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpen(item.mega!);
                  }}
                >
                  <button
                    type="button"
                    className={`t-navlink${active ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(isOpen ? null : item.mega!)}
                  >
                    {item.label}
                    <IconChevronDown />
                  </button>
                  <div id={panelId} className={`t-mega${isOpen ? " is-open" : ""}`} hidden={!isOpen}>
                    <div className="t-mega__panel">
                      {item.mega === "naprawy" ? <MegaRepairs /> : <MegaPoints points={points} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="t-capsule__actions">
            <Link href={ACCOUNT_HREF} className="t-pillbtn t-capsule__account" aria-label="Konto klienta">
              <IconUser />
              <span>Konto</span>
            </Link>
            <span className="t-capsule__theme">
              <ThemeToggle />
            </span>
            <Link href={SUBMIT_HREF} className="t-cta">
              <IconWrench />
              <span className="t-cta__long">Zgłoś naprawę</span>
              <span className="t-cta__short">Zgłoś</span>
            </Link>
            <button type="button" className="t-iconbtn t-capsule__search" aria-label="Szukaj" onClick={(e) => openSheet("szukaj", e.currentTarget)}>
              <IconSearch />
            </button>
          </div>
        </header>
      </div>
    </div>
  );

}

function MegaRepairs() {
  return (
    <>
      <ul className="t-mega__grid">
        {repairLinks.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="t-mega__device">
              <span className="t-mega__ico">
                <DeviceGlyph icon={r.icon} />
              </span>
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="t-mega__foot">
        <Link href={REPAIRS_HREF} className="t-mega__more">
          Wszystkie naprawy <IconArrow />
        </Link>
        <Link href={SUBMIT_HREF} className="t-mega__more t-mega__more--acc">
          Zgłoś naprawę online <IconArrow />
        </Link>
      </div>
    </>
  );
}

function MegaPoints({ points }: { points: VisiblePoint[] }) {
  return (
    <>
      <ul className="t-mega__points">
        {points.map((p) => (
          <li key={p.key} className={`t-mega__point${p.draft ? " t-draft" : ""}`}>
            <b>{p.name}</b>
            {p.draft ? <span className="t-draft-badge">do uzupełnienia</span> : null}
            <span>
              {p.street}, {p.postal} {p.city}
            </span>
            <OpeningStatus points={[p]} variant="pill" skeletonCh={18} />
            <span className="t-mega__hours">{hoursSummary(p)}</span>
            <a href={telHref(pointPhone(p))} className="t-mega__tel">
              {pointPhone(p).replace(/^\+48\s?/, "")}
            </a>
          </li>
        ))}
      </ul>
      <div className="t-mega__foot">
        <Link href={POINTS_HREF} className="t-mega__more">
          Punkty serwisowe <IconArrow />
        </Link>
      </div>
    </>
  );
}

