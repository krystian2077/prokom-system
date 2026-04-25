"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Home, LogOut } from "lucide-react";
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
      className="panel-nav sticky top-0 z-[200] border-b"
      style={{
        background: "var(--panel-nav-bg)",
        backdropFilter: "blur(20px)",
        borderColor: "var(--panel-nav-border)",
        boxShadow: "0 1px 0 0 var(--panel-nav-border), 0 4px 24px 0 rgba(0,0,0,.18)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1520px] items-center gap-4 px-5 sm:px-7 lg:px-10" style={{ height: 68 }}>

        {/* ── Logo ── */}
        <Link
          href="/client/dashboard"
          className="shrink-0 select-none"
          style={{
            fontFamily: "var(--font-unbounded, inherit)",
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: "-0.02em",
            color: "var(--panel-nav-logo)",
            textDecoration: "none",
          }}
        >
          PRO<span style={{ color: "#dc1e1e" }}>–</span>KOM
        </Link>

        {/* ── Separator ── */}
        <span className="h-6 w-px shrink-0" style={{ background: "var(--panel-nav-border)" }} />

        {/* ── Nav links ── */}
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navLinks.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-xl border px-4 py-2 text-[14px] font-semibold transition-all"
                style={{
                  color: active ? "#fff" : "var(--ink2)",
                  background: active
                    ? "linear-gradient(135deg, #dc1e1e 0%, #b91c1c 100%)"
                    : "transparent",
                  borderColor: active ? "#dc1e1e" : "transparent",
                  boxShadow: active ? "0 2px 10px rgba(220,30,30,.35)" : "none",
                  letterSpacing: "-0.01em",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Right side ── */}
        <div className="ml-auto flex items-center gap-2">

          {/* Strona główna — premium button */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13.5px] font-semibold transition-all hover:scale-[1.03]"
            style={{
              color: "var(--ink2)",
              borderColor: "var(--panel-nav-border)",
              background: "var(--panel-nav-link-active-bg)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            <Home className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            Strona główna
          </Link>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all hover:scale-[1.06]"
            style={{
              borderColor: "var(--panel-nav-border)",
              color: "var(--ink2)",
              background: "var(--panel-nav-link-active-bg)",
            }}
            title={theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
            aria-label={theme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
          >
            {theme === "dark"
              ? <Sun className="h-4 w-4" strokeWidth={2.25} />
              : <Moon className="h-4 w-4" strokeWidth={2.25} />}
          </button>

          {/* Separator */}
          <span className="h-6 w-px shrink-0" style={{ background: "var(--panel-nav-border)" }} />

          {/* User info + logout */}
          {user ? (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white select-none"
                  style={{
                    background: "linear-gradient(135deg, #dc1e1e 0%, #991b1b 100%)",
                    boxShadow: "0 2px 10px rgba(220,30,30,.4)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {user.firstName?.[0]?.toUpperCase() ?? "?"}
                </span>
                <span
                  className="hidden text-[14px] font-semibold sm:block"
                  style={{ color: "var(--heading)", letterSpacing: "-0.01em" }}
                >
                  {user.firstName}
                </span>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-all hover:scale-[1.03]"
                style={{
                  color: "var(--ink2)",
                  borderColor: "var(--panel-nav-border)",
                  background: "var(--panel-nav-link-active-bg)",
                }}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2.3} />
                <span className="hidden sm:inline">Wyloguj</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full" style={{ background: "var(--panel-nav-link-active-bg)", animation: "pulse 2s infinite" }} />
              <div className="hidden h-4 w-20 rounded-lg sm:block" style={{ background: "var(--panel-nav-link-active-bg)", animation: "pulse 2s infinite" }} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
