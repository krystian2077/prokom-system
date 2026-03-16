"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { apiClientProfileToPanel, type ApiClientProfile } from "@/lib/panel-api";
import type { ClientProfile } from "@/types/panel";

export function useClientProfile(): {
  profile: ClientProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<ApiClientProfile>("/clients/me/", token)
      .then((data) => setProfile(apiClientProfileToPanel(data)))
      .catch((e) => setError(e instanceof Error ? e.message : "Błąd ładowania"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setProfile(null);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError(null);
    api
      .get<ApiClientProfile>("/clients/me/", token)
      .then((data) => {
        if (!cancelled) setProfile(apiClientProfileToPanel(data));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Błąd ładowania");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { profile, loading, error, refetch: fetchProfile };
}
