"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { pointPhone, telHref } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import type { VisiblePoint } from "@/lib/tech/points";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { ACCOUNT_HREF, POINTS_HREF, REPAIRS_HREF, SUBMIT_HREF, directionsUrl, inTriangle, isActive, mainNav, repairLinks, type NavItem, type Pt } from "@/lib/tech/nav";
import { submitHref, wizardDevices } from "@/lib/tech/wizard-data";
import { DeviceGlyph, IconArrow, IconChevronDown, IconPin, IconSearch, IconUser, IconWrench } from "./icons";
import { Logo } from "./Logo";
import { OpeningStatus } from "./OpeningStatus";
import { OsmMap } from "./OsmMap";
import { useShell } from "./ShellContext";
import { ThemeToggle } from "./ThemeToggle";
import { usePill } from "./usePill";

type Mega = NonNullable<NavItem["mega"]>;

/** PREMIUM §3: hover intent before opening, delay before closing, safe-triangle grace. */
export const OPEN_INTENT_MS = 80;
export const CLOSE_DELAY_MS = 250;
const TRIANGLE_GRACE_MS = 160;
const COMPACT_AT_PX = 24;

/**
 * Main capsule (design T.Naglowek, PREMIUM §3). ≥ 1024: sticky, narrows on scroll
 * (transform only), sliding pill under the hot/active item, mega menus in one shared
 * box (switches panels without closing), hover intent + safe triangle, full keyboard,
 * dimmed and blurred page under an open menu. < 1024: logo, "Zgłoś" and search; hides
 * on scroll down and returns on scroll up. Without JS the mega triggers are plain links.
 */
export function Capsule() {
  const pathname = usePathname() || "/";
  const { points, openSheet } = useShell();
  const [open, setOpen] = useState<Mega | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [js, setJs] = useState(false);
  /** Mega panels mount on the first pointer/focus visit to the menu (not on page load, not on phones). */
  const [armed, setArmed] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  /** Pointer position from the last mousemove over the capsule. Boundary events (mouseenter)
   * fire before the mousemove of the same step, so on entering a trigger this is still the
   * point the pointer came from: the safe triangle's apex. (The mouseleave coordinates are
   * already on the next trigger when the two touch, which made the triangle degenerate.) */
  const lastPt = useRef<Pt | null>(null);
  /** Where the open panel lands, relative to the capsule (the box slides there over 320 ms). */
  const megaTarget = useRef<{ x: number; w: number } | null>(null);
  /** Trigger under the pointer right now (the grace timer switches only if it still is). */
  const overMega = useRef<Mega | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<Mega, HTMLButtonElement | null>>>({});
  const uid = useId();

  useEffect(() => setJs(true), []);

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };
  const scheduleClose = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY_MS);
  }, []);

  /** Hover on a trigger: intent delay from closed; while open, switch at once unless
   * the pointer is travelling inside the safe triangle towards the open panel. */
  const hoverTrigger = (mega: Mega, at: Pt) => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    if (open === mega) return;
    if (!open) {
      openTimer.current = window.setTimeout(() => setOpen(mega), OPEN_INTENT_MS);
      return;
    }
    // aim at the panel's final place, not at the box mid-slide (frame timing must not matter)
    const panel = boxRef.current?.querySelector<HTMLElement>(".t-mega:not([hidden]) .t-mega__panel")?.getBoundingClientRect();
    const cap = rootRef.current;
    const target = megaTarget.current;
    const a = lastPt.current;
    if (panel && cap && target && a) {
      // target is in layout px; the compact capsule is scaled (transform), so scale it like the panel
      const r = cap.getBoundingClientRect();
      const s = cap.offsetWidth ? r.width / cap.offsetWidth : 1;
      const left = r.left + (cap.clientLeft + target.x) * s;
      if (inTriangle(at, a, { x: left, y: panel.top }, { x: left + target.w * s, y: panel.top })) {
        openTimer.current = window.setTimeout(() => {
          if (overMega.current === mega) setOpen(mega);
        }, TRIANGLE_GRACE_MS);
        return;
      }
    }
    setOpen(mega);
  };

  // close on route change, Esc (focus back to the trigger) and click outside
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      triggerRefs.current[open]?.focus();
    };
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
  useEffect(() => () => clearTimers(), []);

  // scroll: phones hide/show, desktop narrows
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
        setCompact(!mq.matches && y > COMPACT_AT_PX);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // shared box: animate to the open panel's size (switching without closing)
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !open) return;
    const panel = box.querySelector<HTMLElement>(`[data-mega="${open}"] .t-mega__panel`);
    const trigger = triggerRefs.current[open];
    if (!panel || !trigger) return;
    const cap = rootRef.current!.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const w = panel.offsetWidth;
    // under the trigger, kept inside the capsule's width
    const x = Math.max(0, Math.min(cap.width - w, t.left - cap.left - 24));
    box.style.setProperty("--mega-w", `${w}px`);
    box.style.setProperty("--mega-h", `${panel.offsetHeight}px`);
    box.style.setProperty("--mega-x", `${x}px`);
    megaTarget.current = { x, w };
  }, [open, points.length]);

  const activeKey = mainNav.find((n) => isActive(n, pathname))?.key ?? null;
  const pillKey = open ? mainNav.find((n) => n.mega === open)?.key ?? null : hot ?? activeKey;
  usePill(navRef, pillKey ? `[data-nav="${pillKey}"]` : "[data-nav-none]", [pillKey, js]);

  /** ←/→ across top-level items (an open menu follows), ↓/Enter/Space opens and focuses the panel. */
  const onNavKey = (e: ReactKeyboardEvent<HTMLElement>) => {
    const items = Array.from(navRef.current?.querySelectorAll<HTMLElement>("[data-nav]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = items[(i + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
      next.focus();
      const m = next.getAttribute("data-mega") as Mega | null;
      if (open) setOpen(m);
    } else if (e.key === "ArrowDown") {
      const m = items[i].getAttribute("data-mega") as Mega | null;
      if (!m) return;
      e.preventDefault();
      setOpen(m);
      focusPanel(m, 0);
    }
  };
  const focusPanel = (m: Mega, index: number) => {
    window.setTimeout(() => {
      const links = Array.from(boxRef.current?.querySelectorAll<HTMLElement>(`[data-mega="${m}"] a[href]`) ?? []);
      links.at(index)?.focus();
    }, prefersReducedMotion() ? 0 : 30);
  };
  /** ↑/↓ inside the open panel; ↑ from the first link returns to the trigger. */
  const onPanelKey = (e: ReactKeyboardEvent<HTMLElement>, m: Mega) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a[href]"));
    const i = links.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    if (e.key === "ArrowUp" && i <= 0) triggerRefs.current[m]?.focus();
    else links[Math.max(0, Math.min(links.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  return (
    <div className={`t-capwrap${hidden ? " is-hidden" : ""}${compact ? " is-compact" : ""}${open ? " is-mega" : ""}`}>
      <div className="t-megascrim" aria-hidden="true" onClick={() => setOpen(null)} />
      <div className="t-container">
        <header
          ref={rootRef}
          className="t-capsule"
          onMouseLeave={() => {
            lastPt.current = null; // coming back from outside must not reuse an old apex
            scheduleClose();
          }}
          onMouseEnter={() => window.clearTimeout(closeTimer.current)}
          onMouseMove={(e) => {
            lastPt.current = { x: e.clientX, y: e.clientY };
          }}
          onBlur={(e) => {
            if (open && !rootRef.current?.contains(e.relatedTarget as Node)) setOpen(null);
          }}
        >
          <Link href="/" className="t-capsule__logo" aria-label="PRO-KOM Tech — strona główna">
            <Logo size={28} />
          </Link>

          <nav
            ref={navRef}
            aria-label="Menu główne"
            className="t-capsule__nav t-navpills"
            onKeyDown={onNavKey}
            onMouseEnter={() => setArmed(true)}
            onFocus={() => setArmed(true)}
            onMouseLeave={() => setHot(null)}
          >
            <span className="t-pilltabs__pill t-navpill" aria-hidden="true" />
            {mainNav.map((item) => {
              const active = isActive(item, pathname);
              const cls = `t-navlink${active ? " is-active" : ""}`;
              if (!item.mega || !js) {
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cls}
                    aria-current={active ? "page" : undefined}
                    data-nav={item.key}
                    onMouseEnter={() => {
                      setHot(item.key);
                      if (open) scheduleClose();
                    }}
                    onFocus={() => setHot(item.key)}
                  >
                    {item.label}
                  </Link>
                );
              }
              const mega = item.mega;
              const isOpen = open === mega;
              return (
                <button
                  key={item.key}
                  ref={(el) => {
                    triggerRefs.current[mega] = el;
                  }}
                  type="button"
                  className={`${cls}${isOpen ? " is-open" : ""}`}
                  aria-expanded={isOpen}
                  aria-controls={`${uid}-${mega}`}
                  aria-current={active ? "page" : undefined}
                  data-nav={item.key}
                  data-mega={mega}
                  onMouseEnter={(e) => {
                    overMega.current = mega;
                    setHot(item.key);
                    hoverTrigger(mega, { x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    if (overMega.current === mega) overMega.current = null;
                  }}
                  onFocus={() => setHot(item.key)}
                  onClick={() => {
                    clearTimers();
                    setOpen(isOpen ? null : mega);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      clearTimers();
                      if (isOpen) setOpen(null);
                      else {
                        setOpen(mega);
                        focusPanel(mega, 0);
                      }
                    }
                  }}
                >
                  {item.label}
                  <IconChevronDown />
                </button>
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

          {js && (armed || open) ? (
            <div ref={boxRef} className={`t-megabox${open ? " is-open" : ""}`} data-open={open ?? undefined}>
              <div className="t-megabox__bg" aria-hidden="true" />
              {(["naprawy", "punkty"] as Mega[]).map((m) => (
                <div
                  key={m}
                  id={`${uid}-${m}`}
                  data-mega={m}
                  className={`t-mega${open === m ? " is-open" : ""}`}
                  hidden={open !== m}
                  onKeyDown={(e) => onPanelKey(e, m)}
                  onMouseEnter={() => window.clearTimeout(openTimer.current)}
                >
                  <div className="t-mega__panel">{m === "naprawy" ? <MegaRepairs /> : <MegaPoints points={points.filter((p) => !p.draft)} />}</div>
                </div>
              ))}
            </div>
          ) : null}
        </header>
      </div>
    </div>
  );
}

/** Devices with their three most common faults (wizard-data) + "Zgłoś naprawę online". */
function MegaRepairs() {
  return (
    <div className="t-mega__repairs">
      <ul className="t-mega__grid">
        {repairLinks.map((r, i) => {
          const dev = wizardDevices.find((d) => d.icon === r.icon);
          return (
            <li key={r.href} style={{ "--i": i } as CSSProperties}>
              <Link href={r.href} className="t-mega__device">
                <span className="t-mega__ico">
                  <DeviceGlyph icon={r.icon} />
                </span>
                <span className="t-mega__dtext">
                  <b>{r.label}</b>
                  {dev ? <span className="t-mega__faults">{dev.faults.slice(0, 3).join(" · ")}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="t-mega__aside" style={{ "--i": 8 } as CSSProperties}>
        <div className="t-mega__submit">
          <span className="t-eyb">Bez logowania</span>
          <b>Zgłoś naprawę online</b>
          <span>Wybierz urządzenie i usterkę — resztę ustalimy po diagnozie.</span>
          <Link href={SUBMIT_HREF} className="t-hbtn t-hbtn--acc t-mega__cta">
            Zgłoś naprawę <IconArrow />
          </Link>
        </div>
        <div className="t-mega__quick">
          {wizardDevices.slice(0, 2).map((d) => (
            <Link key={d.id} href={submitHref(d.category, d.faults[0])} className="t-mega__qlink">
              {d.label}: {d.faults[0].toLocaleLowerCase("pl-PL")}
              <IconArrow size={14} />
            </Link>
          ))}
          <Link href={REPAIRS_HREF} className="t-mega__more">
            Wszystkie naprawy <IconArrow />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Published points only (SPEC §5): live status, Nawiguj, Zadzwoń, mini map. */
function MegaPoints({ points }: { points: VisiblePoint[] }) {
  return (
    <>
      <ul className={`t-mega__points${points.length === 1 ? " is-single" : ""}`}>
        {points.map((p, i) => (
          <li key={p.key} className="t-mega__point" style={{ "--i": i } as CSSProperties}>
            <OsmMap sub={p.city} label={false} height={112} radius={14} className="t-mega__map" />
            <div className="t-mega__pbody">
              <b>{p.name}</b>
              <span>
                {p.street}, {p.postal} {p.city}
              </span>
              <OpeningStatus points={[p]} variant="pill" skeletonCh={18} />
              <span className="t-mega__hours">{hoursSummary(p)}</span>
              <div className="t-mega__pact">
                {p.geo ? (
                  <a href={directionsUrl(p.geo)} className="t-mega__pbtn" target="_blank" rel="noopener noreferrer" data-track="nawigacja_klik" data-track-punkt={p.key} data-track-aplikacja="google">
                    <IconPin size={15} /> Nawiguj
                  </a>
                ) : null}
                <a href={telHref(pointPhone(p))} className="t-mega__pbtn t-mega__tel" data-track="telefon_klik" data-track-miejsce="mega">
                  Zadzwoń {pointPhone(p).replace(/^\+48\s?/, "")}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="t-mega__foot" style={{ "--i": points.length } as CSSProperties}>
        <Link href={POINTS_HREF} className="t-mega__more">
          Punkty serwisowe — godziny i dojazd <IconArrow />
        </Link>
      </div>
    </>
  );
}
