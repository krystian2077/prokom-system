"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PanelNav } from "@/components/panel/PanelNav";
import { UnverifiedBanner } from "@/components/panel/UnverifiedBanner";
import { useClientProfile } from "@/hooks/useClientProfile";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

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

  useEffect(() => {
    if (loading) return;

    if (!token) {
      if (!isPublicClientPage) {
        const returnUrl = pathname && pathname !== "/client" ? `?returnUrl=${encodeURIComponent(pathname)}` : "";
        router.replace(`/client/login${returnUrl}`);
      }
      return;
    }

    if (isLoginPage || isRegisterPage || isVerifyEmailPage) {
      router.replace("/client/dashboard");
      return;
    }

    if (user && user.role !== "client") {
      router.replace("/");
      return;
    }
  }, [loading, token, user, isLoginPage, isRegisterPage, isVerifyEmailPage, isPublicClientPage, pathname, router]);

  if (loading) {
    return (
      <div className="client-panel flex min-h-[40vh] items-center justify-center">
        <p style={{ color: "var(--ink2)" }}>Ładowanie…</p>
      </div>
    );
  }

  if (!token) {
    if (isPublicClientPage) {
      return (
        <>
          <PublicNavbar />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <PublicFooter />
        </>
      );
    }
    return <>{children}</>;
  }

  if (user?.role === "client") {
    const showUnverifiedBanner = !user?.email_verified && user?.email;
    return (
      <div className="client-panel relative min-h-screen">
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
