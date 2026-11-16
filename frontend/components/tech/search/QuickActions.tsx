"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { QuickAction } from "@/lib/tech/search/quick-actions";
import { getTechTheme, switchTechTheme } from "@/lib/tech/theme";
import { useTechTheme } from "../ThemeToggle";
import { SearchIcon } from "../rail-icons";

/** How long the tile says „Skopiowano”. */
const COPIED_MS = 2200;

/** Clipboard API, else a selected textarea inside the open dialog (outside it the page is inert). */
async function copyText(text: string, near: HTMLElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission refused: try the old way.
  }
  try {
    const host = near?.closest("dialog") ?? document.body;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    host.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Runs the actions that are not links (copy the number, switch the theme) and tells what
 * happened: `copied` flips the tile for a moment, `status` goes to a live region.
 */
export function useQuickRun() {
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const theme = useTechTheme();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((action: QuickAction, el: HTMLElement | null) => {
    if (action.kind === "copy" && action.value) {
      const value = action.value;
      void copyText(value, el).then((ok) => {
        setCopied(ok ? action.id : null);
        setStatus(ok ? `Skopiowano numer ${value}` : `Numer: ${value}`);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(null), COPIED_MS);
      });
    } else if (action.kind === "theme") {
      const dark = getTechTheme().theme === "dark";
      void switchTechTheme(dark ? "light" : "dark", el ? centerOf(el) : null);
      setStatus(dark ? "Włączono jasny motyw" : "Włączono ciemny motyw");
    }
  }, []);

  /** What a tile or a row shows now (the copy and theme actions change). */
  const view = useCallback(
    (action: QuickAction): { short: string; sub: string; hint: string; icon: QuickAction["icon"]; done: boolean } => {
      if (action.kind === "copy" && copied === action.id) return { short: "Skopiowano", sub: action.sub, hint: "Numer jest w schowku", icon: "check", done: true };
      if (action.kind === "theme") {
        const dark = theme?.theme === "dark";
        return { short: action.short, sub: dark ? "Jasny" : "Ciemny", hint: dark ? "Włącz jasny motyw" : "Włącz ciemny motyw", icon: dark ? "sun" : "moon", done: false };
      }
      return { short: action.short, sub: action.sub, hint: action.hint, icon: action.icon, done: false };
    },
    [copied, theme?.theme],
  );

  return { run, view, status };
}

type Run = ReturnType<typeof useQuickRun>;

/** Measurement attributes for TrackClicks (`data-track`, `data-track-*`). */
function trackAttrs(action: QuickAction): Record<string, string> {
  if (!action.track) return {};
  const out: Record<string, string> = { "data-track": action.track.event };
  for (const [k, v] of Object.entries(action.track.params)) out[`data-track-${k}`] = v;
  return out;
}

type ItemProps = {
  action: QuickAction;
  runner: Run;
  className: string;
  children: ReactNode;
  /** A link was followed (the window closes). */
  onFollow?: () => void;
  /** Extra props of an option row (id, role, aria-selected…). */
  extra?: Record<string, unknown>;
  style?: CSSProperties;
};

/** One action as the right element: a site link, an outside link, or a button. */
export function QuickActionItem({ action, runner, className, children, onFollow, extra, style }: ItemProps) {
  const common = { className, style, "data-qa": action.kind, ...trackAttrs(action), ...extra };
  if (action.href?.startsWith("/")) {
    return (
      <Link
        href={action.href}
        {...common}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
          onFollow?.();
        }}
      >
        {children}
      </Link>
    );
  }
  if (action.href) {
    return (
      <a href={action.href} {...common} {...(action.external ? { target: "_blank", rel: "noopener" } : {})} onClick={() => action.external && onFollow?.()}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" {...common} onClick={(e) => runner.run(action, e.currentTarget)}>
      {children}
    </button>
  );
}

type TilesProps = { actions: readonly QuickAction[]; runner: Run; onFollow?: () => void; label?: string; className?: string };

/**
 * The row of quick action tiles (Biznes „Zadzwoń · Drugi numer · Kopiuj numer…”): one row that
 * fills the window on a desktop and scrolls sideways on a phone (snap, 44 px+ targets).
 */
export function QuickActionTiles({ actions, runner, onFollow, label = "Szybkie akcje", className }: TilesProps) {
  return (
    <div className={`t-qa${className ? ` ${className}` : ""}`} role="group" aria-label={label}>
      {actions.map((action, i) => {
        const v = runner.view(action);
        return (
          <QuickActionItem
            key={action.id}
            action={action}
            runner={runner}
            onFollow={onFollow}
            className={`t-qa__tile${i === 0 ? " t-qa__tile--main" : ""}${v.done ? " is-done" : ""}`}
            style={{ "--i": i } as CSSProperties}
          >
            <span className="t-qa__icon">
              <SearchIcon icon={v.icon} size={19} strokeWidth={2.1} />
            </span>
            <span className="t-qa__label">{v.short}</span>
            <span className="t-qa__sub">{v.sub}</span>
          </QuickActionItem>
        );
      })}
    </div>
  );
}
