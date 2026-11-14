"use client";

import { useEffect, useState } from "react";
import { getTechTheme, switchTechTheme, type ResolvedTheme, type ThemeChoice } from "@/lib/tech/theme";
import { IconMoon, IconSun } from "./icons";

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

/** Capsule button: switches between light and dark (SPEC §3). */
export function ThemeToggle() {
  const t = useTechTheme();
  const dark = t?.theme === "dark";
  return (
    <button
      type="button"
      className="t-iconbtn"
      data-tech-theme-toggle=""
      aria-label={dark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
      onClick={(e) => switchTechTheme(dark ? "light" : "dark", centerOf(e.currentTarget))}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
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
  return (
    <div className="t-segmented" role="radiogroup" aria-label="Motyw">
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
