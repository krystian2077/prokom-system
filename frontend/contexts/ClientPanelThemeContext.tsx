"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ClientPanelTheme = "dark" | "light";

const STORAGE_KEY = "prokom-client-panel-theme";

const ClientPanelThemeContext = createContext<{
  theme: ClientPanelTheme;
  setTheme: (t: ClientPanelTheme) => void;
  toggleTheme: () => void;
} | null>(null);

function readStoredTheme(): ClientPanelTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function ClientPanelThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ClientPanelTheme>(readStoredTheme);

  const setTheme = useCallback((t: ClientPanelTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ClientPanelTheme = prev === "dark" ? "light" : "dark";
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
    <ClientPanelThemeContext.Provider value={value}>
      {children}
    </ClientPanelThemeContext.Provider>
  );
}

export function useClientPanelTheme(): {
  theme: ClientPanelTheme;
  setTheme: (t: ClientPanelTheme) => void;
  toggleTheme: () => void;
} {
  const ctx = useContext(ClientPanelThemeContext);
  if (!ctx) {
    throw new Error("useClientPanelTheme must be used within ClientPanelThemeProvider");
  }
  return ctx;
}
