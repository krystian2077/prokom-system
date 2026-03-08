"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
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
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
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
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await api.post<{ token: string; user: User }>("/accounts/login/", {
          email: email.trim().toLowerCase(),
          password,
        });
        const data = res as { token: string; user: User };
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return { ok: true };
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
    async (data: RegisterData): Promise<{ ok: boolean; error?: string }> => {
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
        const res = await api.post<{ token: string; user: User }>("/accounts/register/", body);
        const out = res as { token: string; user: User };
        setStoredToken(out.token);
        setToken(out.token);
        setUser(out.user);
        return { ok: true };
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
    register,
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
