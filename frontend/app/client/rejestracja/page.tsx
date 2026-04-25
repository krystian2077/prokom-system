"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { useAuth } from "@/contexts/AuthContext";
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

export default function ClientRejestracjaPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postal_code, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await register({
      email,
      password,
      first_name,
      last_name,
      phone,
      street: street || undefined,
      city: city || undefined,
      postal_code: postal_code || undefined,
    });
    setSubmitting(false);
    if (result.ok && result.email) {
      router.push(`/client/verify-email?email=${encodeURIComponent(result.email)}`);
      return;
    }
    setError(result.error || "Rejestracja nie powiodła się.");
  };

  return (
    <div
      className={`login-page ${unbounded.variable} ${plusJakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}
    >
      <div className="card !max-w-[620px] !grid-cols-1 !min-h-0">
        <div className="login-mobile-brand">
          <Link href="/" className="brand-name" style={{ fontFamily: "var(--font-unbounded)" }}>
            PRO<span>–</span>KOM
          </Link>
          <span className="brand-tagline">Panel Klienta</span>
        </div>
        <div className="rp">
          <div className="pnl show">
            <div className="pnl-head">
              <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                Utwórz konto
              </h3>
              <p className="pnl-sub">Załóż konto, aby śledzić naprawy i zarządzać profilem</p>
            </div>
            <form onSubmit={handleSubmit} className="fields">
              <div className="fg2">
                <div className="fg">
                  <label className="lbl" htmlFor="reg-fname">Imię</label>
                  <input
                    id="reg-fname"
                    type="text"
                    className="fi"
                    placeholder="Imię"
                    autoComplete="given-name"
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
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
                    value={last_name}
                    onChange={(e) => setLastName(e.target.value)}
                    required
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
                  required
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
                  required
                />
              </div>
              <div className="fg">
                <label className="lbl" htmlFor="reg-password">Hasło (min. 8 znaków)</label>
                <input
                  id="reg-password"
                  type="password"
                  className="fi"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="fg">
                <label className="lbl" htmlFor="reg-street">Ulica i numer (opcjonalnie)</label>
                <input
                  id="reg-street"
                  type="text"
                  className="fi"
                  placeholder="ul. Przykładowa 12"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="fg2">
                <div className="fg">
                  <label className="lbl" htmlFor="reg-city">Miasto</label>
                  <input
                    id="reg-city"
                    type="text"
                    className="fi"
                    placeholder="Miasto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="reg-postal">Kod pocztowy</label>
                  <input
                    id="reg-postal"
                    type="text"
                    className="fi"
                    placeholder="00-000"
                    value={postal_code}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
              {error && <ErrorMessage message={error} className="mb-3" />}
              <button type="submit" className="btn-primary group" disabled={submitting}>
                {submitting ? "Tworzenie konta…" : "Zarejestruj się"}
                <IconArrow />
              </button>
            </form>
            <p className="pnl-footer">
              Masz już konto?{" "}
              <Link href="/client/login">Zaloguj się</Link>
            </p>
            <Link href="/" className="back">
              <IconChevronLeft />
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
