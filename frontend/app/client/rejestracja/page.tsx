"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/tech/account/AuthScreen";
import { AuthAlert, AuthField, PasswordField, SubmitButton } from "@/components/tech/account/AuthParts";

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
    <AuthScreen
      eyebrow="Konto klienta"
      title="Załóż konto"
      lead="Załóż konto, aby śledzić naprawy i zarządzać profilem."
      back={{ href: "/", label: "Wróć na stronę główną" }}
    >
      <form onSubmit={handleSubmit} className="t-ck-form">
        <div className="t-ck-grid2">
          <AuthField
            id="reg-fname"
            label="Imię"
            placeholder="np. Anna"
            autoComplete="given-name"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <AuthField
            id="reg-lname"
            label="Nazwisko"
            placeholder="np. Nowak"
            autoComplete="family-name"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <AuthField
          id="reg-email"
          type="email"
          label="E-mail"
          placeholder="np. anna@poczta.pl"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          id="reg-phone"
          type="tel"
          label="Telefon"
          placeholder="np. 600 100 200"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <PasswordField
          id="reg-password"
          label="Hasło"
          placeholder="Min. 8 znaków"
          autoComplete="new-password"
          hint="Co najmniej 8 znaków."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <fieldset className="t-ck-fieldset">
          <legend>
            Adres <em>— opcjonalnie</em>
          </legend>
          <AuthField
            id="reg-street"
            label="Ulica i numer"
            placeholder="np. ul. Słoneczna 12"
            autoComplete="street-address"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <div className="t-ck-grid2">
            <AuthField
              id="reg-city"
              label="Miasto"
              placeholder="np. Rabka-Zdrój"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <AuthField
              id="reg-postal"
              label="Kod pocztowy"
              placeholder="00-000"
              autoComplete="postal-code"
              inputMode="numeric"
              value={postal_code}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
        </fieldset>
        {error && <AuthAlert>{error}</AuthAlert>}
        <SubmitButton busy={submitting} busyLabel="Tworzenie konta…">
          Zarejestruj się
        </SubmitButton>
        <p className="t-ck-switch">
          Masz już konto?{" "}
          <Link href="/client/login" className="t-ck-link">
            Zaloguj się
          </Link>
        </p>
      </form>
    </AuthScreen>
  );
}
