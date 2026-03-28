"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientPanelTheme } from "@/contexts/ClientPanelThemeContext";
import type { ClientProfile } from "@/types/panel";

interface PanelNavProps {
  user: ClientProfile | null;
}

const navLinks = [
  { href: "/client/dashboard", label: "Dashboard" },
  { href: "/client/naprawy", label: "Moje naprawy" },
  { href: "/client/profil", label: "Profil" },
];

export function PanelNav({ user }: PanelNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useClientPanelTheme();

  const isActive = (href: string) =>
    href === "/client/naprawy" ? pathname.startsWith("/client/naprawy") : pathname === href;

  const handleLogout = async () => {
    await logout();
    router.push("/client/login");
  };

  return (
    <nav
      className="panel-nav sticky top-0 z-[200] flex h-[62px] items-center justify-between border-b px-6"
      style={{
        background: "var(--panel-nav-bg)",
        backdropFilter: "blur(24px)",
        borderColor: "var(--panel-nav-border)",
      }}
    >
      <div className="flex items-center gap-8">
        <Link
          href="/client/dashboard"
          className="text-lg font-bold"
          style={{
            fontFamily: "var(--font-unbounded, inherit)",
            color: "var(--panel-nav-logo)",
          }}
        >
          PRO-KOM
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded px-3 py-2 text-sm transition"
              style={{
                color: isActive(href) ? "var(--heading)" : "var(--ink2)",
                background: isActive(href) ? "var(--panel-nav-link-active-bg)" : "transparent",
                borderBottom: isActive(href) ? "2px solid var(--red, #dc1e1e)" : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition hover:opacity-90"
          style={{
            borderColor: "var(--panel-nav-border)",
            color: "var(--ink2)",
            background: "var(--panel-nav-link-active-bg)",
          }}
          title={theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
          aria-label={theme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={2.25} /> : <Moon className="h-4 w-4" strokeWidth={2.25} />}
        </button>
        <Link
          href="/"
          className="rounded border border-transparent px-2 py-1.5 text-[13px] transition"
          style={{
            color: "var(--ink2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--panel-nav-home-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--ink2)";
          }}
        >
          ← Strona główna
        </Link>
        <span
          className="h-[18px] w-px shrink-0"
          style={{ background: "var(--panel-nav-divider)" }}
        />
        {user ? (
          <>
            <span className="text-[13px]" style={{ color: "var(--ink2)" }}>
              {user.firstName}
            </span>
            <span
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-[var(--white)]"
              style={{
                background: "linear-gradient(135deg, var(--red), var(--red-h))",
              }}
            >
              {user.firstName?.[0]?.toUpperCase() ?? "?"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded px-2 py-1.5 text-[13px] transition hover:text-[var(--red)]"
              style={{ color: "var(--ink2)" }}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <div className="skeleton h-5 w-20 rounded" style={{ minWidth: 80 }} />
        )}
      </div>
    </nav>
  );
}
