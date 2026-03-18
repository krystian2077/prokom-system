"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

export default function ClaimRepairPage() {
  const router = useRouter();
  const [tokenFromUrl, setTokenFromUrl] = useState("");
  const { token, user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTokenFromUrl(sp.get("token") ?? "");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token && !getStoredToken()) {
      const returnUrl = `/claim-repair${tokenFromUrl ? `?token=${encodeURIComponent(tokenFromUrl)}` : ""}`;
      router.replace(`/client/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if ((token || getStoredToken()) && tokenFromUrl && status === "idle") {
      setStatus("claiming");
      const authToken = token || getStoredToken();
      api
        .post<{ repair_number?: string; message?: string }>("/repairs/claim/", { token: tokenFromUrl }, authToken)
        .then((data) => {
          setMessage((data as { message?: string }).message ?? "Naprawa została przypisana do Twojego konta.");
          setStatus("success");
          setTimeout(() => router.replace("/client/naprawy"), 2500);
        })
        .catch((e) => {
          setMessage(e instanceof Error ? e.message : "Nie udało się przypisać naprawy.");
          setStatus("error");
        });
    } else if ((token || getStoredToken()) && !tokenFromUrl) {
      setStatus("error");
      setMessage("Brak tokenu w linku. Użyj linku z wiadomości e-mail.");
    }
  }, [authLoading, token, tokenFromUrl, router, status]);

  if (authLoading || status === "claiming") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-[var(--muted)]">Ładowanie…</p>
      </div>
    );
  }

  if (status === "success" && message) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-medium text-white">{message}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">Przekierowanie do listy napraw…</p>
        <Link href="/client/naprawy" className="mt-6 text-[var(--red)] underline hover:no-underline">
          Przejdź do napraw
        </Link>
      </div>
    );
  }

  if (status === "error" && message) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-red-400">{message}</p>
        <Link href="/client/dashboard" className="mt-6 text-[var(--red)] underline hover:no-underline">
          Przejdź do panelu
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <p className="text-[var(--muted)]">Przekierowanie…</p>
    </div>
  );
}
