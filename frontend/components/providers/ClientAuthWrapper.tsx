"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function ClientAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <QueryProvider>
          <ToastContainer />
          {children}
        </QueryProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
