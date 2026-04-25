"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Phone, Search, ShieldCheck } from "lucide-react";
import { api, API_V1 } from "@/lib/api";

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

function phoneToLast4(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-4);
}

function getStatusTone(status: string): { label: string; className: string } {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("got")) {
    return { label: status, className: "bg-[rgba(34,197,94,.12)] text-[var(--green)] border-[rgba(34,197,94,.22)]" };
  }
  if (normalized.includes("wait") || normalized.includes("oczek")) {
    return { label: status, className: "bg-[rgba(245,158,11,.12)] text-[var(--amber)] border-[rgba(245,158,11,.22)]" };
  }
  if (normalized.includes("done") || normalized.includes("zak") || normalized.includes("wyd")) {
    return { label: status, className: "bg-[rgba(59,130,246,.12)] text-[var(--blue)] border-[rgba(59,130,246,.22)]" };
  }
  return { label: status, className: "bg-[rgba(255,255,255,.05)] text-[var(--ink2)] border-[var(--border)]" };
}

/**
 * Wyszukiwanie zgłoszenia po numerze ref + telefonie z przyjęcia (weryfikacja: ostatnie 4 cyfry).
 */
export function FindMyRepairCard() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = ref.trim();
    const p4 = phoneToLast4(phone);
    if (!r || p4.length !== 4) {
      setError("Podaj numer zgłoszenia oraz numer telefonu z przyjęcia (weryfikacja: ostatnie 4 cyfry).");
      setResult(null);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const url = `${API_V1}/repairs/track/?ref=${encodeURIComponent(r)}&phone_last4=${encodeURIComponent(p4)}`;
      const data = await api.get<TrackResult>(url, null);
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
      id="szukaj-naprawy"
      className="panel-card mt-8 scroll-mt-24 overflow-hidden max-lg:mt-5 max-lg:rounded-[18px]"
    >
      <div className="panel-card-header max-lg:px-5 max-lg:py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--red-border)", color: "var(--red)", background: "var(--red-l)" }}>
              <Search size={12} />
              Szybkie sprawdzenie
            </span>
            <h2 className="mt-3 text-[18px] font-semibold leading-tight sm:text-[22px]" style={{ fontFamily: "var(--font-unbounded)", color: "var(--heading)" }}>
              Szukaj mojej naprawy
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed sm:text-sm" style={{ color: "var(--ink2)" }}>
              Wpisz numer zgłoszenia oraz pełny numer telefonu z przyjęcia — system automatycznie użyje ostatnich 4&nbsp;cyfr.
            </p>
          </div>
          <div className="hidden rounded-2xl border px-3 py-2 sm:flex items-center gap-2" style={{ borderColor: "var(--border)", background: "var(--island2)", color: "var(--ink2)" }}>
            <ShieldCheck size={15} />
            <span className="text-xs font-medium">Bezpieczna weryfikacja</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 pt-0 sm:space-y-5 sm:p-5 sm:pt-0 lg:p-6 lg:pt-0">
        <div className="grid gap-4 pt-3.5 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]" style={{ color: "var(--muted)" }}>
              Numer zgłoszenia (ref)
            </span>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="np. PROKOM/RMA/123/2025"
              className="h-12 w-full rounded-xl border bg-[var(--island)] px-3.5 text-[14px] outline-none transition focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/15 sm:h-14 sm:rounded-2xl sm:px-4 sm:text-[15px]"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-[11px]" style={{ color: "var(--muted)" }}>
              Telefon z przyjęcia (pełny numer)
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Wpisz pełny numer telefonu"
              className="h-12 w-full rounded-xl border bg-[var(--island)] px-3.5 text-[14px] outline-none transition focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/15 sm:h-14 sm:rounded-2xl sm:px-4 sm:text-[15px]"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              autoComplete="tel"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-[12px] leading-relaxed sm:text-sm" style={{ color: "var(--ink2)" }}>
            <Clock3 size={14} className="mt-0.5 shrink-0 sm:h-4 sm:w-4" />
            <span>System sam wytnie ostatnie 4 cyfry z wpisanego numeru telefonu.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-auto sm:rounded-2xl sm:px-6 sm:text-[15px]"
            style={{ background: loading ? "var(--red-h)" : "var(--red)" }}
          >
            <Search size={16} />
            {loading ? "Szukam…" : "Sprawdź status"}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(220,30,30,.22)", background: "rgba(220,30,30,.08)", color: "var(--red)" }}>
            {error}
          </div>
        )}
      </form>

      {result && (
        <div className="border-t border-[var(--border)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Wynik wyszukiwania
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-wide" style={{ color: "var(--heading)" }}>
                {result.repair_number}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getStatusTone(result.status).className}`}>
              {getStatusTone(result.status).label}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Status
              </p>
              <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                {result.status}
              </p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Data przyjęcia
              </p>
              <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                {formatDate(result.accepted_at)}
              </p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Szacowany termin / czas
              </p>
              <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                {result.estimated_completion_date ? formatDate(result.estimated_completion_date) : result.estimated_duration || "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink2)" }}>
              Pełny podgląd może wymagać przypisania naprawy do konta.
            </p>
            <Link href="/client/naprawy" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--red)" }}>
              Lista napraw
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs" style={{ color: "var(--ink2)" }}>
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1" style={{ borderColor: "var(--border)" }}>
              <Phone size={12} />
              Wsparcie: 883 200 151
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1" style={{ borderColor: "var(--border)" }}>
              <ShieldCheck size={12} />
              Ostatnie 4 cyfry telefonu
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
