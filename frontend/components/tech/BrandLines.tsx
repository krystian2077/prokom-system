"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { usePill } from "./usePill";

export type BrandLine = { key: string; name: string; href: string; current: boolean; dash: string; dashDark: string; description: string };

const TIP_DELAY_MS = 350;
const ENTER_KEY = "pk-tech-brandbar-in";

/**
 * PRO-KOM lines in the brand bar (MOTYW-PASEK-LINII §4): a pill follows the pointer and the keyboard
 * focus (back under the current line when they leave), the dash grows and glows, a short description
 * appears after 350 ms of pointing or at once on focus (never on touch), and the items come in one
 * after another once per visit. The only client island of the bar.
 */
export function BrandLines({ lines }: { lines: BrandLine[] }) {
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const current = lines.find((l) => l.current)?.key ?? null;
  const [hot, setHot] = useState<string | null>(null);
  const [tip, setTip] = useState<{ key: string; x: number } | null>(null);
  const [enter, setEnter] = useState(false);
  const tipId = useId();
  const target = hot ?? current;
  usePill(navRef, target ? `[data-line="${target}"]` : "[data-line-none]", [target]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ENTER_KEY) !== "1") {
        setEnter(true);
        sessionStorage.setItem(ENTER_KEY, "1");
      }
    } catch {
      // storage blocked: no entrance, nothing else changes
    }
    return () => window.clearTimeout(timer.current);
  }, []);

  /** The description sits centred under its line (x = the link's middle, in the nav's box). */
  const show = (key: string, delay: number) => {
    window.clearTimeout(timer.current);
    const open = () => {
      const a = navRef.current?.querySelector<HTMLElement>(`[data-line="${key}"]`);
      if (a) setTip({ key, x: a.offsetLeft + a.offsetWidth / 2 });
    };
    if (delay) timer.current = window.setTimeout(open, delay);
    else open();
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setTip(null);
  };
  const tipLine = tip ? lines.find((l) => l.key === tip.key) : undefined;

  return (
    <nav
      ref={navRef}
      aria-label="Linie PRO-KOM"
      className={`t-brandbar__lines${enter ? " is-enter" : ""}`}
      onPointerLeave={() => {
        setHot(null);
        hide();
      }}
      onBlur={(e) => {
        if (!navRef.current?.contains(e.relatedTarget as Node)) {
          setHot(null);
          hide();
        }
      }}
    >
      <span className="t-brandbar__pill" aria-hidden="true" />
      {lines.map((l, i) => (
        <a
          key={l.key}
          href={l.href}
          data-line={l.key}
          aria-current={l.current ? "page" : undefined}
          aria-describedby={tip?.key === l.key ? tipId : undefined}
          className={`t-bline${l.current ? " is-current" : ""}${hot === l.key ? " is-hot" : ""}`}
          style={{ "--line": l.dash, "--line-dark": l.dashDark, "--i": i } as CSSProperties}
          onPointerEnter={(e) => {
            setHot(l.key);
            if (e.pointerType === "mouse" && window.matchMedia("(hover: hover)").matches) show(l.key, TIP_DELAY_MS);
            else hide();
          }}
          onFocus={() => {
            setHot(l.key);
            show(l.key, 0);
          }}
        >
          <span className="t-dash" aria-hidden="true" />
          {l.name}
        </a>
      ))}
      {tipLine ? (
        <span id={tipId} role="tooltip" className="t-brandbar__tip" style={{ "--tip-x": `${tip!.x}px` } as CSSProperties} data-for={tipLine.key}>
          {tipLine.description}
        </span>
      ) : null}
    </nav>
  );
}
