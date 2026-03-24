/**
 * Przechowywanie tokena w localStorage (klient).
 * Ciasteczka sesji — dla Next.js middleware (ścieżki /panel, /admin-panel, /client).
 */
const TOKEN_KEY = "prokom_auth_token";
const ROLE_KEY = "prokom_user_role";

/** Nazwy zgodne z PROKOM_DOKUMENTACJA_FRONTEND.md (middleware). */
export const AUTH_COOKIE = "auth_token";
export const ROLE_COOKIE = "user_role";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function setStoredRole(role: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

export function clearStoredRole(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}

/** Aliasy pod dokumentację / axios-interceptory. */
export const getToken = getStoredToken;
export const setToken = setStoredToken;
export const clearToken = clearStoredToken;

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  const enc = encodeURIComponent(value);
  document.cookie = `${name}=${enc}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function setSessionCookies(token: string, role: string): void {
  writeCookie(AUTH_COOKIE, token, COOKIE_MAX_AGE);
  writeCookie(ROLE_COOKIE, role, COOKIE_MAX_AGE);
}

export function clearSessionCookies(): void {
  deleteCookie(AUTH_COOKIE);
  deleteCookie(ROLE_COOKIE);
}
