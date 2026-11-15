"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PanelNav } from "@/components/panel/PanelNav";
import { UnverifiedBanner } from "@/components/panel/UnverifiedBanner";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientPanelTheme } from "@/contexts/ClientPanelThemeContext";
import { AccountStatus } from "@/components/tech/account/AccountStatus";

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

  // Sign-in screens render inside the Tech shell (ClientFrame) — Tech look for every state.
  if (loading && isPublicClientPage) {
    return <AccountStatus>Ładowanie…</AccountStatus>;
  }

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
    return <>{children}</>;
  }

  if (!token) {
    return <>{children}</>;
  }

  if (user?.role === "client" && isClientAuthFunnelPage) {
    return <AccountStatus>Przekierowanie…</AccountStatus>;
  }

  if (user?.role === "client") {
    const showUnverifiedBanner = !user?.email_verified && user?.email;
    return (
      <div className={`${panelClass} relative min-h-screen`}>
        <PanelNav user={profile} />
        {showUnverifiedBanner && <UnverifiedBanner email={user.email} />}
        <main className="relative z-10 min-h-[calc(100dvh-68px)] overflow-x-hidden pb-[calc(env(safe-area-inset-bottom,0px)+100px)] sm:pb-8">{children}</main>
      </div>
    );
  }

  if (isPublicClientPage) {
    return <AccountStatus>Przekierowanie…</AccountStatus>;
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-prokom-gray">Przekierowanie…</p>
    </div>
  );
}
