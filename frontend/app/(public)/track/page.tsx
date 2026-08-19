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

interface Stage {
  key: string;
  label: string;
}
interface HistoryEntry {
  status: string;
  status_code: string;
  at: string | null;
}
interface TrackResult {
  repair_number: string;
  status: string;
  status_code: string;
  stage_index: number;
  stages: Stage[];
  is_interrupted: boolean;
  is_finished: boolean;
  device: { name: string; brand: string; category: string };
  problem_description: string;
  created_at: string | null;
  accepted_at: string | null;
  estimated_completion_date: string | null;
  estimated_duration: string | null;
  ready_for_pickup_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  delivery_method: string;
  return_method: string;
  cost: { estimated: string | null; final: string | null; currency: string } | null;
  history: HistoryEntry[];
  service: {
    name: string;
    address: string;
    phone: string;
    email: string;
    hours: string;
    website: string;
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatMoney(value: string | null, currency: string): string {
  if (!value) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `${n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/* ── Elementy wspólne ────────────────────────────────────────────── */

const LABEL =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-prokom-gray lg:text-[#525b6e]";
const VALUE = "mt-1 text-[15px] font-semibold text-prokom-black lg:text-white";
const CARD =
  "rounded-2xl bg-gray-50 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:rounded-xl lg:border lg:border-[rgba(255,255,255,.08)] lg:bg-[rgba(255,255,255,.03)] lg:p-6 lg:shadow-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 lg:mt-5">
      <h2
        className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary lg:text-[#dc1e1e]"
        style={{ fontFamily: "var(--font-unbounded)" }}
      >
        {title}
      </h2>
      <div className={CARD}>{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <p className={VALUE}>{value}</p>
    </div>
  );
}

/* Pasek postępu — 5 etapów, aktualny podświetlony na czerwono. */
function Stepper({ stages, current, interrupted }: { stages: Stage[]; current: number; interrupted: boolean }) {
  return (
    <ol className="flex items-start gap-1.5">
      {stages.map((s, i) => {
        const done = !interrupted && i < current;
        const active = !interrupted && i === current;
        const bar = interrupted
          ? "bg-gray-200 lg:bg-[rgba(255,255,255,.12)]"
          : done
            ? "bg-primary/45 lg:bg-[#dc1e1e]/45"
            : active
              ? "bg-primary lg:bg-[#dc1e1e]"
              : "bg-gray-200 lg:bg-[rgba(255,255,255,.12)]";
        const text = active
          ? "text-prokom-black lg:text-white"
          : done
            ? "text-prokom-gray lg:text-[#8b93a8]"
            : "text-prokom-gray/60 lg:text-[#525b6e]";
        return (
          <li key={s.key} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${bar}`} />
            <p className={`mt-2 text-[10px] font-semibold leading-tight ${text}`}>{s.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Strona ──────────────────────────────────────────────────────── */

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
      <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-6 lg:py-14">
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
          Wpisz numer zgłoszenia oraz ostatnie 4 cyfry numeru telefonu podanego przy przyjęciu.
        </p>

        {/* Formularz wyszukiwania */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 lg:mt-8 lg:space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end lg:gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                Numer zgłoszenia
              </label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="np. PROKOM/RMA/123/2026"
                className={inputCls}
              />
            </div>
            <div className="sm:w-[150px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-prokom-gray lg:text-[#525b6e]">
                4 cyfry telefonu
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
          <div className="mt-8 lg:mt-10">
            {/* Nagłówek: numer + status + oś postępu */}
            <div
              className={`rounded-2xl border-l-4 p-5 lg:rounded-xl lg:p-6 ${
                result.is_interrupted
                  ? "border-l-amber-500 bg-amber-50 lg:border lg:border-amber-500/25 lg:border-l-4 lg:border-l-amber-500 lg:bg-amber-500/[0.06]"
                  : "border-l-primary bg-gray-50 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:border lg:border-[rgba(255,255,255,.08)] lg:border-l-4 lg:border-l-[#dc1e1e] lg:bg-[rgba(255,255,255,.03)] lg:shadow-none"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={LABEL}>Numer zgłoszenia</p>
                  <p className="mt-1 font-mono text-lg font-bold text-prokom-black lg:text-white">
                    {result.repair_number}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                    result.is_interrupted
                      ? "bg-amber-500 text-white"
                      : result.is_finished
                        ? "bg-emerald-600 text-white"
                        : "bg-primary text-white lg:bg-[#dc1e1e]"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              {!result.is_interrupted && (
                <div className="mt-6">
                  <Stepper
                    stages={result.stages}
                    current={result.stage_index}
                    interrupted={result.is_interrupted}
                  />
                </div>
              )}
              {result.is_interrupted && (
                <p className="mt-3 text-sm leading-relaxed text-amber-900 lg:text-amber-200/90">
                  Sprawa została zamknięta bez wykonania naprawy. W razie pytań prosimy o kontakt z serwisem —
                  dane znajdziesz na dole strony.
                </p>
              )}
            </div>

            {/* Urządzenie i zgłoszony problem */}
            <Section title="Urządzenie">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sprzęt" value={result.device.name || "—"} />
                <Field label="Kategoria" value={result.device.category || "—"} />
              </div>
              {result.problem_description && (
                <div className="mt-4 border-t border-gray-200 pt-4 lg:border-[rgba(255,255,255,.08)]">
                  <p className={LABEL}>Zgłoszony problem</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-prokom-black lg:text-[#c9cfdd]">
                    {result.problem_description}
                  </p>
                </div>
              )}
            </Section>

            {/* Terminy */}
            <Section title="Terminy">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Zgłoszenie przyjęte" value={formatDate(result.created_at)} />
                <Field
                  label="Przewidywany termin"
                  value={
                    result.estimated_completion_date
                      ? formatDate(result.estimated_completion_date)
                      : result.estimated_duration || "Zostanie podany po diagnozie"
                  }
                />
                {result.estimated_duration && result.estimated_completion_date && (
                  <Field label="Szacowany czas naprawy" value={result.estimated_duration} />
                )}
                {result.ready_for_pickup_at && (
                  <Field label="Gotowe do odbioru od" value={formatDateTime(result.ready_for_pickup_at)} />
                )}
                {result.picked_up_at && (
                  <Field label="Odebrane" value={formatDateTime(result.picked_up_at)} />
                )}
              </div>
            </Section>

            {/* Koszt — tylko gdy wycena została już przekazana klientowi */}
            {result.cost && (
              <Section title="Koszt naprawy">
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.cost.estimated && (
                    <Field
                      label="Wycena wstępna"
                      value={formatMoney(result.cost.estimated, result.cost.currency)}
                    />
                  )}
                  {result.cost.final && (
                    <Field
                      label="Kwota końcowa"
                      value={formatMoney(result.cost.final, result.cost.currency)}
                    />
                  )}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-prokom-gray lg:text-[#8b93a8]">
                  Szczegółowy kosztorys wysłaliśmy na Twój adres e-mail.
                </p>
              </Section>
            )}

            {/* Dostarczenie i odbiór */}
            <Section title="Dostarczenie i odbiór">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sprzęt dostarczony" value={result.delivery_method || "—"} />
                <Field label="Sposób odbioru" value={result.return_method || "—"} />
              </div>
            </Section>

            {/* Historia statusów */}
            {result.history.length > 0 && (
              <Section title="Historia zgłoszenia">
                <ol className="space-y-0">
                  {[...result.history].reverse().map((h, i, arr) => (
                    <li key={`${h.status_code}-${h.at}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                      {i < arr.length - 1 && (
                        <span className="absolute left-[5px] top-3 h-full w-px bg-gray-200 lg:bg-[rgba(255,255,255,.12)]" />
                      )}
                      <span
                        className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          i === 0 ? "bg-primary lg:bg-[#dc1e1e]" : "bg-gray-300 lg:bg-[rgba(255,255,255,.22)]"
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            i === 0
                              ? "text-prokom-black lg:text-white"
                              : "text-prokom-gray lg:text-[#8b93a8]"
                          }`}
                        >
                          {h.status}
                        </p>
                        <p className="mt-0.5 text-xs text-prokom-gray lg:text-[#525b6e]">
                          {formatDateTime(h.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Kontakt do serwisu */}
            <Section title="Kontakt z serwisem">
              <p className="font-bold text-prokom-black lg:text-white">{result.service.name}</p>
              {result.service.address && (
                <p className="mt-1 text-sm text-prokom-gray lg:text-[#8b93a8]">{result.service.address}</p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.service.phone && (
                  <div>
                    <p className={LABEL}>Telefon</p>
                    <a
                      href={`tel:${result.service.phone.replace(/[^\d+]/g, "")}`}
                      className="mt-1 block text-[15px] font-semibold text-primary underline underline-offset-2 hover:no-underline lg:text-[#dc1e1e]"
                    >
                      {result.service.phone}
                    </a>
                  </div>
                )}
                {result.service.email && (
                  <div>
                    <p className={LABEL}>E-mail</p>
                    <a
                      href={`mailto:${result.service.email}`}
                      className="mt-1 block break-all text-[15px] font-semibold text-primary underline underline-offset-2 hover:no-underline lg:text-[#dc1e1e]"
                    >
                      {result.service.email}
                    </a>
                  </div>
                )}
                {result.service.hours && <Field label="Godziny otwarcia" value={result.service.hours} />}
              </div>
            </Section>

            {/* Zachęta do panelu klienta */}
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-5 text-center lg:rounded-xl lg:border-[rgba(255,255,255,.14)] lg:p-6">
              <p className="text-sm font-semibold text-prokom-black lg:text-white">
                Chcesz więcej niż podgląd statusu?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-prokom-gray lg:text-[#8b93a8]">
                W panelu klienta masz wyceny do akceptacji, wiadomości z serwisem, dokumenty i historię wszystkich
                swoich napraw w jednym miejscu.
              </p>
              <Link
                href="/client/rejestracja"
                className="mt-4 inline-block min-h-[44px] content-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white lg:rounded-xl"
              >
                Załóż konto
              </Link>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-prokom-gray lg:mt-10 lg:text-[#525b6e]">
          <Link
            href="/"
            className="inline-block min-h-[44px] content-center underline hover:text-prokom-black lg:hover:text-white"
          >
            ← Strona główna
          </Link>
          {" · "}
          <Link
            href="/client/login"
            className="inline-block min-h-[44px] content-center underline hover:text-prokom-black lg:hover:text-white"
          >
            Logowanie do panelu
          </Link>
        </p>
      </div>
    </div>
  );
}
