"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WorkerPanelThemeProvider } from "@/contexts/WorkerPanelThemeContext";
import { AdminSidebar } from "@/components/panel/AdminSidebar";
import { PanelTopbar } from "@/components/panel/PanelTopbar";
import { StaffPanelShell } from "@/components/panel/StaffPanelShell";
import { StaffLoginChrome } from "@/components/panel/StaffLoginChrome";
import { WorkerStatusModalRoot } from "@/components/panel/WorkerStatusModalRoot";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/panel/login";

  useEffect(() => {
    if (loading) return;

    // Admin ma pełen dostęp do /admin-panel
    if (!user) {
      if (!isLoginPage) router.replace(`/panel/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role !== "admin") {
      if (!isLoginPage) router.replace("/panel/dashboard");
    }
  }, [user, loading, router, pathname, isLoginPage]);

  return (
    <WorkerPanelThemeProvider>
      {isLoginPage ? (
        <StaffLoginChrome>{children}</StaffLoginChrome>
      ) : (
        <StaffPanelShell>
          <ConfirmProvider>
            <ToastContainer />
            <div className="flex min-h-screen">
              <Suspense
                fallback={
                  <aside className="relative z-[120] hidden w-[352px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--s1)] md:flex" />
                }
              >
                <AdminSidebar />
              </Suspense>
              <div className="flex min-w-0 flex-1 flex-col">
                <PanelTopbar />
                <div className="min-w-0 flex-1">
                  <WorkerStatusModalRoot />
                  {children}
                </div>
              </div>
            </div>
          </ConfirmProvider>
        </StaffPanelShell>
      )}
    </WorkerPanelThemeProvider>
  );
}
