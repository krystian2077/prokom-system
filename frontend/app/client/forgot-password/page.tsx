"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function ClientForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setMessage({ type: "error", text: "Podaj adres e-mail." });
      return;
    }
    setMessage(null);
    setSubmitting(true);
    try {
      await api.post<{ detail: string }>("/accounts/request-password-reset/", { email: trimmed });
      setMessage({
        type: "success",
        text: "Jeśli konto z tym adresem istnieje, wysłaliśmy na niego link do resetu hasła. Sprawdź skrzynkę (oraz folder spam).",
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj później.";
      const isRateLimit = text.includes("15 minut");
      setMessage({
        type: isRateLimit ? "error" : "error",
        text,
      });
    } finally {
      setSubmitting(false);
    }
  };

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
              RESET HASŁA
            </div>
            <h2 className="lp-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
              Zapomniałeś hasła?
              <span>Podaj e-mail</span>
            </h2>
            <p className="lp-desc">
              Wyślemy na Twój adres e-mail link do ustawienia nowego hasła. Link jest ważny 1 godzinę.
            </p>
          </div>
        </div>

        <div className="rp">
          <div className="pnl show">
            <div className="pnl-head">
              <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                Wyślij link do resetu
              </h3>
              <p className="pnl-sub">Wpisz adres e-mail powiązany z kontem w panelu klienta</p>
            </div>
            <form onSubmit={handleSubmit} className="fields">
              <div className="fg">
                <label className="lbl" htmlFor="forgot-email">E-mail</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="fi"
                  placeholder="jan@email.pl"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {message && (message.type === "success" ? (
                <p className="text-[12px]" style={{ color: "var(--ink2)" }}>{message.text}</p>
              ) : (
                <ErrorMessage message={message.text} className="mb-3" />
              ))}
              <button type="submit" className="btn-primary group" disabled={submitting}>
                {submitting ? "Wysyłanie…" : "Wyślij link"}
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
