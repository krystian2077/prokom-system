"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
        background: "rgba(7,8,12,.92)",
        backdropFilter: "blur(24px)",
        borderColor: "rgba(255,255,255,.07)",
      }}
    >
      <div className="flex items-center gap-8">
        <Link
          href="/client/dashboard"
          className="text-lg font-bold text-white"
          style={{ fontFamily: "var(--font-unbounded, inherit)" }}
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
        <span
          className="h-[18px] w-px shrink-0"
          style={{ background: "rgba(255,255,255,.07)" }}
        />
        {user ? (
          <>
            <span
              className="text-[13px]"
              style={{ color: "var(--ink2, #8b93a8)" }}
            >
              {user.firstName}
            </span>
            <span
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
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
              style={{ color: "var(--ink2, #8b93a8)" }}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <div
            className="skeleton h-5 w-20 rounded"
            style={{ minWidth: 80 }}
          />
        )}
      </div>
    </nav>
  );
}
