"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffLoginPage() {
  const { staffLogin, user } = useAuth();
  const router = useRouter();
  const [returnUrl, setReturnUrl] = useState("/panel/dashboard");
  const [loginMode, setLoginMode] = useState<"staff" | "admin">("staff");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const url = sp.get("returnUrl");
    if (url) {
      setReturnUrl(url);
      setLoginMode(url.startsWith("/admin-panel") ? "admin" : "staff");
    } else {
      setReturnUrl("/panel/dashboard");
      setLoginMode("staff");
    }
  }, []);

  useEffect(() => {
    if (!user || !["staff", "admin"].includes(user.role)) return;
    if (user.role === "admin") {
      const dest = returnUrl.startsWith("/admin-panel") ? returnUrl : "/admin-panel/dashboard";
      router.replace(dest);
      return;
    }
    const dest = returnUrl.startsWith("/panel") ? returnUrl : "/panel/dashboard";
    router.replace(dest);
  }, [router, user, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await staffLogin(email, password);
    setSubmitting(false);
    if (result.ok && result.user && ["staff", "admin"].includes(result.user.role)) {
      if (result.user.role === "admin") {
        const dest = returnUrl.startsWith("/admin-panel") ? returnUrl : "/admin-panel/dashboard";
        router.push(dest);
      } else {
        const dest = returnUrl.startsWith("/panel") ? returnUrl : "/panel/dashboard";
        router.push(dest);
      }
      return;
    }
    setError(result.error || "Nieprawidłowy e-mail, hasło lub brak uprawnień.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050509] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-8 shadow-xl shadow-black/40">
        <div className="mb-6 text-xs uppercase tracking-[0.22em] text-[var(--ink2)]">
          <span
            className="mr-2 inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: loginMode === "admin" ? "#dc1e1e" : "#3b82f6",
              boxShadow:
                loginMode === "admin"
                  ? "0 0 10px rgba(220,30,30,.55)"
                  : "0 0 10px rgba(59,130,246,.55)",
            }}
          />
          {loginMode === "admin" ? "Panel administratora" : "Panel pracownika"}
        </div>
        <h1 className="text-2xl font-semibold text-[var(--white)]">Logowanie do systemu</h1>
        <p className="mt-2 text-sm text-[var(--ink2)]">
          Podaj służbowy adres e-mail i hasło. Konta zakładane są przez administratora systemu.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e5e7eb]">E-mail służbowy</label>
            <input
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-[var(--white)] outline-none ring-0 focus:border-[#dc1e1e]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e5e7eb]">Hasło</label>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-[var(--white)] outline-none ring-0 focus:border-[#dc1e1e]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--white)] shadow-md transition disabled:opacity-60"
            style={{
              background: loginMode === "admin" ? "#dc1e1e" : "#3b82f6",
              boxShadow:
                loginMode === "admin"
                  ? "0 10px 28px rgba(220,30,30,.26)"
                  : "0 10px 28px rgba(59,130,246,.22)",
            }}
          >
            {submitting ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
          Klienci logują się przez{" "}
          <Link href="/client/login" className="font-medium text-[#dc1e1e] hover:underline">
            panel klienta
          </Link>
          .
        </div>
      </div>
    </main>
  );
}

