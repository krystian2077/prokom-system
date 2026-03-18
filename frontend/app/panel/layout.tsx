"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WorkerSidebar } from "@/components/panel/WorkerSidebar";
import { PanelTopbar } from "@/components/panel/PanelTopbar";
import { Toaster } from "@/components/panel/Toaster";
import { WorkerStatusModalRoot } from "@/components/panel/WorkerStatusModalRoot";

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
    } else if (isLoginPage) {
      router.replace("/panel/dashboard");
    }
  }, [user, loading, router, isLoginPage, pathname]);

  return (
    <div className="min-h-screen bg-[#07080c] text-white">
      {isLoginPage ? (
        children
      ) : (
        <div className="flex min-h-screen">
          <WorkerSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <PanelTopbar />
            <div className="min-w-0 flex-1">
              <Toaster />
              <WorkerStatusModalRoot />
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

