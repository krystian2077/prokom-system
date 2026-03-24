"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PanelNav } from "@/components/panel/PanelNav";
import { UnverifiedBanner } from "@/components/panel/UnverifiedBanner";
import { useClientProfile } from "@/hooks/useClientProfile";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useClientPanelTheme } from "@/contexts/ClientPanelThemeContext";

export function ClientGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, loading } = useAuth();
  const { profile } = useClientProfile();
  const { theme } = useClientPanelTheme();
  const panelClass =
    theme === "light" ? "client-panel client-panel--light" : "client-panel";

  const isLoginPage = pathname === "/client/login";
  const isRegisterPage = pathname === "/client/rejestracja";
  const isVerifyEmailPage = pathname === "/client/verify-email";
  const isForgotPasswordPage = pathname === "/client/forgot-password";
  const isResetPasswordPage = pathname === "/client/reset-password";
  const isPublicClientPage =
    isLoginPage ||
    isRegisterPage ||
    isVerifyEmailPage ||
    isForgotPasswordPage ||
    isResetPasswordPage;

  /** Logowanie / rejestracja / weryfikacja — zalogowany klient jest stąd wyprowadzany na dashboard. */
  const isClientAuthFunnelPage = isLoginPage || isRegisterPage || isVerifyEmailPage;

  useEffect(() => {
    if (loading) return;

    if (!token) {
      if (!isPublicClientPage) {
        const returnUrl = pathname && pathname !== "/client" ? `?returnUrl=${encodeURIComponent(pathname)}` : "";
        router.replace(`/client/login${returnUrl}`);
      }
      return;
    }

    // Staff/admin: tylko chronione trasy /client/* → na stronę główną; logowanie klienta zostaw (np. przełączenie konta).
    if (user && user.role !== "client") {
      if (!isPublicClientPage) {
        router.replace("/");
      }
      return;
    }

    if (user?.role === "client" && isClientAuthFunnelPage) {
      router.replace("/client/dashboard");
      return;
    }
  }, [
    loading,
    token,
    user,
    isLoginPage,
    isRegisterPage,
    isVerifyEmailPage,
    isClientAuthFunnelPage,
    isPublicClientPage,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className={`${panelClass} flex min-h-[40vh] items-center justify-center`}>
        <p style={{ color: "var(--ink2)" }}>Ładowanie…</p>
      </div>
    );
  }

  const showPublicClientAuthShell =
    isPublicClientPage && (!token || (user != null && user.role !== "client"));

  if (showPublicClientAuthShell) {
    return (
      <>
        <PublicNavbar />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <PublicFooter />
      </>
    );
  }

  if (!token) {
    return <>{children}</>;
  }

  if (user?.role === "client" && isClientAuthFunnelPage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-prokom-gray">Przekierowanie…</p>
      </div>
    );
  }

  if (user?.role === "client") {
    const showUnverifiedBanner = !user?.email_verified && user?.email;
    return (
      <div className={`${panelClass} relative min-h-screen`}>
        <PanelNav user={profile} />
        {showUnverifiedBanner && <UnverifiedBanner email={user.email} />}
        <main className="relative z-10 min-h-[calc(100vh-62px)]">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-prokom-gray">Przekierowanie…</p>
    </div>
  );
}
