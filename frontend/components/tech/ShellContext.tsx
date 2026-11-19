"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { VisiblePoint } from "@/lib/tech/points";
import type { SalesNav } from "@/lib/tech/catalog/nav";

export type SheetMode = "menu" | "naprawy";

type ShellState = {
  points: VisiblePoint[];
  /** Live repair pages by `category:fault` (built on the server, so the client skips the texts). */
  faultPages: Record<string, string>;
  /** „Sprzedaż” menu data (built on the server from the catalogue). */
  sales: SalesNav | null;
  sheet: SheetMode | null;
  openSheet: (mode: SheetMode, opener?: HTMLElement | null) => void;
  closeSheet: () => void;
  opener: HTMLElement | null;
};

const Ctx = createContext<ShellState | null>(null);

export function ShellProvider({ points, faultPages = {}, sales = null, children }: { points: VisiblePoint[]; faultPages?: Record<string, string>; sales?: SalesNav | null; children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const openSheet = useCallback((mode: SheetMode, el?: HTMLElement | null) => {
    setOpener(el ?? (document.activeElement as HTMLElement | null));
    setSheet(mode);
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const value = useMemo(() => ({ points, faultPages, sales, sheet, openSheet, closeSheet, opener }), [points, faultPages, sales, sheet, openSheet, closeSheet, opener]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShell outside ShellProvider");
  return v;
}
