"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [ref, setRef] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => {
    const q = searchParams.get("ref")?.trim();
    if (q) setRef(q);
  }, [searchParams]);

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

  const inputCls =
    "min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-prokom-black placeholder:text-prokom-gray/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 lg:min-h-0 lg:rounded-xl lg:border-[rgba(255,255,255,.1)] lg:bg-[#0f1117] lg:text-white lg:placeholder:opacity-50 lg:focus:border-[#dc1e1e] lg:focus:ring-[#dc1e1e]/20";

  return (
    <div
      className={`min-h-screen bg-white lg:bg-[#0a0a0b] ${unbounded.variable} ${jakarta.variable}`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-[560px] px-5 py-8 lg:px-6 lg:py-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-prokom-gray lg:text-[#525b6e]">
          Śledzenie naprawy
        </p>
        <h1
          className="mt-3 font-black tracking-tight text-prokom-black lg:text-white"
          style={{ fontFamily: "var(--font-unbounded)", fontSize: "clamp(24px, 4vw, 32px)" }}
        >
          Podgląd statusu zgłoszenia
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-prokom-gray lg:text-[#8b93a8]">
          Tu sprawdzisz podstawowy status po numerze referencyjnym i telefonie. Pełne śledzenie, historia i wiadomości
          są dostępne w panelu klienta po{" "}
          <Link href="/client/rejestracja" className="font-medium text-primary underline underline-offset-2 hover:no-underline lg:text-white lg:decoration-[#dc1e1e]">
            założeniu konta
          </Link>{" "}
          i zalogowaniu — na stronie głównej panelu użyj sekcji „Szukaj mojej naprawy", jeśli naprawa nie pojawi się sama na liście.
        </p>
        <p className="mt-3 text-sm text-prokom-gray lg:text-[#525b6e]">
          Wpisz numer zgłoszenia oraz ostatnie 4 cyfry numeru telefonu z przyjęcia.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 lg:mt-8 lg:space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
              Numer zgłoszenia
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="np. PROKOM/RMA/123/2025"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
              Ostatnie 4 cyfry telefonu
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={phoneLast4}
              onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              className={inputCls}
            />
          </div>
          {error && <p className="text-sm text-red-500 lg:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-white transition disabled:opacity-60 lg:min-h-0 lg:rounded-xl"
          >
            {loading ? "Sprawdzam…" : "Sprawdź status"}
          </button>
        </form>

        {result && (
          <div className="mt-8 rounded-2xl border-0 bg-gray-50 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:mt-10 lg:border lg:border-[rgba(255,255,255,.08)] lg:bg-[rgba(255,255,255,.03)] lg:p-6 lg:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
              Numer zgłoszenia
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-prokom-black lg:text-white">{result.repair_number}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:mt-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                  Status
                </p>
                <p className="mt-1 font-medium text-prokom-black lg:text-white">{result.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                  Data przyjęcia
                </p>
                <p className="mt-1 text-prokom-black lg:text-white">{formatDate(result.accepted_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                  Szacowany termin
                </p>
                <p className="mt-1 text-prokom-black lg:text-white">{result.estimated_completion_date ? formatDate(result.estimated_completion_date) : (result.estimated_duration || "—")}</p>
              </div>
              {result.estimated_duration && result.estimated_completion_date && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                    Szacowany czas
                  </p>
                  <p className="mt-1 text-prokom-black lg:text-white">{result.estimated_duration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-prokom-gray lg:mt-10 lg:text-[#525b6e]">
          <Link href="/" className="inline-block min-h-[44px] content-center underline hover:text-prokom-black lg:hover:text-white">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/client/login" className="inline-block min-h-[44px] content-center underline hover:text-prokom-black lg:hover:text-white">
            Logowanie do panelu
          </Link>
          {" · "}
          <Link href="/client/login?returnUrl=%2Fclient%2Fdashboard%23szukaj-naprawy" className="inline-block min-h-[44px] content-center underline hover:text-prokom-black lg:hover:text-white">
            Panel — Szukaj mojej naprawy
          </Link>
        </p>
      </div>
    </div>
  );
}
