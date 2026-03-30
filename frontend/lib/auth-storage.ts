/**
 * Przechowywanie tokena w sessionStorage (per-karta przeglądarki).
 *
 * DLACZEGO sessionStorage zamiast localStorage?
 * localStorage jest współdzielony między wszystkimi kartami tej samej przeglądarki.
 * W systemie wieloużytkownikowym (np. 5 pracowników na różnych kontach w tej samej
 * przeglądarce) każda karta musi mieć niezależną sesję. sessionStorage jest izolowany
 * per-karta — zamknięcie karty = koniec sesji, inne karty nie są dotknięte.
 */

const TOKEN_KEY = "prokom_auth_token";
const ROLE_KEY = "prokom_user_role";

/** Nazwy eksportowane dla zgodności wstecznej (middleware już ich nie używa). */
export const AUTH_COOKIE = "auth_token";
export const ROLE_COOKIE = "user_role";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ROLE_KEY);
}

export function setStoredRole(role: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ROLE_KEY, role);
}

export function clearStoredRole(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ROLE_KEY);
}

/** Aliasy pod dokumentację / axios-interceptory. */
export const getToken = getStoredToken;
export const setToken = setStoredToken;
export const clearToken = clearStoredToken;

/**
 * Ciasteczka sesji — zachowane jako no-op.
 * Middleware nie używa już ciasteczek do ochrony tras (guardy są client-side w layoutach).
 * Ciasteczka były źródłem cross-tab contamination — każde logowanie nadpisywało
 * ciasteczka innych zalogowanych użytkowników w tej samej przeglądarce.
 */
export function setSessionCookies(_token: string, _role: string): void {
  // intentionally empty — see comment above
}

export function clearSessionCookies(): void {
  // intentionally empty — see comment above
  // Czyścimy ewentualne stare ciasteczka z poprzedniej wersji
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}
