"use client";

import Link from "next/link";

interface UnverifiedBannerProps {
  email: string;
}

export function UnverifiedBanner({ email }: UnverifiedBannerProps) {
  const verifyUrl = `/client/verify-email?email=${encodeURIComponent(email)}`;
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-center text-sm"
      style={{
        background: "linear-gradient(90deg, rgba(220,30,30,.15), rgba(220,30,30,.08))",
        borderBottom: "1px solid rgba(220,30,30,.25)",
        color: "var(--ink2)",
      }}
    >
      <span>Zweryfikuj swój adres e-mail, aby uzyskać pełny dostęp.</span>
      <Link
        href={verifyUrl}
        className="font-semibold underline transition hover:opacity-90"
        style={{ color: "var(--red, #dc1e1e)" }}
      >
        Wyślij kod ponownie →
      </Link>
    </div>
  );
}
