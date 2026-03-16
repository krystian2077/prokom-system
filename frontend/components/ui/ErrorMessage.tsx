"use client";

import type { ReactNode } from "react";

interface ErrorMessageProps {
  /** Tekst błędu wyświetlany użytkownikowi */
  message: string;
  /** Opcjonalna klasa dla kontenera */
  className?: string;
  /** Opcjonalna zawartość pod komunikatem (np. link) */
  children?: ReactNode;
}

/**
 * Spójny, czytelny komunikat błędu dla użytkownika.
 * Używaj zamiast surowego <p> przy błędach z formularzy i API.
 */
export function ErrorMessage({ message, className = "", children }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${className}`}
      style={{
        borderColor: "rgba(220, 30, 30, 0.4)",
        backgroundColor: "rgba(220, 30, 30, 0.08)",
        color: "#f0a0a0",
      }}
    >
      <span className="mt-0.5 shrink-0 text-base" aria-hidden>
        ⚠
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{message}</p>
        {children && <div className="mt-1.5">{children}</div>}
      </div>
    </div>
  );
}
