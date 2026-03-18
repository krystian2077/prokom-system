"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";

type NavLink = {
  href: string;
  label: string;
  roles?: UserRole[];
};

const navLinks: NavLink[] = [
  { href: "/panel/dashboard", label: "Dashboard" },
  { href: "/panel/zgloszenia", label: "Naprawy" },
  { href: "/panel/klienci", label: "Klienci" },
  { href: "/panel/wyszukiwanie", label: "Wyszukiwanie" },
  { href: "/panel/zadania", label: "Zadania" },
  { href: "/panel/powiadomienia", label: "Powiadomienia" },
  { href: "/panel/kalendarz", label: "Kalendarz" },
  { href: "/panel/odbior", label: "Odbiory" },
  { href: "/panel/reklamacje-gwarancje", label: "Reklamacje / Gwarancje" },
  { href: "/panel/dostepnosc", label: "Dostępność" },
  { href: "/panel/czesci-hurtownie", label: "Części / Hurtownie" },
  // moduły tylko dla admina
  { href: "/panel/zamowienia", label: "Zamówienia", roles: ["admin"] },
  { href: "/panel/statystyki", label: "Statystyki", roles: ["admin"] },
  { href: "/panel/zespol", label: "Zespół", roles: ["admin"] },
  { href: "/panel/konfiguracja", label: "Konfiguracja", roles: ["admin"] },
];

export function StaffPanelNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/panel/zgloszenia" ? pathname.startsWith("/panel/zgloszenia") : pathname === href;

  const panelLabel = user?.role === "admin" ? "Panel Admina" : "Panel pracownika";

  const handleLogout = async () => {
    await logout();
    router.push("/panel/login");
  };

  return (
    <nav
      className="sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b px-6"
      style={{
        background: "rgba(7,8,12,.92)",
        backdropFilter: "blur(24px)",
        borderColor: "rgba(255,255,255,.07)",
      }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Link
            href="/panel/dashboard"
            className="text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-unbounded, inherit)" }}
          >
            PRO-KOM
          </Link>
          <span className="text-xs uppercase tracking-[0.15em] text-[#9ca3af]">
            {panelLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-0.5">
          {navLinks
            .filter((link) => {
              if (!link.roles || !user) return true;
              return link.roles.includes(user.role);
            })
            .map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded px-3 py-2 text-sm transition"
                style={{
                  color: isActive(href) ? "#fff" : "var(--ink2, #8b93a8)",
                  background: isActive(href) ? "rgba(255,255,255,.06)" : "transparent",
                  borderBottom: isActive(href) ? "2px solid var(--red, #dc1e1e)" : "2px solid transparent",
                }}
              >
                {label}
              </Link>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded border border-transparent px-2 py-1.5 text-[13px] transition hover:border-[rgba(255,255,255,.07)] hover:text-[#d0d4de]"
          style={{ color: "var(--ink2, #8b93a8)" }}
        >
          ← Strona główna
        </Link>
        <span className="h-[18px] w-px shrink-0" style={{ background: "rgba(255,255,255,.07)" }} />
        {user ? (
          <>
            <span className="text-[13px]" style={{ color: "var(--ink2, #8b93a8)" }}>
              {user.first_name || user.email}
            </span>
            <span
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, var(--red, #dc1e1e), var(--red-h, #b81818))",
              }}
            >
              {(user.first_name || user.email)[0]?.toUpperCase() ?? "?"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded px-2 py-1.5 text-[13px] transition hover:text-[var(--red)]"
              style={{ color: "var(--ink2, #8b93a8)" }}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <div className="h-5 w-20 rounded bg-white/10" />
        )}
      </div>
    </nav>
  );
}

