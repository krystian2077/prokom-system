"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useClientProfile } from "@/hooks/useClientProfile";
import { AccountShell } from "@/components/tech/account/AccountShell";
import { AccountStatus } from "@/components/tech/account/AccountStatus";

export function ClientGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, loading } = useAuth();
  const { profile } = useClientProfile();

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

  // Every /client screen renders inside the Tech shell (app/client/layout.tsx).
  if (loading) {
    return <AccountStatus>Ładowanie…</AccountStatus>;
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
      <AccountShell user={profile} email={user.email} unverified={Boolean(showUnverifiedBanner)}>
        {children}
      </AccountShell>
    );
  }

  return <AccountStatus>Przekierowanie…</AccountStatus>;
}
