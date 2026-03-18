"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, getErrorMessageFromBody } from "@/lib/api";
import { getStoredToken, setStoredToken, clearStoredToken } from "@/lib/auth-storage";
import type { User } from "@/types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  street?: string;
  city?: string;
  postal_code?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  staffLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  resendVerificationCode: (email: string) => Promise<{ ok: boolean; error?: string; retryAfterSeconds?: number }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>("/accounts/me/", t);
      setToken(t);
      setUser(me as User);
    } catch {
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> => {
      try {
        const res = await api.post<{ token: string; user: User }>("/accounts/login/", {
          email: email.trim().toLowerCase(),
          password,
        });
        const data = res as { token: string; user: User };
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return { ok: true, user: data.user };
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Nieprawidłowy e-mail lub hasło.";
        const msg =
          raw === "Failed to fetch" || raw.includes("fetch")
            ? "Nie można połączyć z serwerem. Upewnij się, że backend jest uruchomiony (port 8000)."
            : raw;
        return { ok: false, error: msg };
      }
    },
    []
  );

  const staffLogin = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> => {
      try {
        const res = await api.post<{ token: string; user: User }>("/accounts/staff-login/", {
          email: email.trim().toLowerCase(),
          password,
        });
        const data = res as { token: string; user: User };
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return { ok: true, user: data.user };
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Nieprawidłowy e-mail lub hasło.";
        const msg =
          raw === "Failed to fetch" || raw.includes("fetch")
            ? "Nie można połączyć z serwerem. Upewnij się, że backend jest uruchomiony (port 8000)."
            : raw;
        return { ok: false, error: msg };
      }
    },
    []
  );

  const register = useCallback(
    async (data: RegisterData): Promise<{ ok: boolean; error?: string; email?: string }> => {
      try {
        const body = {
          email: data.email.trim().toLowerCase(),
          password: data.password,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          phone: data.phone.trim(),
          street: (data.street || "").trim(),
          city: (data.city || "").trim(),
          postal_code: (data.postal_code || "").trim(),
        };
        const res = await api.post<{ email: string }>("/accounts/register/", body);
        const out = res as { email: string };
        return { ok: true, email: out.email };
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Rejestracja nie powiodła się.";
        const msg =
          raw === "Failed to fetch" || raw.includes("fetch")
            ? "Nie można połączyć z serwerem. Upewnij się, że backend jest uruchomiony (np. python manage.py runserver na porcie 8000)."
            : raw;
        return { ok: false, error: msg };
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, code: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await api.post<{ token: string; user: User }>("/accounts/verify-email/", {
          email: email.trim().toLowerCase(),
          code: code.trim(),
        });
        const data = res as { token: string; user: User };
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return { ok: true };
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Nieprawidłowy kod.";
        const msg =
          raw === "Failed to fetch" || raw.includes("fetch")
            ? "Nie można połączyć z serwerem."
            : raw;
        return { ok: false, error: msg };
      }
    },
    []
  );

  const resendVerificationCode = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string; retryAfterSeconds?: number }> => {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/accounts/resend-verification-code/`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const errBody = await res.text();
        if (res.ok) {
          return { ok: true };
        }
        const body = (() => { try { return JSON.parse(errBody); } catch { return {}; } })();
        const detail = getErrorMessageFromBody(errBody, "Wystąpił błąd.");
        const retryAfter = res.headers.get("Retry-After");
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : (body?.retry_after_seconds as number | undefined);
        return { ok: false, error: detail, retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined };
      } catch {
        return { ok: false, error: "Nie można połączyć z serwerem." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const t = getStoredToken();
    if (t) {
      try {
        await api.post("/accounts/logout/", undefined, t);
      } catch {
        // ignore
      }
      clearStoredToken();
    }
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    loading,
    login,
    staffLogin,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
