"use client";

import { useEffect, useRef, useState } from "react";
import { getTechTheme, switchTechTheme, type ResolvedTheme, type ThemeChoice } from "@/lib/tech/theme";
import { IconMoon, IconSun } from "./icons";
import { usePill } from "./usePill";

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function useTechTheme() {
  const [t, setT] = useState<{ choice: ThemeChoice; theme: ResolvedTheme } | null>(null);
  useEffect(() => {
    setT(getTechTheme());
    const on = () => setT(getTechTheme());
    window.addEventListener("pk-theme", on);
    return () => window.removeEventListener("pk-theme", on);
  }, []);
  return t;
}

/**
 * Capsule button with a label (MOTYW-PASEK-LINII §1): it says what happens — „Ciemny motyw” while
 * the page is light, „Jasny motyw” while dark. Both labels and icons are in the HTML and CSS picks
 * one from html[data-tech-theme] (set before the first paint), so the server never guesses and the
 * wrong label never flashes. The two labels share one grid cell, so the width is the longer one's.
 * 1024–1359 px: „Ciemny” / „Jasny” (the rest is visually hidden, still in the accessible name).
 * No aria-pressed (the text names the action, not a state); the change is announced politely.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [said, setSaid] = useState("");
  return (
    <>
      <button
        type="button"
        className={`t-themebtn${className ? ` ${className}` : ""}`}
        data-tech-theme-toggle=""
        onClick={(e) => {
          const to = getTechTheme().theme === "dark" ? "light" : "dark";
          const btn = e.currentTarget;
          btn.classList.remove("is-anim");
          void btn.offsetWidth; // restart the icon/label animation on every click
          btn.classList.add("is-anim");
          void switchTechTheme(to, centerOf(btn));
          setSaid(to === "dark" ? "Włączono ciemny motyw." : "Włączono jasny motyw.");
        }}
      >
        <span className="t-themebtn__icons" aria-hidden="true">
          <IconMoon className="t-themebtn__ico t-themebtn__ico--to-dark" />
          <IconSun className="t-themebtn__ico t-themebtn__ico--to-light" />
        </span>
        <span className="t-themebtn__labels">
          <span className="t-themebtn__label t-themebtn__label--to-dark">
            Ciemny<span className="t-themebtn__rest"> motyw</span>
          </span>
          <span className="t-themebtn__label t-themebtn__label--to-light">
            Jasny<span className="t-themebtn__rest"> motyw</span>
          </span>
        </span>
      </button>
      <span className="t-visually-hidden" aria-live="polite">
        {said}
      </span>
    </>
  );
}

const CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Jasny" },
  { value: "dark", label: "Ciemny" },
  { value: "auto", label: "Auto" },
];

/** Menu sheet: Jasny / Ciemny / Auto. */
export function ThemeSegmented() {
  const t = useTechTheme();
  const ref = useRef<HTMLDivElement>(null);
  usePill(ref, "button.is-on", [t?.choice]);
  return (
    <div ref={ref} className="t-segmented" role="radiogroup" aria-label="Motyw">
      <span className="t-pilltabs__pill" aria-hidden="true" />
      {CHOICES.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={t?.choice === c.value}
          className={t?.choice === c.value ? "is-on" : undefined}
          onClick={(e) => switchTechTheme(c.value, centerOf(e.currentTarget))}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Side rail entry above „Do góry” (MOTYW-PASEK-LINII §6): folded — the icon; open — „Ciemny motyw” /
 * „Jasny motyw” (click = switch with the circle) and under it Jasny · Ciemny · Auto (same state as
 * the menu sheet). The small switch unfolds with the rail (grid rows 0fr → 1fr, no jump).
 */
export function ThemeRailItem() {
  const t = useTechTheme();
  const ref = useRef<HTMLDivElement>(null);
  usePill(ref, "button.is-on", [t?.choice]);
  return (
    <div className="t-rail__themewrap">
      <button
        type="button"
        className="t-rail__item t-rail__theme"
        data-tech-theme-rail=""
        onClick={(e) => switchTechTheme(getTechTheme().theme === "dark" ? "light" : "dark", centerOf(e.currentTarget))}
      >
        <span className="t-rail__icon t-rail__themeico" aria-hidden="true">
          <IconMoon size={21} className="t-themebtn__ico t-themebtn__ico--to-dark" />
          <IconSun size={21} className="t-themebtn__ico t-themebtn__ico--to-light" />
        </span>
        <span className="t-rail__label">
          <span className="t-rail__text t-themebtn__labels">
            <span className="t-themebtn__label t-themebtn__label--to-dark">Ciemny motyw</span>
            <span className="t-themebtn__label t-themebtn__label--to-light">Jasny motyw</span>
          </span>
        </span>
      </button>
      <div className="t-rail__themes">
        <div ref={ref} className="t-rail__seg" role="radiogroup" aria-label="Motyw strony">
          <span className="t-pilltabs__pill" aria-hidden="true" />
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={t?.choice === c.value}
              className={t?.choice === c.value ? "is-on" : undefined}
              onClick={(e) => switchTechTheme(c.value, centerOf(e.currentTarget))}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
