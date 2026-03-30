import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — przekazuje wszystkie żądania dalej.
 *
 * Ochrona tras odbywa się client-side w layoutach:
 *   - app/panel/layout.tsx       → guard dla roli staff/admin
 *   - app/admin-panel/layout.tsx → guard tylko dla roli admin
 *   - app/client/ClientGate.tsx  → guard dla klientów
 *
 * Dlaczego usunięto cookie-based auth z middleware?
 * Ciasteczka są współdzielone między wszystkimi kartami przeglądarki.
 * W systemie wieloużytkownikowym (wielu pracowników zalogowanych jednocześnie
 * na różnych kartach) logowanie jednej osoby nadpisywało ciasteczka innej,
 * powodując błędne przekierowania. Token sesji jest teraz przechowywany
 * w sessionStorage (per-karta), do którego middleware nie ma dostępu.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin-panel/:path*", "/client/:path*"],
};
