"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconSearch, IconWrench } from "./icons";
import { useShell } from "./ShellContext";

type RailItem = { id: string; label: string };

/**
 * Side rail ≥ 1400 px (design `.rail`): one button per page section marked
 * `<section id="…" data-rail="Etykieta">`. Pages without such sections get no rail.
 */
export function SectionRail() {
  const pathname = usePathname();
  const { openSheet } = useShell();
  const [items, setItems] = useState<RailItem[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".tech main [data-rail][id]"));
    setItems(sections.map((s) => ({ id: s.id, label: s.dataset.rail || s.id })));
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [pathname]);

  if (!items.length) return null;
  return (
    <nav className="t-rail t-ui" aria-label="Sekcje strony">
      <button type="button" className="t-rail__search" aria-label="Szukaj" onClick={(e) => openSheet("szukaj", e.currentTarget)}>
        <IconSearch size={20} />
      </button>
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`} className={current === it.id ? "is-on" : undefined} aria-label={it.label} aria-current={current === it.id ? "location" : undefined}>
          <span className="t-rail__dot" aria-hidden="true" />
        </a>
      ))}
      <hr />
      <Link href={SUBMIT_HREF} aria-label="Zgłoś naprawę" className="t-rail__acc">
        <IconWrench size={20} strokeWidth={2.2} />
      </Link>
    </nav>
  );
}
