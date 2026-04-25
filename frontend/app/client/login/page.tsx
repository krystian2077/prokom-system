"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterData } from "@/contexts/AuthContext";
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

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-hover:translate-x-[3px]">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={18} height={18}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const FEATURES = [
  { emoji: "🔧", name: "Status naprawy na żywo", desc: "Sprawdź co dzieje się z Twoim sprzętem" },
  { emoji: "📋", name: "Historia wszystkich zleceń", desc: "Faktury, raporty i szczegóły napraw" },
  { emoji: "🛡️", name: "Gwarancja pod kontrolą", desc: "Daty ważności i warunki gwarancji" },
] as const;

export default function ClientLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/client/dashboard";
  const { login, register, loginWithGoogle } = useAuth();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      if (result.user && !result.user.email_verified) {
        router.push(`/client/verify-email?email=${encodeURIComponent(result.user.email)}`);
        return;
      }
      router.push(returnUrl);
      return;
    }
    setError(result.error || "Nieprawidłowy e-mail lub hasło.");
  };

  const handleRegister = async () => {
    setError(null);
    setSubmitting(true);
    const data: RegisterData = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
    };
    const result = await register(data);
    setSubmitting(false);
    if (result.ok && result.email) {
      router.push(`/client/verify-email?email=${encodeURIComponent(result.email)}`);
      return;
    }
    if (result.ok) {
      router.push(returnUrl);
      return;
    }
    setError(result.error || "Rejestracja nie powiodła się.");
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setError(null);
    setSubmitting(true);
    const result = await loginWithGoogle(accessToken);
    setSubmitting(false);
    if (result.ok) {
      router.push(returnUrl);
      return;
    }
    setError(result.error || "Logowanie przez Google nie powiodło się.");
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (response) => void handleGoogleSuccess(response.access_token),
    onError: () => setError("Logowanie przez Google nie powiodło się. Spróbuj ponownie."),
  });

  const switchToRegister = () => {
    setTab("register");
    setError(null);
  };
  const switchToLogin = () => {
    setTab("login");
    setError(null);
  };

  return (
    <div
      className={`login-page ${unbounded.variable} ${plusJakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}
    >
      <div className="card">
        <div className="login-mobile-brand">
          <Link href="/" className="brand-name" style={{ fontFamily: "var(--font-unbounded)" }}>
            PRO<span>–</span>KOM
          </Link>
          <span className="brand-tagline">Panel Klienta</span>
        </div>
        <div className="lp">
          <Link href="/" className="lp-logo" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900, fontSize: "15px", letterSpacing: "-0.02em", color: "#fff", textDecoration: "none" }}>
            PRO<span style={{ color: "#dc1e1e" }}>–</span>KOM
          </Link>
          <div className="lp-body">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              PANEL KLIENTA
            </div>
            <h2 className="lp-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
              Twoje naprawy
              <span>w jednym miejscu.</span>
            </h2>
            <p className="lp-desc">
              Śledź status naprawy na żywo, przeglądaj historię zleceń i zarządzaj profilem klienta.
            </p>
          </div>
          <div className="lp-features">
            {FEATURES.map((f) => (
              <div key={f.name} className="feat">
                <div className="feat-icon">{f.emoji}</div>
                <div>
                  <div className="feat-name">{f.name}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rp">
          <div className="tabs">
            <button type="button" className={`tab ${tab === "login" ? "on" : ""}`} onClick={switchToLogin}>
              Logowanie
            </button>
            <button type="button" className={`tab ${tab === "register" ? "on" : ""}`} onClick={switchToRegister}>
              Rejestracja
            </button>
          </div>

          {tab === "login" && (
            <div key="login" id="p-login" className="pnl show">
              <div className="pnl-head">
                <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                  Witaj ponownie
                </h3>
                <p className="pnl-sub">Zaloguj się do swojego konta PRO-KOM</p>
              </div>
              <div className="fields">
                <div className="fg">
                  <label className="lbl" htmlFor="login-email">E-mail</label>
                  <input
                    id="login-email"
                    type="email"
                    className="fi"
                    placeholder="jan@email.pl"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="login-password">Hasło</label>
                  <input
                    id="login-password"
                    type="password"
                    className="fi"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Link href="/client/forgot-password" className="forgot-link">Zapomniałeś hasła?</Link>
                </div>
                {error && <ErrorMessage message={error} className="mb-3" />}
                <button type="button" className="btn-primary group" onClick={handleLogin} disabled={submitting}>
                  {submitting ? "Logowanie…" : "Zaloguj się"}
                  <IconArrow />
                </button>
              </div>
              <div className="sep">
                <span className="sep-line" />
                <span className="sep-txt">lub kontynuuj z</span>
                <span className="sep-line" />
              </div>
              <button type="button" className="btn-google" onClick={() => googleLogin()} disabled={submitting}>
                <IconGoogle />
                Kontynuuj z Google
              </button>
              <p className="pnl-footer">
                Nie masz konta? <button type="button" onClick={switchToRegister} className="bg-transparent border-0 cursor-pointer p-0 font-inherit text-inherit" style={{ color: "#dc1e1e", fontWeight: 700 }}>Zarejestruj się</button>
              </p>
              <Link href="/" className="back">
                <IconChevronLeft />
                Wróć na stronę główną
              </Link>
            </div>
          )}

          {tab === "register" && (
            <div key="register" id="p-register" className="pnl show">
              <div className="pnl-head">
                <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                  Utwórz konto
                </h3>
                <p className="pnl-sub">Dołącz do panelu klienta PRO-KOM</p>
              </div>
              <div className="fields">
                <div className="fg2">
                  <div className="fg">
                    <label className="lbl" htmlFor="reg-fname">Imię</label>
                    <input
                      id="reg-fname"
                      type="text"
                      className="fi"
                      placeholder="Imię"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="fg">
                    <label className="lbl" htmlFor="reg-lname">Nazwisko</label>
                    <input
                      id="reg-lname"
                      type="text"
                      className="fi"
                      placeholder="Nazwisko"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="reg-email">E-mail</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="fi"
                    placeholder="jan@email.pl"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="reg-phone">Telefon</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="fi"
                    placeholder="600 123 456"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="reg-password">Hasło</label>
                  <input
                    id="reg-password"
                    type="password"
                    className="fi"
                    placeholder="Min. 8 znaków"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <ErrorMessage message={error} className="mb-3" />}
                <button type="button" className="btn-primary group" onClick={handleRegister} disabled={submitting}>
                  {submitting ? "Tworzenie konta…" : "Utwórz konto"}
                  <IconArrow />
                </button>
              </div>
              <div className="sep">
                <span className="sep-line" />
                <span className="sep-txt">lub kontynuuj z</span>
                <span className="sep-line" />
              </div>
              <button type="button" className="btn-google" onClick={() => googleLogin()} disabled={submitting}>
                <IconGoogle />
                Kontynuuj z Google
              </button>
              <p className="pnl-footer">
                Masz już konto? <button type="button" onClick={switchToLogin} className="bg-transparent border-0 cursor-pointer p-0 font-inherit text-inherit" style={{ color: "#dc1e1e", fontWeight: 700 }}>Zaloguj się</button>
              </p>
              <Link href="/" className="back">
                <IconChevronLeft />
                Wróć na stronę główną
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
