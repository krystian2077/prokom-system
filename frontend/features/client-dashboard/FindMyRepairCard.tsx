"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div id="szukaj-naprawy" className="panel-card mt-8 scroll-mt-24">
      <div className="panel-card-header">
        <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
          Szukaj mojej naprawy
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          Jeśli zgłoszenie nie jest jeszcze na liście, wpisz numer referencyjny z potwierdzenia oraz telefon podany przy
          przyjęciu stacjonarnym. Weryfikacja odbywa się na podstawie ostatnich czterech cyfr numeru.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Numer zgłoszenia (ref)
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="np. PROKOM/RMA/123/2025"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--island)] px-4 py-3 text-sm focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[var(--red)]/20"
              style={{ color: "var(--ink)" }}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Telefon z przyjęcia
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Pełny numer — używamy ostatnich 4 cyfr"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--island)] px-4 py-3 text-sm focus:border-[var(--red)] focus:outline-none focus:ring-2 focus:ring-[var(--red)]/20"
              style={{ color: "var(--ink)" }}
              autoComplete="tel"
            />
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "var(--red)" }}
        >
          {loading ? "Szukam…" : "Szukaj"}
        </button>
      </form>

      {result && (
        <div className="border-t border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Wynik
          </p>
          <p className="mt-1 font-mono text-base font-bold" style={{ color: "var(--ink)" }}>
            {result.repair_number}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Status
              </p>
              <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--ink)" }}>
                {result.status}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Data przyjęcia
              </p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--ink)" }}>
                {formatDate(result.accepted_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Szacowany termin / czas
              </p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--ink)" }}>
                {result.estimated_completion_date
                  ? formatDate(result.estimated_completion_date)
                  : result.estimated_duration || "—"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--ink2)" }}>
            Pełny podgląd w panelu może wymagać przypisania naprawy do konta (np. link z wiadomości e-mail lub pomoc w
            serwisie).{" "}
            <Link href="/client/naprawy" className="font-medium underline" style={{ color: "var(--red)" }}>
              Lista napraw
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
