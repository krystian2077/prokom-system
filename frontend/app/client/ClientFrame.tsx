"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Sign-in screens of the client account: rendered in the PRO-KOM Tech shell. */
export const CLIENT_AUTH_PATHS = [
  "/client/login",
  "/client/rejestracja",
  "/client/verify-email",
  "/client/forgot-password",
  "/client/reset-password",
] as const;

export function isClientAuthPath(pathname: string | null): boolean {
  return CLIENT_AUTH_PATHS.some((p) => pathname === p);
}

/**
 * Picks the frame for /client/*: the Tech shell (header, footer, tab bar) for the sign-in
 * screens, the existing account frame for the rest. Both trees hold the same ClientGate,
 * so redirects and auth logic stay identical. Decided from the pathname, so the server
 * render already has the right frame (no flash of the old header).
 */
export function ClientFrame({ tech, children }: { tech: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  return <>{isClientAuthPath(pathname) ? tech : children}</>;
}
