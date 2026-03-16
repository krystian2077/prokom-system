"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { api } from "@/lib/api";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-unbounded",
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-hover:translate-x-[3px]">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (password !== confirm) {
      setError("Hasła nie są identyczne.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post<{ detail: string }>("/accounts/reset-password/", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => router.replace("/client/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd. Użyj linku z e-maila lub poproś o nowy.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div
        className={`min-h-[60vh] flex flex-col items-center justify-center px-4 ${unbounded.variable} ${plusJakarta.variable}`}
        style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
      >
        <p className="text-[var(--ink2)] mb-4">Brak linku do resetu. Użyj linku z wiadomości e-mail lub poproś o nowy na stronie „Zapomniałeś hasła?”.</p>
        <Link href="/client/forgot-password" className="text-[#dc1e1e] font-semibold hover:underline">Wyślij link do resetu hasła</Link>
        <Link href="/client/login" className="mt-4 text-[var(--ink2)] hover:underline">Logowanie</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className={`login-page ${unbounded.variable} ${plusJakarta.variable}`}
        style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}
      >
        <div className="card">
          <div className="rp" style={{ maxWidth: "400px", margin: "0 auto" }}>
            <div className="pnl show">
              <div className="pnl-head">
                <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                  Hasło zmienione
                </h3>
                <p className="pnl-sub">Za chwilę zostaniesz przekierowany do logowania.</p>
              </div>
              <Link href="/client/login" className="btn-primary group">
                Przejdź do logowania
                <IconArrow />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`login-page ${unbounded.variable} ${plusJakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}
    >
      <div className="card">
        <div className="lp" style={{ minHeight: "320px" }}>
          <Link href="/" className="lp-logo" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900, fontSize: "15px", letterSpacing: "-0.02em", color: "#fff", textDecoration: "none" }}>
            PRO<span style={{ color: "#dc1e1e" }}>–</span>KOM
          </Link>
          <div className="lp-body">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              NOWE HASŁO
            </div>
            <h2 className="lp-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
              Ustaw nowe hasło
              <span>min. 8 znaków</span>
            </h2>
            <p className="lp-desc">
              Wpisz nowe hasło dwukrotnie. Po zapisaniu będziesz mógł się zalogować.
            </p>
          </div>
        </div>

        <div className="rp">
          <div className="pnl show">
            <div className="pnl-head">
              <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                Nowe hasło
              </h3>
              <p className="pnl-sub">Hasło musi mieć co najmniej 8 znaków</p>
            </div>
            <form onSubmit={handleSubmit} className="fields">
              <div className="fg">
                <label className="lbl" htmlFor="reset-password">Hasło</label>
                <input
                  id="reset-password"
                  type="password"
                  className="fi"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="fg">
                <label className="lbl" htmlFor="reset-confirm">Powtórz hasło</label>
                <input
                  id="reset-confirm"
                  type="password"
                  className="fi"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {error && <ErrorMessage message={error} className="mb-3" />}
              <button type="submit" className="btn-primary group" disabled={submitting}>
                {submitting ? "Zapisywanie…" : "Zapisz hasło"}
                <IconArrow />
              </button>
            </form>
            <Link href="/client/login" className="back mt-6">
              <IconChevronLeft />
              Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Ładowanie…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
