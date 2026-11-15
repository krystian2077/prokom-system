"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { AuthScreen } from "@/components/tech/account/AuthScreen";
import { AuthAlert, AuthField, SubmitButton } from "@/components/tech/account/AuthParts";

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
    <AuthScreen
      eyebrow="Reset hasła"
      title="Nie pamiętasz hasła?"
      lead="Wyślemy na Twój adres e-mail link do ustawienia nowego hasła. Link jest ważny 1 godzinę."
      back={{ href: "/client/login", label: "Wróć do logowania" }}
      compact
    >
      <form onSubmit={handleSubmit} className="t-ck-form">
        <AuthField
          id="forgot-email"
          type="email"
          label="E-mail powiązany z kontem"
          placeholder="np. anna@poczta.pl"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
        {message && <AuthAlert tone={message.type === "success" ? "ok" : "error"}>{message.text}</AuthAlert>}
        <SubmitButton busy={submitting} busyLabel="Wysyłanie…">
          Wyślij link
        </SubmitButton>
      </form>
    </AuthScreen>
  );
}
