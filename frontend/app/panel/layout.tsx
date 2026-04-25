"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WorkerPanelThemeProvider } from "@/contexts/WorkerPanelThemeContext";
import { WorkerSidebar } from "@/components/panel/WorkerSidebar";
import { PanelTopbar } from "@/components/panel/PanelTopbar";
import { StaffPanelShell } from "@/components/panel/StaffPanelShell";
import { StaffLoginChrome } from "@/components/panel/StaffLoginChrome";
import { WorkerStatusModalRoot } from "@/components/panel/WorkerStatusModalRoot";
import { MobilePanelNavigation } from "@/components/panel/MobilePanelNavigation";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";

const pageAnimationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .page-transition {
    animation: fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
`;

export default function PanelLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/panel/login";

  useEffect(() => {
    if (loading) return;
    if (!user || !["staff", "admin"].includes(user.role)) {
      if (!isLoginPage) {
        router.replace("/panel/login");
      }
      return;
    }

    // Admin nie powinien korzystać z /panel/* — zawsze kieruj do /admin-panel/*
    if (user.role === "admin") {
      if (isLoginPage) {
        router.replace("/admin-panel/dashboard");
      } else if (pathname.startsWith("/panel")) {
        router.replace("/admin-panel/dashboard");
      }
      return;
    }

    if (isLoginPage) {
      router.replace("/panel/dashboard");
    }
  }, [user, loading, router, isLoginPage, pathname]);

  return (
    <WorkerPanelThemeProvider>
      <style>{pageAnimationStyles}</style>
      {isLoginPage ? (
        <StaffLoginChrome>{children}</StaffLoginChrome>
      ) : (
        <StaffPanelShell>
          <ConfirmProvider>
            <ToastContainer />
            <div className="flex min-h-screen">
              <Suspense
                fallback={
                  <aside className="relative z-[120] hidden w-[352px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--s1)] lg:flex" />
                }
              >
                <WorkerSidebar />
              </Suspense>
              <div className="flex min-w-0 flex-1 flex-col">
                <PanelTopbar />
                <div className="min-w-0 flex-1 pb-24 lg:pb-0">
                  <WorkerStatusModalRoot />
                  <div key={pathname} className="page-transition">
                    {children}
                  </div>
                </div>
              </div>
            </div>
            <MobilePanelNavigation />
          </ConfirmProvider>
        </StaffPanelShell>
      )}
    </WorkerPanelThemeProvider>
  );
}
