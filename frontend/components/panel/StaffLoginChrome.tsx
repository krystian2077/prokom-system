"use client";

import { useEffect, type ReactNode } from "react";

/** Usuwa klasy panelu staff z `<html>` na stronie logowania. */
export function StaffLoginChrome({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("worker-panel", "worker-panel--light");
  }, []);

  return <div className="min-h-screen">{children}</div>;
}
