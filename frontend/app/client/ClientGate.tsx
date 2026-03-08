"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ClientTopbar } from "@/components/layout/ClientTopbar";

export function ClientGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, loading } = useAuth();

  const isLoginPage = pathname === "/client/login";
  const isRegisterPage = pathname === "/client/rejestracja";
  const isPublicClientPage = isLoginPage || isRegisterPage;

  useEffect(() => {
    if (loading) return;

    if (!token) {
      if (!isPublicClientPage) {
        const returnUrl = pathname && pathname !== "/client" ? `?returnUrl=${encodeURIComponent(pathname)}` : "";
        router.replace(`/client/login${returnUrl}`);
      }
      return;
    }

    if (isLoginPage || isRegisterPage) {
      router.replace("/client/dashboard");
      return;
    }

    if (user && user.role !== "client") {
      router.replace("/");
      return;
    }
  }, [loading, token, user, isLoginPage, isRegisterPage, isPublicClientPage, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-prokom-gray">Ładowanie…</p>
      </div>
    );
  }

  if (!token) {
    return <>{children}</>;
  }

  if (user?.role === "client") {
    return (
      <>
        <ClientTopbar />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-prokom-gray">Przekierowanie…</p>
    </div>
  );
}
