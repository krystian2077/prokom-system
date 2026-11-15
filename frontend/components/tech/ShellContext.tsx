"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { VisiblePoint } from "@/lib/tech/points";

export type SheetMode = "menu" | "naprawy";

type ShellState = {
  points: VisiblePoint[];
  /** Live repair pages by `category:fault` (built on the server, so the client skips the texts). */
  faultPages: Record<string, string>;
  sheet: SheetMode | null;
  openSheet: (mode: SheetMode, opener?: HTMLElement | null) => void;
  closeSheet: () => void;
  opener: HTMLElement | null;
};

const Ctx = createContext<ShellState | null>(null);

export function ShellProvider({ points, faultPages = {}, children }: { points: VisiblePoint[]; faultPages?: Record<string, string>; children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const openSheet = useCallback((mode: SheetMode, el?: HTMLElement | null) => {
    setOpener(el ?? (document.activeElement as HTMLElement | null));
    setSheet(mode);
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const value = useMemo(() => ({ points, faultPages, sheet, openSheet, closeSheet, opener }), [points, faultPages, sheet, openSheet, closeSheet, opener]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShell outside ShellProvider");
  return v;
}
