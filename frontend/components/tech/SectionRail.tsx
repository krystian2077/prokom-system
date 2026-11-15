"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconSearch, IconWrench } from "./icons";
import { useShell } from "./ShellContext";

type RailItem = { id: string; label: string };

/** Fewer sections than this and the rail is not worth showing (short pages, documents, 404). */
const MIN_SECTIONS = 3;

/**
 * Side rail on wide screens (design `.rail`): one button per page section marked
 * `<section id="…" data-rail="Etykieta">`, with the label on hover/focus. Shown from
 * 1424 px (centred in the margin left of the content, never over it) and only on pages
 * with at least MIN_SECTIONS sections. The current section follows scrolling.
 */
export function SectionRail() {
  const pathname = usePathname();
  const { openSheet } = useShell();
  const [items, setItems] = useState<RailItem[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".tech main [data-rail][id]"));
    setItems(sections.map((s) => ({ id: s.id, label: s.dataset.rail || s.id })));
    setCurrent(null);
    if (sections.length < MIN_SECTIONS) return;
    // current = the last section whose top has passed 40% of the viewport (works for short
    // sections and for the end of the page, where no section crosses a narrow band)
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let id = sections[0].id;
      for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
      // at the very bottom the last section is current even when it is too short to reach the line
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) id = sections[sections.length - 1].id;
      setCurrent(id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (items.length < MIN_SECTIONS) return null;
  return (
    <nav className="t-rail t-ui" aria-label="Sekcje strony">
      <button type="button" className="t-rail__search" aria-label="Szukaj" onClick={(e) => openSheet("szukaj", e.currentTarget)}>
        <IconSearch size={20} />
        <span className="t-rail__label" aria-hidden="true">
          Szukaj
        </span>
      </button>
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`} className={current === it.id ? "is-on" : undefined} aria-label={it.label} aria-current={current === it.id ? "location" : undefined}>
          <span className="t-rail__dot" aria-hidden="true" />
          <span className="t-rail__label" aria-hidden="true">
            {it.label}
          </span>
        </a>
      ))}
      <hr />
      <Link href={SUBMIT_HREF} aria-label="Zgłoś naprawę" className="t-rail__acc">
        <IconWrench size={20} strokeWidth={2.2} />
        <span className="t-rail__label" aria-hidden="true">
          Zgłoś naprawę
        </span>
      </Link>
    </nav>
  );
}
