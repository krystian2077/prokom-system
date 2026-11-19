"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { pointPhone, telHref } from "@/config/prokom";
import { hoursSummary } from "@/lib/tech/hours";
import type { VisiblePoint } from "@/lib/tech/points";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { brandLinks } from "@/lib/tech/brand-links";
import { courierPageHref } from "@/lib/tech/courier";
import { ACCOUNT_HREF, POINTS_HREF, PREP_GUIDE_HREF, PREP_GUIDE_READY, REPAIRS_HREF, SUBMIT_HREF, TRACK_HREF, directionsUrl, inTriangle, isActive, mainNav, repairLinks, type NavItem, type Pt } from "@/lib/tech/nav";
import { requestSearch } from "@/lib/tech/search/open";
import { submitHref, wizardDevices } from "@/lib/tech/wizard-data";
import { DeviceGlyph, IconArrow, IconChevronDown, IconPin, IconSearch, IconUser, IconWrench } from "./icons";
import { Logo } from "./Logo";
import { EnquiryBadge, EnquiryLink } from "./catalog/EnquiryLink";
import { SALES_HREF, salesColumns } from "@/lib/tech/catalog/nav";
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
const noSubscription = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Main capsule (design T.Naglowek, PREMIUM §3). Sticky to the whole page on every width; hides
 * on scroll down and returns on scroll up (not while a mega menu is open or focus is inside).
 * ≥ 1024: narrows on scroll (transform only), sliding pill under the hot/active item, mega menus
 * in one shared box (switches panels without closing), hover intent + safe triangle, full
 * keyboard, dimmed and blurred page under an open menu. < 1024: logo, "Zgłoś" and search.
 * Without JS the mega triggers are plain links.
 */
export function Capsule() {
  const pathname = usePathname() || "/";
  const { points } = useShell();
  const mac = useSyncExternalStore(noSubscription, isMac, () => false);
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

  // An open mega menu or focus inside the capsule keeps it on screen (it must not slip away from
  // under the pointer or the keyboard). Read inside the scroll handler through a ref.
  const holdRef = useRef(false);
  holdRef.current = open !== null;

  // scroll (runda 18.11 §1.1): hides going down and returns going up on every width; ≥ 1024 also narrows
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const held = holdRef.current || !!rootRef.current?.contains(document.activeElement);
        if (y < 80 || held) setHidden(false);
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
    // The panels take the capsule's full width (layout px: the compact capsule is only scaled)
    // and the box grows to the open panel's height, so Naprawy ↔ Punkty animates the height only.
    const measure = () => {
      const w = rootRef.current!.clientWidth;
      box.style.setProperty("--mega-panel-w", `${w}px`);
      box.style.setProperty("--mega-w", `${w}px`);
      box.style.setProperty("--mega-h", `${panel.offsetHeight}px`);
      box.style.setProperty("--mega-x", "0px");
      megaTarget.current = { x: 0, w };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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
      const links = Array.from(boxRef.current?.querySelectorAll<HTMLElement>(`[data-mega="${m}"] a[data-mega-nav]`) ?? []);
      links.at(index)?.focus();
    }, prefersReducedMotion() ? 0 : 30);
  };
  /** ↑/↓ inside the open panel; ↑ from the first link returns to the trigger. */
  const onPanelKey = (e: ReactKeyboardEvent<HTMLElement>, m: Mega) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    // main entries only (device tiles, cards, the bottom bar); from a fault link the step starts at its tile
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a[data-mega-nav]"));
    const active = document.activeElement as HTMLElement | null;
    const from = active?.closest<HTMLElement>("[data-mega-tile]")?.querySelector<HTMLElement>("a[data-mega-nav]") ?? active;
    const i = links.indexOf(from as HTMLElement);
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
                    aria-label={item.short ? item.label : undefined}
                    onMouseEnter={() => {
                      setHot(item.key);
                      if (open) scheduleClose();
                    }}
                    onFocus={() => setHot(item.key)}
                  >
                    {item.short ?? item.label}
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
                  aria-label={item.short ? item.label : undefined}
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
                  {item.short ?? item.label}
                  {item.key === "sprzedaz" ? <EnquiryBadge /> : null}
                  <IconChevronDown />
                </button>
              );
            })}
          </nav>

          <div className="t-capsule__actions">
            <button type="button" className="t-capsearch" onClick={() => requestSearch()} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K /">
              <IconSearch size={18} />
              {/* The name comes from the content (WCAG 2.5.3); the shortcut is shown, not read out. */}
              <span className="t-capsearch__label">Szukaj</span>
              <kbd className="t-capsearch__kbd" aria-hidden="true">
                {mac ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>
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
            <button type="button" className="t-iconbtn t-capsule__search" aria-label="Szukaj" aria-haspopup="dialog" onClick={() => requestSearch()}>
              <IconSearch />
            </button>
          </div>

          {js && (armed || open) ? (
            <div ref={boxRef} className={`t-megabox${open ? " is-open" : ""}`} data-open={open ?? undefined}>
              <div className="t-megabox__bg" aria-hidden="true" />
              {(["naprawy", "sprzedaz", "punkty"] as Mega[]).map((m) => (
                <div
                  key={m}
                  id={`${uid}-${m}`}
                  data-mega={m}
                  className={`t-mega${open === m ? " is-open" : ""}`}
                  hidden={open !== m}
                  onKeyDown={(e) => onPanelKey(e, m)}
                  onMouseEnter={() => window.clearTimeout(openTimer.current)}
                >
                  <div className="t-mega__panel">{m === "naprawy" ? <MegaRepairs /> : m === "sprzedaz" ? <MegaSales /> : <MegaPoints points={points.filter((p) => !p.draft)} />}</div>
                </div>
              ))}
            </div>
          ) : null}
        </header>
      </div>
    </div>
  );
}

/**
 * „Naprawy” on the capsule's full width (PREMIUM §3.2): a grid of device tiles — a large icon,
 * the name and the three most common faults as links (a live repair page, else the form with the
 * fault filled in) — the „Zgłoś naprawę online” card with a glow, the courier card once published,
 * and a bar of links at the bottom. ↑/↓ walk the tiles, cards and bar; Tab reaches the faults.
 */
function MegaRepairs() {
  const { faultPages } = useShell();
  const courier = courierPageHref();
  let n = 0;
  return (
    <div className="t-mega__repairs">
      <ul className="t-mega__grid">
        {repairLinks.map((r) => {
          const dev = wizardDevices.find((d) => d.icon === r.icon);
          return (
            <li key={r.href} className="t-mega__tile" data-mega-tile="" style={{ "--i": n++ } as CSSProperties}>
              <Link href={r.href} className="t-mega__device" data-mega-nav="">
                <span className="t-mega__ico">
                  <DeviceGlyph icon={r.icon} size={26} strokeWidth={1.9} />
                </span>
                <b>{r.label}</b>
                <IconArrow size={14} className="t-mega__go" />
              </Link>
              {dev ? (
                <ul className="t-mega__faults" aria-label={`Najczęstsze usterki: ${r.label.replace(/^Serwis /, "")}`}>
                  {dev.faults.slice(0, 3).map((f) => (
                    <li key={f}>
                      <Link href={faultPages[`${dev.category}:${f}`] ?? submitHref(dev.category, f)}>{f}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="t-mega__aside">
        <div className="t-mega__submit" style={{ "--i": n++ } as CSSProperties}>
          <span className="t-eyb">Bez logowania · kilka minut</span>
          <b>Zgłoś naprawę online</b>
          <span>Wybierz urządzenie i usterkę. Wycenę dostaniesz po diagnozie, przed naprawą.</span>
          <Link href={SUBMIT_HREF} className="t-hbtn t-hbtn--acc t-mega__cta" data-mega-nav="">
            Zgłoś naprawę <IconArrow />
          </Link>
        </div>
        {courier ? (
          <Link href={courier} className="t-mega__card" data-mega-nav="" style={{ "--i": n++ } as CSSProperties}>
            <span className="t-mega__cico">
              <IconTruck />
            </span>
            <span className="t-mega__ctext">
              <b>Naprawa wysyłkowa</b>
              <span>Nie możesz przyjechać? Wyślij sprzęt kurierem do salonu.</span>
            </span>
            <IconArrow size={14} className="t-mega__go" />
          </Link>
        ) : null}
      </div>
      <nav className="t-mega__bar" aria-label="Więcej o naprawach" style={{ "--i": n++ } as CSSProperties}>
        <Link href={REPAIRS_HREF} className="t-mega__more" data-mega-nav="">
          Wszystkie naprawy <IconArrow />
        </Link>
        <Link href={TRACK_HREF} className="t-mega__barlink" data-mega-nav="">
          Status naprawy
        </Link>
        {PREP_GUIDE_READY ? (
          <Link href={PREP_GUIDE_HREF} className="t-mega__barlink" data-mega-nav="">
            Jak przygotować sprzęt
          </Link>
        ) : null}
        <span className="t-mega__brands">
          <span className="t-mega__brandslbl">Marki:</span>
          {brandLinks.map((b, i) => (
            <span key={b.href} className="t-mega__brand">
              {i ? <span aria-hidden="true">·</span> : null}
              <Link href={b.href} className="t-mega__barlink" data-mega-nav="" aria-label={`Serwis ${b.label}`}>
                {b.label}
              </Link>
            </span>
          ))}
        </span>
      </nav>
    </div>
  );
}

/** „Punkty serwisowe” in the same width: two large salon cards (published only, SPEC §5). */
function MegaPoints({ points }: { points: VisiblePoint[] }) {
  return (
    <div className="t-mega__pointsw">
      <ul className={`t-mega__points${points.length === 1 ? " is-single" : ""}`}>
        {points.map((p, i) => (
          <li key={p.key} className="t-mega__point" style={{ "--i": i } as CSSProperties}>
            <OsmMap sub={p.city} label={false} height={210} radius={0} className="t-mega__map" />
            <div className="t-mega__pbody">
              <span className="t-eyb">Salon</span>
              <b>{p.name}</b>
              <OpeningStatus points={[p]} variant="pill" skeletonCh={18} />
              <span className="t-mega__addr">
                {p.street},{" "}
                <span>
                  {p.postal} {p.city}
                </span>
              </span>
              <span className="t-mega__hours">{hoursSummary(p)}</span>
              {p.parkingNote ? <span className="t-mega__park">{p.parkingNote}</span> : null}
              <div className="t-mega__pact">
                {p.geo ? (
                  <a href={directionsUrl(p.geo)} className="t-mega__pbtn" target="_blank" rel="noopener noreferrer" data-mega-nav="" data-track="nawigacja_klik" data-track-punkt={p.key} data-track-aplikacja="google">
                    <IconPin size={15} /> Nawiguj
                  </a>
                ) : null}
                <a href={telHref(pointPhone(p))} className="t-mega__pbtn t-mega__tel" data-mega-nav="" data-track="telefon_klik" data-track-miejsce="mega">
                  Zadzwoń {pointPhone(p).replace(/^\+48\s?/, "")}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <nav className="t-mega__bar" aria-label="Więcej o punktach" style={{ "--i": points.length } as CSSProperties}>
        <Link href={POINTS_HREF} className="t-mega__more" data-mega-nav="">
          Punkty serwisowe — godziny i dojazd <IconArrow />
        </Link>
        <Link href="/obslugiwane-miejscowosci" className="t-mega__barlink" data-mega-nav="">
          Obsługiwane miejscowości
        </Link>
        <Link href="/kontakt" className="t-mega__barlink" data-mega-nav="">
          Kontakt
        </Link>
      </nav>
    </div>
  );
}

/**
 * „Sprzedaż” (runda 18.11 v2 §2, redesign 19.11): two salon tiles with a hero product and the
 * departments, and an aside with the way into the whole catalogue, the newest models and the
 * enquiry. Data from the server (ShellContext.sales) — no catalogue in the client bundle. No prices.
 */
function MegaSales() {
  const { sales } = useShell();
  const fallback = salesColumns();
  const salons = sales?.salons ?? fallback.map((c) => ({ brand: c.brand, title: c.title, href: c.salon, img: null, transparent: false, bg: null, departments: c.links }));
  let n = 0;
  return (
    <div className="t-mega__sales">
      {salons.map((s) => (
        <div key={s.brand} className={`t-msalon t-msalon--${s.brand}`} style={{ "--i": n++ } as CSSProperties}>
          <Link href={s.href} className="t-msalon__main" data-mega-nav="">
            <span className="t-msalon__kick">Salon</span>
            <b className="t-msalon__title">{s.title}</b>
            <span className="t-msalon__go">
              Wejdź do salonu <IconArrow size={14} />
            </span>
            {s.img ? (
              <span className={`t-msalon__img${s.transparent ? " is-cutout" : ""}`} style={s.bg ? ({ "--photo-bg": s.bg } as CSSProperties) : undefined}>
                <Image src={s.img} alt="" width={260} height={260} sizes="200px" />
              </span>
            ) : null}
          </Link>
          <ul className="t-msalon__depts" aria-label={`Działy: ${s.title}`}>
            {s.departments.map((d) => (
              <li key={d.href}>
                <Link href={d.href}>{d.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="t-msales__aside" style={{ "--i": n++ } as CSSProperties}>
        <Link href={SALES_HREF} className="t-msales__all" data-mega-nav="">
          <span className="t-msales__allt">Cały katalog</span>
          <span className="t-msales__alls">{sales ? `${sales.count} modeli · ` : ""}Apple i Samsung · filtry i porównanie</span>
          <span className="t-msales__allgo" aria-hidden="true">
            <IconArrow size={18} strokeWidth={2.6} />
          </span>
        </Link>
        {sales?.newest.length ? (
          <div className="t-msales__new">
            <span className="t-eyb">Nowości</span>
            <ul>
              {sales.newest.slice(0, 4).map((m) => (
                <li key={m.href}>
                  <Link href={m.href} data-mega-nav="">
                    <span className={`t-msales__thumb${m.transparent ? " is-cutout" : ""}`} style={m.bg ? ({ "--photo-bg": m.bg } as CSSProperties) : undefined}>
                      {m.img ? <Image src={m.img} alt="" width={56} height={56} sizes="56px" /> : null}
                    </span>
                    <span>{m.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="t-msales__enq">
          <span>Bez cen na stronie — zapytaj, odpowiemy z ceną i dostępnością.</span>
          <EnquiryLink className="t-msales__enqbtn" label="Twoje zapytanie" megaNav />
        </div>
      </div>
    </div>
  );
}

function IconTruck() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
  );
}
