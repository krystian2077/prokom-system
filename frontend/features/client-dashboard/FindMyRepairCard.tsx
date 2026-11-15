"use client";

import { useState } from "react";
import Link from "next/link";
import { api, API_V1 } from "@/lib/api";
import { line } from "@/config/prokom";
import { IconArrow, IconSearch } from "@/components/tech/icons";
import { IconShield } from "@/components/tech/account/account-icons";
import { AuthAlert } from "@/components/tech/account/AuthParts";
import { KeyValue, Panel } from "@/components/tech/account/AccountUi";

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

function getStatusTone(status: string): "ready" | "wait" | "done" | "new" {
  const normalized = status.toLowerCase();
  if (normalized.includes("ready") || normalized.includes("got")) return "ready";
  if (normalized.includes("wait") || normalized.includes("oczek")) return "wait";
  if (normalized.includes("done") || normalized.includes("zak") || normalized.includes("wyd")) return "done";
  return "new";
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
    <Panel
      id="szukaj-naprawy"
      className="t-ck-find"
      title="Szukaj mojej naprawy"
      desc="Wpisz numer zgłoszenia oraz pełny numer telefonu z przyjęcia — system automatycznie użyje ostatnich 4 cyfr."
      icon={<IconSearch size={18} />}
      action={
        <span className="t-ck-chip">
          <IconShield size={14} />
          Bezpieczna weryfikacja
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="t-ck-form">
        <div className="t-ck-find__grid">
          <div className="t-ck-field">
            <label htmlFor="find-ref">Numer zgłoszenia (ref)</label>
            <input
              id="find-ref"
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="np. PROKOM/RMA/123/2025"
              autoComplete="off"
            />
          </div>
          <div className="t-ck-field">
            <label htmlFor="find-phone">Telefon z przyjęcia (pełny numer)</label>
            <input
              id="find-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Wpisz pełny numer telefonu"
              autoComplete="tel"
            />
          </div>
        </div>
        <div className="t-ck-find__foot">
          <p className="t-ck-note">System sam wytnie ostatnie 4 cyfry z wpisanego numeru telefonu.</p>
          <button type="submit" className="t-pbtn t-pbtn--acc t-pbtn--m t-ck-find__btn" disabled={loading} aria-busy={loading || undefined}>
            <IconSearch size={16} />
            {loading ? "Szukam…" : "Sprawdź status"}
          </button>
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
      </form>

      {result && (
        <div className="t-ck-find__result" role="status" aria-live="polite">
          <div className="t-ck-find__resulthead">
            <div>
              <span className="t-ck-k">Wynik wyszukiwania</span>
              <p className="t-ck-ref t-ck-ref--l">{result.repair_number}</p>
            </div>
            <span className={`t-ck-pill t-ck-pill--${getStatusTone(result.status)}`}>
              <i aria-hidden="true" />
              {result.status}
            </span>
          </div>
          <dl className="t-ck-kvs t-ck-kvs--grid">
            <KeyValue label="Status">{result.status}</KeyValue>
            <KeyValue label="Data przyjęcia">{formatDate(result.accepted_at)}</KeyValue>
            <KeyValue label="Szacowany termin / czas">
              {result.estimated_completion_date ? formatDate(result.estimated_completion_date) : result.estimated_duration || "—"}
            </KeyValue>
          </dl>
          <div className="t-ck-find__hint">
            <p>Pełny podgląd może wymagać przypisania naprawy do konta.</p>
            <Link href="/client/naprawy" className="t-ck-link t-ck-more">
              Lista napraw
              <IconArrow size={13} />
            </Link>
          </div>
          <p className="t-ck-note">Wsparcie: {line.phoneDisplay} · weryfikacja po ostatnich 4 cyfrach telefonu</p>
        </div>
      )}
    </Panel>
  );
}
