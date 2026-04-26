"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { usePanelBasePath } from "@/lib/panelPaths";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobilePanelNavigation() {
  const pathname = usePathname();
  const panel = usePanelBasePath();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bottomItems = useMemo<NavItem[]>(
    () => [
      { href: panel.dashboardPath, label: "Start", icon: LayoutDashboard },
      { href: panel.repairsListPath, label: "Naprawy", icon: Wrench },
      { href: panel.zadaniaPath, label: "Zadania", icon: CalendarDays },
      { href: panel.powiadomieniaPath, label: "Alerty", icon: Bell },
      { href: panel.profilPath, label: "Profil", icon: UserRound },
    ],
    [panel],
  );

  const drawerItems = useMemo<NavItem[]>(
    () => [
      { href: panel.dashboardPath, label: "Dashboard", icon: LayoutDashboard },
      { href: panel.repairsListPath, label: "Naprawy", icon: Wrench },
      { href: panel.zgloszeniaPath, label: "Zgłoszenia", icon: Search },
      { href: panel.zadaniaPath, label: "Zadania", icon: CalendarDays },
      { href: panel.powiadomieniaPath, label: "Powiadomienia", icon: Bell },
      { href: panel.commPath, label: "Komunikacja", icon: MessageSquareText },
      { href: panel.kalendarzPath, label: "Kalendarz", icon: CalendarDays },
      { href: panel.klienciPath, label: "Klienci", icon: UserRound },
      { href: panel.odbioryPath, label: "Odbiory", icon: CalendarDays },
      { href: panel.czesciPath, label: "Części", icon: Wrench },
      { href: panel.reklamacjePath, label: "Reklamacje", icon: Bell },
      { href: panel.intakePath, label: "Przyjęcie", icon: Search },
      { href: panel.zespolPath, label: "Zespół", icon: UserRound },
      { href: panel.konfiguracjaPath, label: "Konfiguracja", icon: Menu },
      { href: panel.wyszukiwaniePath, label: "Wyszukiwanie", icon: Search },
      { href: panel.historiaPath, label: "Historia", icon: LayoutDashboard },
      { href: panel.profilPath, label: "Mój profil", icon: UserRound },
    ],
    [panel],
  );

  if (!mounted) return null;

  return createPortal(
    <>
      {open ? (
        <div className="staff-mobile-drawer fixed inset-0" style={{ zIndex: 99998 }}>
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Zamknij menu"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(90vw,380px)] flex-col overflow-hidden border-l border-[var(--border)] bg-[linear-gradient(180deg,rgba(11,17,30,0.98),rgba(8,13,24,0.98))] pl-4 pr-4 pt-[max(1rem,env(safe-area-inset-top,0px))] shadow-[0_20px_50px_rgba(0,0,0,.45)]">
            <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[var(--border)] pb-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink2)]">Nawigacja</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)]"
                aria-label="Zamknij"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pr-1">
              {drawerItems.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-[#3b82f6]/50 bg-[linear-gradient(135deg,rgba(59,130,246,0.22),rgba(37,99,235,0.08))] text-[var(--white)] shadow-[0_10px_26px_rgba(37,99,235,.18)]"
                        : "border-transparent text-[var(--ink2)] hover:border-[var(--border)] hover:bg-[var(--row-hover)] hover:text-[var(--white)]"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <nav
        className="staff-mobile-bottom-nav border-t border-[var(--border)] bg-[var(--s1)]/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 backdrop-blur-xl"
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2147483647 }}
        data-testid="staff-mobile-bottom-nav"
      >
        <ul className="grid grid-cols-6 gap-1">
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-hover)]"
            >
              <Menu size={16} />
              <span className="truncate">Menu</span>
            </button>
          </li>
          {bottomItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                    active ? "bg-[#3b82f6]/14 text-[var(--white)]" : "text-[var(--ink2)] hover:bg-[var(--row-hover)]"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>,
    document.body,
  );
}
