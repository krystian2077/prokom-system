"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export function ClientTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/client/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/client/dashboard" className="text-lg font-semibold text-prokom-black">
          PRO-KOM — Panel klienta
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/client/dashboard"
            className="text-sm text-prokom-gray hover:text-prokom-accent"
          >
            Dashboard
          </Link>
          <Link
            href="/client/naprawy"
            className="text-sm text-prokom-gray hover:text-prokom-accent"
          >
            Moje naprawy
          </Link>
          <Link
            href="/client/profil"
            className="text-sm text-prokom-gray hover:text-prokom-accent"
          >
            Profil
          </Link>
          <span className="text-sm text-prokom-gray">
            {user?.first_name || user?.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-prokom-gray hover:text-prokom-accent"
          >
            Wyloguj
          </button>
        </nav>
      </div>
    </header>
  );
}
