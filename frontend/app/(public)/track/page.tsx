"use client";

import { useState } from "react";
import Link from "next/link";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { api, API_V1 } from "@/lib/api";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-unbounded",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

interface TrackResult {
  repair_number: string;
  status: string;
  accepted_at: string | null;
  estimated_completion_date: string | null;
  estimated_duration: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function TrackPage() {
  const [ref, setRef] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = ref.trim();
    const p = phoneLast4.replace(/\D/g, "").slice(-4);
    if (!r || p.length !== 4) {
      setError("Podaj numer zgłoszenia i ostatnie 4 cyfry numeru telefonu.");
      setResult(null);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const url = `${API_V1}/repairs/track/?ref=${encodeURIComponent(r)}&phone_last4=${encodeURIComponent(p)}`;
      const data = await api.get<TrackResult>(url);
      setResult(data as TrackResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie znaleziono zgłoszenia lub nieprawidłowe dane.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${unbounded.variable} ${jakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif", color: "var(--ink)", background: "var(--dark, #0a0a0b)" }}
    >
      <div className="mx-auto max-w-[560px] px-6 py-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
          Śledzenie naprawy
        </p>
        <h1 className="mt-3 font-black tracking-tight text-white" style={{ fontFamily: "var(--font-unbounded)", fontSize: "clamp(24px, 4vw, 32px)" }}>
          Sprawdź status <span style={{ color: "var(--red, #dc1e1e)" }}>bez logowania</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink2)" }}>
          Wpisz numer zgłoszenia oraz ostatnie 4 cyfry numeru telefonu podanego w zgłoszeniu.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Numer zgłoszenia
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="np. PROKOM/RMA/123/2025"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--island)] px-4 py-3 text-white placeholder:opacity-50 focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[var(--red)]/20"
              style={{ borderColor: "rgba(255,255,255,.1)" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Ostatnie 4 cyfry telefonu
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={phoneLast4}
              onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--island)] px-4 py-3 text-white placeholder:opacity-50 focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[var(--red)]/20"
              style={{ borderColor: "rgba(255,255,255,.1)" }}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
            style={{ background: "var(--red, #dc1e1e)" }}
          >
            {loading ? "Sprawdzam…" : "Sprawdź status"}
          </button>
        </form>

        {result && (
          <div className="mt-10 rounded-2xl border border-[rgba(255,255,255,.08)] p-6" style={{ background: "rgba(255,255,255,.03)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Numer zgłoszenia
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-white">{result.repair_number}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Status
                </p>
                <p className="mt-1 font-medium text-white">{result.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Data przyjęcia
                </p>
                <p className="mt-1 text-white">{formatDate(result.accepted_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Szacowany termin
                </p>
                <p className="mt-1 text-white">{result.estimated_completion_date ? formatDate(result.estimated_completion_date) : (result.estimated_duration || "—")}</p>
              </div>
              {result.estimated_duration && result.estimated_completion_date && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Szacowany czas
                  </p>
                  <p className="mt-1 text-white">{result.estimated_duration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/" className="underline hover:text-white">
            ← Wróć na stronę główną
          </Link>
          {" · "}
          <Link href="/client/login" className="underline hover:text-white">
            Panel klienta
          </Link>
        </p>
      </div>
    </div>
  );
}
