"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { prefersReducedMotion } from "@/lib/tech/motion";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { HOME_SECTIONS, RAIL_MIN_SECTIONS, RAIL_QUERY, activeSection, glideTo, railIcon, railLineEnd, railProgress, sectionsCount, type RailIconName } from "@/lib/tech/rail";
import { requestSearch } from "@/lib/tech/search/open";
import { IconSearch, IconWrench } from "./icons";
import { IconToTop, RailIcon } from "./rail-icons";

type Section = { id: string; label: string; icon: RailIconName };

const HOME_OPEN_KEY = "pk-tech-rail-home";
const PULSE_KEY = "pk-tech-rail-pulse";
/** More entries than this and the „Na tej stronie” list scrolls in a thin bar. */
const LIST_MAX = 10;
const noSubscription = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function sessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function setSessionFlag(key: string, on: boolean) {
  try {
    if (on) sessionStorage.setItem(key, "1");
    else sessionStorage.removeItem(key);
  } catch {
    // Storage blocked: the state lasts until the next page.
  }
}

/**
 * Sections of the page: `<section id="…" data-rail="Etykieta">` (optional `data-rail-icon`). The hero
 * of a subpage (`#start`) gets a flag: the house belongs to „Strona główna”.
 */
function readSections(onHome: boolean): Section[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".tech main [data-rail][id]")).map((el) => ({
    id: el.id,
    label: el.dataset.rail || el.id,
    icon: (el.dataset.railIcon as RailIconName | undefined) ?? (el.id === "start" && !onHome ? "flag" : railIcon(el.id)),
  }));
}

/** Focus moves on to the section, as after a plain anchor (the next Tab starts there). */
function focusSection(section: HTMLElement) {
  if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
  section.focus({ preventScroll: true });
}

/**
 * Side rail from 1424 px — the mechanics of the PRO-KOM lines' `SiteRail` (prokom-web-hub,
 * spec §5.1) in the Tech look: „Szukaj” on top (one calm pulse per visit, opens the search
 * window), the page's sections with icons, a gliding marker of the one being read and a progress
 * line ending at it, smooth scroll on click; on subpages „Na tej stronie” (from 3 sections) and
 * the home page folded into one row; „Zgłoś naprawę” and „Do góry” at the bottom. Folded to 64 px,
 * opens to 248 px with labels on hover or keyboard focus (clip-path, 120 / 250 ms), Esc folds it.
 */
export function SectionRail() {
  const pathname = usePathname() || "/";
  const onHome = pathname === "/";
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [showUp, setShowUp] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [markerTop, setMarkerTop] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const up = useRef<HTMLButtonElement>(null);
  const homeListId = useId();
  const mac = useSyncExternalStore(noSubscription, isMac, () => false);

  // The page is read after each navigation (the shell stays mounted while the page swaps).
  useEffect(() => {
    setActive(null);
    const timer = window.setTimeout(() => setSections(readSections(onHome)), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, onHome]);

  // Saved states of the visit: the folded home page row, the one pulse of „Szukaj”.
  useEffect(() => {
    setHomeOpen(sessionFlag(HOME_OPEN_KEY));
    if (!sessionFlag(PULSE_KEY)) {
      setPulse(true);
      setSessionFlag(PULSE_KEY, true);
    }
  }, []);

  const pageGroup = onHome || sections.length >= RAIL_MIN_SECTIONS;
  const tracked = pageGroup ? sections : [];
  const trackedKey = tracked.map((s) => s.id).join(" ");

  // One measurement per frame on scroll and resize — only while the rail is shown (≥ 1424 px):
  // a phone's scroll measures nothing for it.
  useEffect(() => {
    const media = window.matchMedia(RAIL_QUERY);
    let stop: (() => void) | null = null;
    const start = () => {
      const elements = trackedKey ? trackedKey.split(" ").flatMap((id) => document.getElementById(id) ?? []) : [];
      let frame = 0;
      const drawLine = (position: number) => {
        const line = progress.current;
        const box = list.current;
        if (!line || !box) return;
        const centers = Array.from(box.querySelectorAll<HTMLElement>("a.t-rail__item"), (a) => a.offsetTop + a.offsetHeight / 2);
        const top = centers[0] ?? 0;
        const length = (centers[centers.length - 1] ?? top) - top;
        const share = railLineEnd(position, centers);
        line.style.setProperty("--rail-line-top", `${top}px`);
        line.style.setProperty("--rail-line-h", `${length}px`);
        line.style.setProperty("--rail-progress", String(share));
        line.style.setProperty("--rail-dot", `${share * length}px`);
      };
      const update = () => {
        frame = 0;
        const root = document.scrollingElement ?? document.documentElement;
        const atBottom = window.scrollY >= root.scrollHeight - window.innerHeight - 2;
        if (elements.length) {
          const tops = elements.map((el) => el.getBoundingClientRect().top);
          setActive(activeSection(elements.map((el, i) => ({ id: el.id, top: tops[i] })), window.innerHeight, atBottom));
          drawLine(railProgress(tops, window.innerHeight, atBottom));
        }
        setShowUp(window.scrollY > window.innerHeight);
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      schedule();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      };
    };
    const sync = () => {
      if (media.matches && !stop) stop = start();
      else if (!media.matches && stop) {
        stop();
        stop = null;
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      stop?.();
    };
  }, [trackedKey]);

  // The marker slides to the current entry (measured from the list after each change).
  useLayoutEffect(() => {
    const box = list.current;
    if (!box) return;
    const measure = () => {
      const link = box.querySelector<HTMLElement>('a[aria-current="location"]');
      setMarkerTop(link && link.offsetParent ? link.offsetTop : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [active, trackedKey]);

  // „Do góry” is out of reach (focus, screen readers) until it shows; React 18 has no `inert` prop.
  useEffect(() => {
    up.current?.toggleAttribute("inert", !showUp);
  }, [showUp]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") setCollapsed(true);
  };

  const glide = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const section = document.getElementById(id);
    if (!section || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    history.pushState(null, "", `#${id}`);
    setActive(id);
    focusSection(section);
    glideTo(section, prefersReducedMotion());
  };

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    const main = document.getElementById("tresc");
    if (main) main.focus({ preventScroll: true });
  };

  const toggleHome = () => {
    setHomeOpen((open) => {
      setSessionFlag(HOME_OPEN_KEY, !open);
      return !open;
    });
  };

  const item = (s: { id: string; label: string; icon: RailIconName }, href: string, inList: boolean, external = false) => (
    <a
      key={s.id}
      href={href}
      className="t-rail__item"
      aria-current={inList && s.id === active ? "location" : undefined}
      onClick={inList ? (event) => glide(event, s.id) : undefined}
    >
      <span className="t-rail__icon">
        <RailIcon icon={s.icon} />
      </span>
      <span className="t-rail__label">
        <span className="t-rail__text">{s.label}</span>
        {external ? (
          <span className="t-rail__aside" aria-hidden="true">
            ↗
          </span>
        ) : null}
      </span>
    </a>
  );

  const marker = markerTop !== null ? <span aria-hidden="true" className="t-rail__marker" style={{ transform: `translateY(${markerTop}px)` }} /> : null;
  const line = (
    <span ref={progress} className="t-rail__progress" aria-hidden="true">
      <span />
      <i />
    </span>
  );
  const homeLinks = HOME_SECTIONS.map((s) => item({ ...s, icon: railIcon(s.id) }, `/#${s.id}`, false, true));

  return (
    // The wrapper carries the position and the shadow: `clip-path` on the rail would cut both.
    <div className="t-railwrap t-ui" data-t-rail-wrap="">
      <nav
        aria-label="Sekcje strony"
        className="t-rail"
        data-collapsed={collapsed ? "" : undefined}
        data-t-rail=""
        onKeyDown={onKeyDown}
        onMouseEnter={() => setCollapsed(false)}
        onFocus={() => setCollapsed(false)}
      >
        <button type="button" className="t-rail__search" data-pulse={pulse ? "" : undefined} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K /" onClick={() => requestSearch()}>
          <span className="t-rail__icon">
            <IconSearch size={21} strokeWidth={2.3} />
          </span>
          <span className="t-rail__label">
            <span className="t-rail__text">Szukaj</span>
            <kbd className="t-rail__kbd" aria-hidden="true">
              {mac ? "⌘K" : "Ctrl K"}
            </kbd>
          </span>
        </button>
        <span className="t-rail__sep" aria-hidden="true" />

        {pageGroup ? (
          <>
            {!onHome ? (
              <span className="t-rail__caption" aria-hidden="true">
                <span className="t-rail__icon">•</span>
                <span className="t-rail__label">Na tej stronie</span>
              </span>
            ) : null}
            <div ref={list} role="group" aria-label="Na tej stronie" className="t-rail__list" data-long={sections.length > LIST_MAX ? "" : undefined}>
              {marker}
              {line}
              {sections.map((s) => item(s, `#${s.id}`, true))}
            </div>
          </>
        ) : null}

        {!onHome ? (
          <>
            {pageGroup ? <span className="t-rail__sep" aria-hidden="true" /> : null}
            <button type="button" className="t-rail__item" aria-expanded={homeOpen} aria-controls={homeListId} onClick={toggleHome}>
              <span className="t-rail__icon">
                <RailIcon icon="start" />
              </span>
              <span className="t-rail__label">
                <span className="t-rail__text">Strona główna</span>
                <span className="t-rail__aside">
                  {sectionsCount(HOME_SECTIONS.length)} <span className="t-rail__chev" data-open={homeOpen ? "" : undefined} aria-hidden="true" />
                </span>
              </span>
            </button>
            <div id={homeListId} role="group" aria-label="Strona główna" className="t-rail__list t-rail__list--home" hidden={!homeOpen}>
              {homeLinks}
            </div>
          </>
        ) : null}

        <span className="t-rail__sep" aria-hidden="true" />
        <Link href={SUBMIT_HREF} className="t-rail__item t-rail__item--action" aria-current={pathname === SUBMIT_HREF ? "page" : undefined}>
          <span className="t-rail__icon">
            <IconWrench size={21} strokeWidth={2.1} />
          </span>
          <span className="t-rail__label">
            <span className="t-rail__text">Zgłoś naprawę</span>
          </span>
        </Link>
        <button ref={up} type="button" className="t-rail__item t-rail__up" data-shown={showUp ? "" : undefined} onClick={toTop}>
          <span className="t-rail__icon">
            <IconToTop />
          </span>
          <span className="t-rail__label">
            <span className="t-rail__text">Do góry</span>
          </span>
        </button>
      </nav>
    </div>
  );
}
