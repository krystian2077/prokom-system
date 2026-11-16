"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/tech/account/AuthScreen";
import { AuthAlert } from "@/components/tech/account/AuthParts";
import { IconMail } from "@/components/tech/account/account-icons";

const DIGIT_COUNT = 6;

export default function ClientVerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const [digits, setDigits] = useState<string[]>(() => Array(DIGIT_COUNT).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const code = digits.join("");

  const submitCode = useCallback(
    async (value: string) => {
      if (value.length !== DIGIT_COUNT || !email) return;
      setError(null);
      setSubmitting(true);
      const result = await verifyEmail(email, value);
      setSubmitting(false);
      if (result.ok) {
        router.replace("/client/dashboard");
        return;
      }
      setError(result.error || "Nieprawidłowy kod.");
      setDigits(Array(DIGIT_COUNT).fill(""));
      inputRefs.current[0]?.focus();
    },
    [email, verifyEmail, router]
  );

  useEffect(() => {
    if (submitting) return;
    if (code.length === DIGIT_COUNT && /^\d+$/.test(code)) {
      submitCode(code);
    }
  }, [code, submitCode, submitting]);

  const handleChange = (index: number, v: string) => {
    if (submitting) return;
    const char = v.slice(-1);
    if (char && !/^\d$/.test(char)) return;
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);
    if (char) {
      if (index < DIGIT_COUNT - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResendMessage(null);
    setError(null);
    const result = await resendVerificationCode(email);
    if (result.ok) {
      setResendCooldown(60);
      setResendMessage("Nowy kod został wysłany na Twój e-mail.");
    } else {
      setResendMessage(result.error ?? "Nie udało się wysłać kodu.");
      if (result.retryAfterSeconds != null && result.retryAfterSeconds > 0) {
        setResendCooldown(result.retryAfterSeconds);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setError(null);
    const focusIdx = Math.min(pasted.length, DIGIT_COUNT - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  if (!email) {
    return (
      <AuthScreen
        eyebrow="Weryfikacja e-maila"
        title="Brak adresu e-mail"
        lead="Przejdź do rejestracji lub logowania."
        compact
      >
        <Link href="/client/login" className="t-pbtn t-pbtn--acc t-ck-submit">
          Strona logowania
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Weryfikacja e-maila"
      title="Wpisz kod z e-maila"
      lead="Po wpisaniu ostatniej cyfry kod zostanie wysłany automatycznie."
      back={{ href: "/client/login", label: "Wróć do logowania" }}
      compact
    >
      <div className="t-ck-form">
        <p className="t-ck-mailto">
          <span className="t-ck-mailto__ico" aria-hidden="true">
            <IconMail size={19} />
          </span>
          <span>
            Kod 6-cyfrowy wysłaliśmy na adres <strong>{email}</strong>. Ważny 15 minut.
          </span>
        </p>
        <div className="t-ck-otp" role="group" aria-label="Kod weryfikacyjny" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              placeholder=" "
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={submitting}
              aria-label={`Cyfra ${i + 1}`}
            />
          ))}
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
        {submitting && (
          <p className="t-ck-note t-ck-note--busy" role="status">
            <span className="t-ck-spin" aria-hidden="true" />
            Weryfikacja…
          </p>
        )}
        <p className="t-ck-note">
          Nie dostałeś kodu?{" "}
          {resendCooldown > 0 ? (
            <span>Wyślij ponownie za {resendCooldown} s</span>
          ) : (
            <button type="button" onClick={handleResend} className="t-ck-link">
              Wyślij ponownie
            </button>
          )}
        </p>
        {resendMessage && (resendMessage.startsWith("Nowy") ? <AuthAlert tone="ok">{resendMessage}</AuthAlert> : <AuthAlert>{resendMessage}</AuthAlert>)}
      </div>
    </AuthScreen>
  );
}
