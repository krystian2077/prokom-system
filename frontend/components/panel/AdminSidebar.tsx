"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Boxes,
  CalendarDays,
  ClipboardList,
  History,
  PlusCircle,
  Search,
  Settings,
  Truck,
  Wrench,
  Users,
  Bell,
  MessageSquareText,
  Users2,
  Warehouse,
} from "lucide-react";

type SidebarItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

const adminItems: SidebarItem[] = [
  {
    href: "/admin-panel/dashboard",
    label: "Dashboard",
    icon: <Activity size={18} />,
    isActive: (p) => p === "/admin-panel/dashboard" || p.startsWith("/admin-panel/dashboard/"),
  },
  {
    href: "/admin-panel/intake",
    label: "Przyjęcie Stacjonarne",
    icon: <PlusCircle size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/intake"),
  },
  {
    href: "/admin-panel/repairs",
    label: "Naprawy",
    icon: <Wrench size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/repairs"),
  },
  {
    href: "/admin-panel/unassigned",
    label: "Nieprzypisane",
    icon: <ClipboardList size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/unassigned"),
  },
  {
    href: "/admin-panel/workload",
    label: "Obciążenie",
    icon: <Users2 size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/workload"),
  },
  {
    href: "/admin-panel/clients",
    label: "Klienci",
    icon: <Users size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/clients"),
  },
  {
    href: "/admin-panel/search",
    label: "Wyszukiwanie",
    icon: <Search size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/search"),
  },
  {
    href: "/admin-panel/comm",
    label: "Komunikacja",
    icon: <MessageSquareText size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/comm"),
  },
  {
    href: "/admin-panel/notif",
    label: "Powiadomienia",
    icon: <Bell size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/notif"),
  },
  {
    href: "/admin-panel/calendar",
    label: "Kalendarz",
    icon: <CalendarDays size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/calendar"),
  },
  {
    href: "/admin-panel/pickups",
    label: "Odbiory",
    icon: <Truck size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/pickups"),
  },
  {
    href: "/admin-panel/claims",
    label: "Reklamacje",
    icon: <ClipboardList size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/claims"),
  },
  {
    href: "/admin-panel/parts",
    label: "Części",
    icon: <Boxes size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/parts"),
  },
  {
    href: "/admin-panel/hurtownie",
    label: "Hurtownie",
    icon: <Warehouse size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/hurtownie"),
  },
  {
    href: "/admin-panel/stats",
    label: "Statystyki",
    icon: <Activity size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/stats"),
  },
  {
    href: "/admin-panel/team",
    label: "Zespół",
    icon: <Users size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/team"),
  },
  {
    href: "/admin-panel/availability",
    label: "Dostępność",
    icon: <Settings size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/availability"),
  },
  {
    href: "/admin-panel/orders",
    label: "Zamówienia",
    icon: <Boxes size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/orders"),
  },
  {
    href: "/admin-panel/config",
    label: "Konfiguracja",
    icon: <Settings size={18} />,
    isActive: (p) => p.startsWith("/admin-panel/config"),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="z-[120] hidden w-[270px] flex-col border-r border-[var(--border)] bg-[var(--s1)] md:flex"
      style={{ boxShadow: "inset -1px 0 0 var(--rb)" }}
    >
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold tracking-[0.2em] text-[var(--ink2)]">PRO-KOM</div>
            <div className="mt-1 text-sm font-semibold text-[var(--ink)]">Panel admina</div>
          </div>
          <span
            className="h-9 w-9 rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--red), var(--red-h))",
              display: "inline-block",
            }}
          />
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-auto px-3 pb-6">
        <div className="space-y-1">
          {adminItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition"
                style={{
                  background: active ? "var(--rl)" : "transparent",
                  color: active ? "var(--white)" : "var(--ink)",
                  borderLeft: active ? "3px solid var(--red)" : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{
                      background: active ? "color-mix(in srgb, var(--red) 22%, transparent)" : "var(--row-hover)",
                      border: active ? "1px solid var(--rb)" : "1px solid var(--border)",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {active ? (
                  <span className="h-2 w-2 rounded-full bg-[var(--red)]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

