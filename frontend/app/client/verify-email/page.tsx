"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

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
      <div className={`min-h-[60vh] flex flex-col items-center justify-center px-4 ${unbounded.variable} ${plusJakarta.variable}`} style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}>
        <p className="text-[var(--ink2)] mb-4">Brak adresu e-mail. Przejdź do rejestracji lub logowania.</p>
        <Link href="/client/login" className="text-[#dc1e1e] font-semibold hover:underline">Strona logowania</Link>
      </div>
    );
  }

  return (
    <div
      className={`login-page ${unbounded.variable} ${plusJakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)" }}
    >
      <div className="login-mobile-brand">
        <Link href="/" className="brand-name" style={{ fontFamily: "var(--font-unbounded)" }}>
          PRO<span>–</span>KOM
        </Link>
        <span className="brand-tagline">Weryfikacja</span>
      </div>
      <div className="card">
        <div className="lp" style={{ minHeight: "320px" }}>
          <Link href="/" className="lp-logo" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900, fontSize: "15px", letterSpacing: "-0.02em", color: "#fff", textDecoration: "none" }}>
            PRO<span style={{ color: "#dc1e1e" }}>–</span>KOM
          </Link>
          <div className="lp-body">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              WERYFIKACJA E-MAILA
            </div>
            <h2 className="lp-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
              Wpisz kod
              <span>z wiadomości e-mail</span>
            </h2>
            <p className="lp-desc">
              Kod 6-cyfrowy wysłaliśmy na adres <strong style={{ color: "#fff" }}>{email}</strong>. Ważny 15 minut.
            </p>
          </div>
        </div>

        <div className="rp">
          <div className="pnl show">
            <div className="pnl-head">
              <h3 className="pnl-title" style={{ fontFamily: "var(--font-unbounded)", fontWeight: 900 }}>
                Kod weryfikacyjny
              </h3>
              <p className="pnl-sub">Wpisz 6 cyfr (po wpisaniu ostatniej kod zostanie wysłany automatycznie)</p>
            </div>
            <div className="fields">
              <div
                className="flex gap-2 justify-center flex-wrap mb-4"
                onPaste={handlePaste}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    className="fi otp-digit text-center w-11 h-12 text-lg font-semibold"
                    style={{ width: "2.75rem" }}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={submitting}
                    aria-label={`Cyfra ${i + 1}`}
                  />
                ))}
              </div>
              {error && <ErrorMessage message={error} className="mb-3" />}
              {submitting && <p className="text-[12px] text-[var(--ink2)]">Weryfikacja…</p>}
            </div>
            <p className="pnl-footer mt-4">
              Nie dostałeś kodu?{" "}
              {resendCooldown > 0 ? (
                <span className="text-[var(--ink2)]">Wyślij ponownie za {resendCooldown} s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="bg-transparent border-0 cursor-pointer p-0 font-inherit text-inherit hover:underline"
                  style={{ color: "#dc1e1e", fontWeight: 700 }}
                >
                  Wyślij ponownie
                </button>
              )}
            </p>
            {resendMessage && (resendMessage.startsWith("Nowy") ? <p className="success-text mt-2">{resendMessage}</p> : <ErrorMessage message={resendMessage} className="mt-2" />)}
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
