"use client";

import { usePathname } from "next/navigation";

/**
 * Prefiksy URL dla współdzielonych widoków staff vs admin.
 * Worker: polskie ścieżki (/panel/naprawy, …). Admin: /admin-panel/…
 */
export type PanelPathContext = {
  isAdminPanel: boolean;
  /** Lista napraw (tabela admin lub lista worker) */
  repairsListPath: string;
  repairDetailPath: (id: string) => string;
  /** Kanban zgłoszeń */
  zgloszeniaPath: string;
  zgloszenieDetailPath: (id: string) => string;
  dashboardPath: string;
  historiaPath: string;
  commPath: string;
  powiadomieniaPath: string;
  profilPath: string;
  klienciPath: string;
  kalendarzPath: string;
  czesciPath: string;
  zamowieniaPath: string;
  statystykiPath: string;
  reklamacjePath: string;
  odbioryPath: string;
  zadaniaPath: string;
  wyszukiwaniePath: string;
  intakePath: string;
  zespolPath: string;
  konfiguracjaPath: string;
  dostepnoscPath: string;
};

const WORKER: PanelPathContext = {
  isAdminPanel: false,
  repairsListPath: "/panel/naprawy",
  repairDetailPath: (id: string) => `/panel/naprawy/${encodeURIComponent(id)}`,
  zgloszeniaPath: "/panel/zgloszenia",
  zgloszenieDetailPath: (id: string) => `/panel/zgloszenia/${encodeURIComponent(id)}`,
  dashboardPath: "/panel/dashboard",
  historiaPath: "/panel/historia",
  commPath: "/panel/comm",
  powiadomieniaPath: "/panel/powiadomienia",
  profilPath: "/panel/profil",
  klienciPath: "/panel/klienci",
  kalendarzPath: "/panel/kalendarz",
  czesciPath: "/panel/czesci-hurtownie",
  zamowieniaPath: "/panel/zamowienia",
  statystykiPath: "/panel/statystyki",
  reklamacjePath: "/panel/reklamacje",
  odbioryPath: "/panel/odbiory",
  zadaniaPath: "/panel/zadania",
  wyszukiwaniePath: "/panel/wyszukiwanie",
  intakePath: "/panel/intake",
  zespolPath: "/panel/zespol",
  konfiguracjaPath: "/panel/konfiguracja",
  dostepnoscPath: "/panel/dostepnosc",
};

const ADMIN: PanelPathContext = {
  isAdminPanel: true,
  repairsListPath: "/admin-panel/repairs",
  repairDetailPath: (id: string) => `/admin-panel/repairs/${encodeURIComponent(id)}`,
  zgloszeniaPath: "/admin-panel/zgloszenia",
  zgloszenieDetailPath: (id: string) => `/admin-panel/zgloszenia/${encodeURIComponent(id)}`,
  dashboardPath: "/admin-panel/dashboard",
  historiaPath: "/admin-panel/archive",
  commPath: "/admin-panel/comm",
  powiadomieniaPath: "/admin-panel/notif",
  profilPath: "/admin-panel/profil",
  klienciPath: "/admin-panel/clients",
  kalendarzPath: "/admin-panel/calendar",
  czesciPath: "/admin-panel/parts",
  zamowieniaPath: "/admin-panel/orders",
  statystykiPath: "/admin-panel/stats",
  reklamacjePath: "/admin-panel/claims",
  odbioryPath: "/admin-panel/pickups",
  zadaniaPath: "/admin-panel/tasks",
  wyszukiwaniePath: "/admin-panel/search",
  intakePath: "/admin-panel/intake",
  zespolPath: "/admin-panel/team",
  konfiguracjaPath: "/admin-panel/config",
  dostepnoscPath: "/admin-panel/availability",
};

export function getPanelPathsFromPathname(pathname: string | null): PanelPathContext {
  if (pathname?.startsWith("/admin-panel")) return ADMIN;
  return WORKER;
}

/** Hook — używać w komponentach klienckich współdzielonych przez /panel i /admin-panel. */
export function usePanelBasePath(): PanelPathContext {
  const pathname = usePathname();
  return getPanelPathsFromPathname(pathname);
}
