"use client";

import { useEffect, type ReactNode } from "react";
import { useWorkerPanelTheme } from "@/contexts/WorkerPanelThemeContext";

/** Wrapper z tokenami `.worker-shell` + synchronizacja klas na `<html>` (scrollbar). */
export function StaffPanelShell({ children }: { children: ReactNode }) {
  const { theme } = useWorkerPanelTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("worker-panel");
    root.classList.toggle("worker-panel--light", theme === "light");
    return () => {
      root.classList.remove("worker-panel", "worker-panel--light");
    };
  }, [theme]);

  return (
    <div
      className="worker-shell min-h-screen bg-[var(--page)] text-[var(--ink)] antialiased"
      data-worker-theme={theme}
    >
      {children}
    </div>
  );
}
