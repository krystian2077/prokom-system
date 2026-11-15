"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AccountStatus } from "@/components/tech/account/AccountStatus";
import { AuthScreen } from "@/components/tech/account/AuthScreen";
import { AuthAlert, PasswordField, SubmitButton } from "@/components/tech/account/AuthParts";
import { IconCheck } from "@/components/tech/icons";

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
      <AuthScreen
        eyebrow="Nowe hasło"
        title="Brak linku do resetu"
        lead="Użyj linku z wiadomości e-mail lub poproś o nowy na stronie „Nie pamiętasz hasła?”."
        back={{ href: "/client/login", label: "Wróć do logowania" }}
        compact
      >
        <Link href="/client/forgot-password" className="t-pbtn t-pbtn--acc t-ck-submit">
          Wyślij link do resetu hasła
        </Link>
      </AuthScreen>
    );
  }

  if (success) {
    return (
      <AuthScreen
        eyebrow="Nowe hasło"
        title="Hasło zmienione"
        lead="Za chwilę zostaniesz przekierowany do logowania."
        compact
      >
        <div role="status" aria-live="polite">
          <span className="t-ck-done" aria-hidden="true">
            <IconCheck size={26} strokeWidth={2.6} />
          </span>
          <Link href="/client/login" className="t-pbtn t-pbtn--acc t-ck-submit">
            Przejdź do logowania
          </Link>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Nowe hasło"
      title="Ustaw nowe hasło"
      lead="Wpisz nowe hasło dwukrotnie. Po zapisaniu zalogujesz się nowym hasłem."
      back={{ href: "/client/login", label: "Wróć do logowania" }}
      compact
    >
      <form onSubmit={handleSubmit} className="t-ck-form">
        <PasswordField
          id="reset-password"
          label="Nowe hasło"
          placeholder="Min. 8 znaków"
          autoComplete="new-password"
          hint="Co najmniej 8 znaków."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
        <PasswordField
          id="reset-confirm"
          label="Powtórz hasło"
          placeholder="Wpisz hasło jeszcze raz"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={submitting}
        />
        {error && <AuthAlert>{error}</AuthAlert>}
        <SubmitButton busy={submitting} busyLabel="Zapisywanie…">
          Zapisz hasło
        </SubmitButton>
      </form>
    </AuthScreen>
  );
}

export default function ClientResetPasswordPage() {
  return (
    <Suspense fallback={<AccountStatus>Ładowanie…</AccountStatus>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
