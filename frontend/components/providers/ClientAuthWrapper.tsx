"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastContainer } from "@/components/ui/Toast";

/**
 * Opakowuje całą aplikację w AuthProvider, żeby stan logowania
 * (token, user) był dostępny na każdej stronie — także na stronie głównej
 * i przy zgłoszeniu naprawy — i żeby użytkownik pozostawał zalogowany
 * przy nawigacji między stronami.
 */
export function ClientAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ToastContainer />
        {children}
      </QueryProvider>
    </AuthProvider>
  );
}
