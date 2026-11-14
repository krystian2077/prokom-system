"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { IconCheck } from "@/components/tech/icons";

/**
 * /claim-repair — assigning a repair to the client account with the e-mail link.
 * TD3 PR 3: new skin only; the logic is the previous one 1:1 (KONTRAKT §5).
 */
export default function ClaimRepairPage() {
  const router = useRouter();
  const [tokenFromUrl, setTokenFromUrl] = useState("");
  const { token, loading: authLoading } = useAuth();
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

  let body: React.ReactNode;
  if (status === "success" && message) {
    body = (
      <>
        <span className="t-claim__ok" aria-hidden="true">
          <IconCheck size={24} />
        </span>
        <h1>Naprawa w Twoim koncie</h1>
        <p className="t-lead" role="status">
          {message}
        </p>
        <p className="t-muted">Przekierowanie do listy napraw…</p>
        <Link href="/client/naprawy" className="t-btn t-btn--acc">
          Przejdź do napraw
        </Link>
      </>
    );
  } else if (status === "error" && message) {
    body = (
      <>
        <h1>Nie udało się przypisać naprawy</h1>
        <div className="t-alert" role="alert">
          <p>{message}</p>
        </div>
        <div className="t-claim__actions">
          <Link href="/client/dashboard" className="t-btn t-btn--acc">
            Przejdź do panelu
          </Link>
          <Link href="/track" className="t-btn t-btn--ghost">
            Sprawdź status bez logowania
          </Link>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <h1>Przypisanie naprawy do konta</h1>
        <p className="t-lead" role="status" aria-busy="true">
          {authLoading || status === "claiming" ? "Ładowanie…" : "Przekierowanie…"}
        </p>
      </>
    );
  }

  return (
    <div className="t-ui t-container t-claim">
      <div className="t-card t-claim__card">{body}</div>
    </div>
  );
}
