"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { line, lines, telHref } from "@/config/prokom";
import { ACCOUNT_HREF, REPAIRS_HREF, SUBMIT_HREF, TRACK_HREF, footerColumns, mainNav, repairLinks } from "@/lib/tech/nav";
import { DeviceGlyph, IconArrow, IconChevronRight, IconClose, IconSearch } from "./icons";
import { InstallHint } from "./InstallHint";
import { MyRepairs } from "./MyRepairs";
import { OpeningStatus } from "./OpeningStatus";
import { useShell, type SheetMode } from "./ShellContext";
import { ThemeSegmented } from "./ThemeToggle";

const TITLES: Record<SheetMode, string> = { menu: "Menu", naprawy: "Naprawy", szukaj: "Szukaj" };
const CLOSE_DRAG_PX = 110;

/** All site links for the search sheet (unique by href). */
function searchIndex() {
  const all = [
    ...mainNav.map((n) => ({ label: n.label, href: n.href })),
    ...repairLinks.map((r) => ({ label: r.label, href: r.href })),
    ...footerColumns.flatMap((c) => c.items),
    { label: "Zgłoś naprawę", href: SUBMIT_HREF },
    { label: "Status naprawy", href: TRACK_HREF },
  ];
  const seen = new Set<string>();
  return all.filter((x) => (seen.has(x.href) ? false : (seen.add(x.href), true)));
}
const norm = (s: string) => s.toLocaleLowerCase("pl").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

/**
 * Bottom sheet (RESPONSYWNOSC §2): menu, repairs mega menu and search. Handle and drag
 * down to close, Esc, close button, background scroll lock, focus trap, focus returns
 * to the opener.
 */
export function MenuSheet() {
  const { sheet, closeSheet, opener, points } = useShell();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const index = useMemo(searchIndex, []);
  const results = useMemo(() => (query.trim() ? index.filter((x) => norm(x.label).includes(norm(query.trim()))) : index.slice(0, 8)), [index, query]);

  // closed sheet is inert (not focusable); React 18 has no `inert` prop
  useEffect(() => {
    rootRef.current?.toggleAttribute("inert", sheet === null);
  }, [sheet]);

  // close on navigation
  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  useEffect(() => {
    if (!sheet) return;
    setQuery("");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => el.offsetParent !== null);
    window.setTimeout(() => {
      const input = panel?.querySelector<HTMLInputElement>("input");
      (input ?? panel?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0])?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
      } else if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [sheet, closeSheet, opener]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (drag > CLOSE_DRAG_PX) closeSheet();
    setDrag(0);
  };

  const open = sheet !== null;
  const mode = sheet ?? "menu";

  return (
    <div ref={rootRef} className={`t-sheet${open ? " is-open" : ""}`} aria-hidden={!open}>
      <div className="t-sheet__scrim" onClick={closeSheet} />
      <div
        ref={panelRef}
        className="t-sheet__panel t-ui"
        role="dialog"
        aria-modal="true"
        aria-labelledby="t-sheet-title"
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
      >
        <div className="t-sheet__grab" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <span className="t-sheet__handle" aria-hidden="true" />
          <div className="t-sheet__head">
            <h2 id="t-sheet-title">{TITLES[mode]}</h2>
            <button type="button" className="t-iconbtn" aria-label="Zamknij" onClick={closeSheet} data-autofocus="">
              <IconClose />
            </button>
          </div>
        </div>

        <div className="t-sheet__body">
          {mode === "szukaj" ? (
            <>
              <label className="t-search">
                <IconSearch />
                <span className="t-visually-hidden">Szukaj na stronie</span>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Np. laptop, bateria, status" enterKeyHint="search" autoComplete="off" />
              </label>
              <nav aria-label="Wyniki" className="t-sheet__list">
                {results.length ? (
                  results.map((r) => (
                    <Link key={r.href} href={r.href} className="t-sheet__item">
                      {r.label}
                      <IconChevronRight />
                    </Link>
                  ))
                ) : (
                  <p className="t-sheet__empty">Nic nie znaleźliśmy. Zadzwoń — podpowiemy.</p>
                )}
              </nav>
            </>
          ) : null}

          {mode === "naprawy" ? (
            <>
              <ul className="t-sheet__devices">
                {repairLinks.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="t-sheet__device">
                      <DeviceGlyph icon={r.icon} />
                      {r.label.replace(/^Serwis /, "")}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={REPAIRS_HREF} className="t-sheet__item">
                Wszystkie naprawy
                <IconChevronRight />
              </Link>
              <Link href={SUBMIT_HREF} className="t-btn t-btn--acc">
                Zgłoś naprawę online <IconArrow />
              </Link>
            </>
          ) : null}

          {mode === "menu" ? (
            <>
              <nav aria-label="Menu" className="t-sheet__list">
                {mainNav.map((n) => (
                  <Link key={n.key} href={n.href} className="t-sheet__item">
                    {n.label}
                    <IconChevronRight />
                  </Link>
                ))}
                <Link href={ACCOUNT_HREF} className="t-sheet__item">
                  Konto klienta
                  <IconChevronRight />
                </Link>
              </nav>
              <div className="t-sheet__call">
                <div>
                  <OpeningStatus points={points} variant="pill" withName={points.length > 1} skeletonCh={16} />
                  <span className="t-sheet__phone">{line.phoneDisplay}</span>
                </div>
                <a href={telHref(line.phone)} className="t-btn t-btn--acc t-btn--sm" data-track="telefon_klik" data-track-miejsce="menu">
                  Zadzwoń
                </a>
              </div>
              <MyRepairs compact />
              <span className="t-label">Linie PRO-KOM</span>
              <div className="t-sheet__lines">
                {lines.map((l) => (
                  <a key={l.key} href={l.key === line.key ? "/" : `https://${l.domain}`} aria-current={l.key === line.key ? "page" : undefined}>
                    <span className="t-dash" style={{ background: l.dash }} aria-hidden="true" />
                    {l.name}
                  </a>
                ))}
              </div>
              <ThemeSegmented />
              <InstallHint />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
