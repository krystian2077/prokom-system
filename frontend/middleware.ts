import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, ROLE_COOKIE } from "@/lib/auth-storage";

const PUBLIC_CLIENT_PREFIXES = [
  "/client/login",
  "/client/rejestracja",
  "/client/forgot-password",
  "/client/reset-password",
  "/client/verify-email",
];

function isPublicClientPath(path: string): boolean {
  return PUBLIC_CLIENT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const role = req.cookies.get(ROLE_COOKIE)?.value;
  const path = req.nextUrl.pathname;

  if (!token) {
    if (path.startsWith("/panel") && !path.startsWith("/panel/login")) {
      return NextResponse.redirect(new URL("/panel/login", req.url));
    }
    if (path.startsWith("/admin-panel")) {
      return NextResponse.redirect(new URL("/panel/login", req.url));
    }
    if (path.startsWith("/client") && !isPublicClientPath(path)) {
      return NextResponse.redirect(new URL("/client/login", req.url));
    }
  }

  if (path.startsWith("/admin-panel") && role !== "admin") {
    return NextResponse.redirect(new URL("/panel/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin-panel/:path*", "/client/:path*"],
};
