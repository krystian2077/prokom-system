"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkerPanelTheme = "dark" | "light";

const STORAGE_KEY = "prokom-worker-panel-theme";

const WorkerPanelThemeContext = createContext<{
  theme: WorkerPanelTheme;
  setTheme: (t: WorkerPanelTheme) => void;
  toggleTheme: () => void;
} | null>(null);

function readStoredTheme(): WorkerPanelTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function WorkerPanelThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<WorkerPanelTheme>(readStoredTheme);

  const setTheme = useCallback((t: WorkerPanelTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: WorkerPanelTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <WorkerPanelThemeContext.Provider value={value}>
      {children}
    </WorkerPanelThemeContext.Provider>
  );
}

export function useWorkerPanelTheme(): {
  theme: WorkerPanelTheme;
  setTheme: (t: WorkerPanelTheme) => void;
  toggleTheme: () => void;
} {
  const ctx = useContext(WorkerPanelThemeContext);
  if (!ctx) {
    throw new Error("useWorkerPanelTheme must be used within WorkerPanelThemeProvider");
  }
  return ctx;
}
