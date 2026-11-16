"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterData } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/tech/account/AuthScreen";
import { AuthAlert, AuthField, GoogleButton, OrDivider, PasswordField, SubmitButton } from "@/components/tech/account/AuthParts";

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
    <AuthScreen
      eyebrow="Konto klienta"
      title={tab === "login" ? "Zaloguj się" : "Załóż konto"}
      lead={tab === "login" ? "Sprawdź status swoich napraw i historię zleceń." : "Konto pozwala śledzić naprawy i zarządzać profilem."}
      back={{ href: "/", label: "Wróć na stronę główną" }}
    >
      <div className="t-ck-tabs" role="tablist" aria-label="Logowanie albo rejestracja">
        <span className="t-ck-tabs__pill" data-on={tab} aria-hidden="true" />
        <button
          type="button"
          role="tab"
          id="tab-login"
          aria-selected={tab === "login"}
          aria-controls="p-login"
          className={tab === "login" ? "is-on" : undefined}
          onClick={switchToLogin}
        >
          Logowanie
        </button>
        <button
          type="button"
          role="tab"
          id="tab-register"
          aria-selected={tab === "register"}
          aria-controls="p-register"
          className={tab === "register" ? "is-on" : undefined}
          onClick={switchToRegister}
        >
          Rejestracja
        </button>
      </div>

      {tab === "login" && (
        <form
          key="login"
          id="p-login"
          role="tabpanel"
          aria-labelledby="tab-login"
          className="t-ck-form t-ck-panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
        >
          <AuthField
            id="login-email"
            type="email"
            label="E-mail"
            placeholder="np. anna@poczta.pl"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField
            id="login-password"
            label="Hasło"
            placeholder="Twoje hasło"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aside={
              <Link href="/client/forgot-password" className="t-ck-link t-ck-link--sm">
                Nie pamiętasz hasła?
              </Link>
            }
          />
          {error && <AuthAlert>{error}</AuthAlert>}
          <SubmitButton busy={submitting} busyLabel="Logowanie…">
            Zaloguj się
          </SubmitButton>
          <OrDivider />
          <GoogleButton onClick={() => googleLogin()} disabled={submitting} />
          <p className="t-ck-switch">
            Nie masz konta?{" "}
            <button type="button" className="t-ck-link" onClick={switchToRegister}>
              Zarejestruj się
            </button>
          </p>
        </form>
      )}

      {tab === "register" && (
        <form
          key="register"
          id="p-register"
          role="tabpanel"
          aria-labelledby="tab-register"
          className="t-ck-form t-ck-panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleRegister();
          }}
        >
          <div className="t-ck-grid2">
            <AuthField
              id="reg-fname"
              label="Imię"
              placeholder="np. Anna"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <AuthField
              id="reg-lname"
              label="Nazwisko"
              placeholder="np. Nowak"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
          />
          <PasswordField
            id="reg-password"
            label="Hasło"
            placeholder="Min. 8 znaków"
            autoComplete="new-password"
            hint="Co najmniej 8 znaków."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <AuthAlert>{error}</AuthAlert>}
          <SubmitButton busy={submitting} busyLabel="Tworzenie konta…">
            Utwórz konto
          </SubmitButton>
          <OrDivider />
          <GoogleButton onClick={() => googleLogin()} disabled={submitting} />
          <p className="t-ck-switch">
            Masz już konto?{" "}
            <button type="button" className="t-ck-link" onClick={switchToLogin}>
              Zaloguj się
            </button>
          </p>
        </form>
      )}
    </AuthScreen>
  );
}
