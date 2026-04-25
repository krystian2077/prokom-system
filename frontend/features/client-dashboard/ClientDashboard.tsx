"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Phone,
  UserRound,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useClientProfile } from "@/hooks/useClientProfile";
import { StatusBadge } from "@/components/panel/StatusBadge";
import {
  apiMySummaryToDashboardStats,
  apiRepairListItemToPanel,
  type ApiMySummary,
  type ApiRepairListItem,
} from "@/lib/panel-api";
import { formatDate, formatMonthYear, truncate } from "@/lib/format";
import { formatPrice, getDeviceEmoji } from "@/types/panel";
import type { DashboardStats, Repair } from "@/types/panel";
import { FindMyRepairCard } from "./FindMyRepairCard";

function buildStatusLead(stats: DashboardStats | null): string {
  if (!stats) return "Sprawdzamy Twoje zgłoszenia i aktualne statusy napraw.";
  if (stats.ready > 0) {
    return `Masz ${stats.ready} napraw${stats.ready === 1 ? "ę" : "y"} gotow${
      stats.ready === 1 ? "ą" : "e"
    } do odbioru.`;
  }
  if (stats.active > 0) {
    return `Aktualnie realizujemy ${stats.active} aktywn${stats.active === 1 ? "ą" : "e"} napraw${
      stats.active === 1 ? "ę" : "y"
    }.`;
  }
  if (stats.waitingDecision > 0) {
    return `Czekamy na Twoją decyzję w ${stats.waitingDecision} spraw${
      stats.waitingDecision === 1 ? "ie" : "ach"
    }.`;
  }
  return "Brak aktywnych napraw. Możesz zgłosić nowe urządzenie online.";
}

export function ClientDashboard() {
  const { token } = useAuth();
  const { profile } = useClientProfile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [repairs, setRepairs] = useState<Repair[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ApiMySummary>("/repairs/my-summary/", token),
      api.get<ApiRepairListItem[] | { results: ApiRepairListItem[] }>("/repairs/", token),
    ])
      .then(([summaryRes, listRes]) => {
        if (cancelled) return;

        const summary = summaryRes as ApiMySummary;
        setStats(apiMySummaryToDashboardStats(summary));

        const list = Array.isArray(listRes)
          ? listRes
          : (listRes as { results: ApiRepairListItem[] }).results ?? [];
        const latest = (summary.latest_repairs ?? list.slice(0, 5)).slice(0, 5);
        setRepairs(latest.map(apiRepairListItemToPanel));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Błąd ładowania.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error && !stats && !repairs) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="panel-card p-6" style={{ color: "var(--ink)" }}>
          <p style={{ color: "var(--red)" }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--island2)]"
          >
            Odśwież
          </button>
        </div>
      </div>
    );
  }

  const firstName = profile?.firstName ?? "Kliencie";
  const statusLead = loading ? "Ładujemy podsumowanie Twojego konta..." : buildStatusLead(stats);
  const completedCount = stats
    ? Math.max(0, (stats.total ?? 0) - (stats.active ?? 0) - (stats.ready ?? 0))
    : null;
  const latestRepairs = repairs?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-[1520px] px-4 py-6 max-lg:px-3 max-lg:py-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid min-w-0 gap-8 max-lg:gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {/* Hero / Welcome section */}
          <section
            className="panel-card overflow-hidden max-lg:rounded-[18px] max-lg:p-0 p-6 sm:p-7"
          >
            <div className="max-lg:p-4 max-lg:pb-3">
              <div className="flex flex-col gap-2 max-lg:gap-1.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.14em] max-lg:text-[10px]"
                    style={{ color: "var(--muted)" }}
                  >
                    Panel klienta
                  </p>
                  <h1
                    className="mt-1.5 cp-heading font-semibold sm:mt-2"
                    style={{ fontFamily: "var(--font-unbounded)", fontSize: "clamp(20px, 3vw, 34px)" }}
                  >
                    Witaj, {firstName}
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-relaxed sm:mt-3 sm:text-base" style={{ color: "var(--ink2)" }}>
                    {statusLead}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:flex-wrap">
                  <Link
                    href="/zgloszenie"
                    className="inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[13px] font-semibold text-white sm:rounded-xl sm:text-sm"
                    style={{ background: "var(--red)" }}
                  >
                    <Wrench size={14} />
                    Zgłoś naprawę
                  </Link>
                  <Link
                    href="/client/naprawy"
                    className="inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-[13px] font-semibold sm:rounded-xl sm:text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                  >
                    <ClipboardList size={14} />
                    Naprawy
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 max-lg:px-3 max-lg:pb-4 sm:mt-5 sm:gap-2.5 xl:grid-cols-4">
              {[
                {
                  label: "Aktywne",
                  value: stats?.active ?? "-",
                  icon: <Wrench size={16} />,
                  hint: "Naprawy w realizacji",
                },
                {
                  label: "Gotowe do odbioru",
                  value: stats?.ready ?? "-",
                  icon: <CheckCircle2 size={16} />,
                  hint: "Możesz odebrać urządzenie",
                },
                {
                  label: "Oczekuje decyzji",
                  value: stats?.waitingDecision ?? "-",
                  icon: <Clock3 size={16} />,
                  hint: "Sprawdź i potwierdź wycenę",
                },
                {
                  label: "Wszystkie naprawy",
                  value: stats?.total ?? "-",
                  icon: <ClipboardList size={16} />,
                  hint: "Całkowita liczba zgłoszeń",
                },
              ].map((card) => (
                <article
                  key={card.label}
                  className="overflow-hidden rounded-2xl border p-3 sm:p-4 max-lg:rounded-[14px]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--island2)",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {card.label}
                    </p>
                    <span className="shrink-0" style={{ color: "var(--ink2)" }}>{card.icon}</span>
                  </div>
                  {loading ? (
                    <div className="skeleton mt-2 h-7 w-10 rounded" />
                  ) : (
                    <p className="mt-1.5 text-2xl font-semibold cp-heading sm:mt-2 sm:text-3xl">{card.value}</p>
                  )}
                  <p className="mt-1 hidden text-xs sm:block" style={{ color: "var(--muted)" }}>
                    {card.hint}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8 max-lg:mt-5">
            <FindMyRepairCard />
          </div>

          <section className="panel-card mt-8 overflow-hidden max-lg:mt-5 max-lg:rounded-[18px]">
            <div className="panel-card-header flex items-center justify-between">
              <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                Ostatnie naprawy
              </h2>
              <Link
                href="/client/naprawy"
                className="inline-flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
                style={{ color: "var(--red)" }}
              >
                Zobacz wszystkie
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Mobile repair cards */}
            <div className="space-y-2.5 p-3 sm:hidden">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-[16px] p-3.5" style={{ background: "var(--island2)" }}>
                    <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton mb-2 h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))
              ) : latestRepairs.length > 0 ? (
                latestRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/client/naprawy/${repair.id}`}
                    className="block rounded-[16px] border p-3.5 transition active:scale-[0.98]"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--island2)",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ background: "var(--island3)" }}
                      >
                        {getDeviceEmoji(repair.deviceCategory)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="cp-heading text-[13px] font-semibold leading-snug">
                          {truncate(
                            repair.problemDescription
                              ? `${([repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel)} – ${repair.problemDescription}`
                              : ([repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel),
                            48
                          )}
                        </p>
                        <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>
                          {repair.repairNumber} · {formatDate(repair.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <StatusBadge status={repair.status} />
                      <span className="cp-heading shrink-0 text-sm font-semibold">{formatPrice(repair.totalPrice)}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: "var(--island3)" }}
                  >
                    🔧
                  </div>
                  <div>
                    <p className="cp-heading font-semibold">Brak napraw</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                      Zgłoś usterkę, aby zobaczyć tutaj swoje zgłoszenia.
                    </p>
                  </div>
                  <Link
                    href="/zgloszenie"
                    className="min-h-[48px] rounded-[14px] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    Zgłoś naprawę
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop repair list */}
            <div className="hidden divide-y divide-[var(--border)] sm:block">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3.5 p-4">
                    <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex-1">
                      <div className="skeleton mb-2 h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                    <div className="skeleton h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : latestRepairs.length > 0 ? (
                latestRepairs.map((repair) => (
                  <Link
                    key={repair.id}
                    href={`/client/naprawy/${repair.id}`}
                    className="repair-row cp-row-hover flex flex-wrap items-center gap-3.5 px-5 py-4 transition"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ background: "var(--island3)" }}
                    >
                      {getDeviceEmoji(repair.deviceCategory)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="cp-heading font-medium">
                        {truncate(
                          repair.problemDescription
                            ? `${([repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel)} – ${repair.problemDescription}`
                            : ([repair.deviceBrand, repair.deviceModel].filter(Boolean).join(" ") || repair.deviceModel),
                          60
                        )}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Nr ref: {repair.repairNumber} · Przyjęto {formatDate(repair.createdAt)}
                        {(repair.deliveryMethod === "kurier" || repair.pickupMethod === "kurier") && (
                          <span
                            className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              background: "rgba(220,30,30,.15)",
                              color: "var(--red)",
                              border: "1px solid rgba(220,30,30,.35)",
                            }}
                          >
                            <span aria-hidden>📦</span> Kurier
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="cp-heading text-sm font-medium">{formatPrice(repair.totalPrice)}</span>
                      <StatusBadge status={repair.status} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ background: "var(--island3)" }}
                  >
                    🔧
                  </div>
                  <div>
                    <p className="cp-heading font-semibold">Brak napraw</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--ink2)" }}>
                      Zgłoś usterkę, aby zobaczyć tutaj swoje zgłoszenia.
                    </p>
                  </div>
                  <Link
                    href="/zgloszenie"
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: "var(--red)" }}
                  >
                    Zgłoś naprawę
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-5 lg:max-w-[300px] max-lg:order-last">
          {/* Quick actions — mobile: horizontal scroll cards */}
          <div className="panel-card max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none">
            <div className="panel-card-header max-lg:hidden">
              <h3
                className="cp-heading flex items-center gap-2 font-bold"
                style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}
              >
                <ClipboardList size={13} />
                Najważniejsze skróty
              </h3>
            </div>
            <div className="flex flex-col gap-2 p-4 max-lg:flex-row max-lg:gap-2 max-lg:overflow-x-auto max-lg:p-0 max-lg:pb-1 max-lg:[scrollbar-width:none] max-lg:[-ms-overflow-style:none] max-lg:[&::-webkit-scrollbar]:hidden">
              <Link
                href="/zgloszenie"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm font-medium text-white transition hover:opacity-95 max-lg:min-w-[160px] max-lg:shrink-0 max-lg:rounded-[16px] max-lg:p-4"
                style={{
                  background: "var(--red)",
                  boxShadow: "0 2px 8px rgba(220,30,30,0.2), 0 8px 20px rgba(220,30,30,0.12)",
                }}
              >
                <span>Zgłoś naprawę</span>
                <span className="text-xs opacity-90">Formularz online</span>
              </Link>
              <Link
                href="/client/naprawy"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm transition hover:bg-[var(--island3)] max-lg:min-w-[150px] max-lg:shrink-0 max-lg:rounded-[16px] max-lg:border max-lg:p-4"
                style={{
                  background: "var(--island2)",
                  color: "var(--ink)",
                  borderColor: "var(--border)",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                }}
              >
                <span>Moje naprawy</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Historia i statusy
                </span>
              </Link>
              <Link
                href="/client/profil"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm transition hover:bg-[var(--island3)] max-lg:min-w-[150px] max-lg:shrink-0 max-lg:rounded-[16px] max-lg:border max-lg:p-4"
                style={{
                  color: "var(--ink)",
                  borderColor: "var(--border)",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                }}
              >
                <span>Profil</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Dane i preferencje
                </span>
              </Link>
            </div>
          </div>

          <div className="panel-card max-lg:rounded-[18px]">
            <div className="panel-card-header">
              <h3
                className="cp-heading flex items-center gap-2 font-bold"
                style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}
              >
                <UserRound size={13} />
                Twoje konto
              </h3>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-2">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              ) : (
                <>
                  <p className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)" }}>
                    {profile ? `${profile.firstName} ${profile.lastName}` : "-"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--blue)" }}>
                    Konto aktywne
                  </p>
                  <ul className="mt-3 space-y-1 text-xs">
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Wszystkie naprawy:</span>
                      <span className="cp-heading">{stats?.total ?? "-"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Aktywne:</span>
                      <span style={{ color: "var(--amber)" }}>{stats?.active ?? "-"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Zakończone:</span>
                      <span className="cp-heading">{completedCount ?? "-"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Klient od:</span>
                      <span className="cp-heading">
                        {profile?.createdAt ? formatMonthYear(profile.createdAt) : "-"}
                      </span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="panel-card max-lg:rounded-[18px]">
            <div className="panel-card-header">
              <h3
                className="cp-heading flex items-center gap-2 font-bold"
                style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}
              >
                <Phone size={13} />
                Kontakt z serwisem
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Szybki kontakt i godziny pracy serwisu.
              </p>

              <a
                href="tel:883200151"
                className="flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--border)", background: "var(--island2)" }}
              >
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                    Telefon
                  </p>
                  <p className="text-base font-semibold" style={{ color: "var(--heading)" }}>
                    883 200 151
                  </p>
                </div>
              </a>

              <a
                href="mailto:sklep@pro-kom.eu"
                className="flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--border)", background: "var(--island2)" }}
              >
                <span className="text-lg">✉️</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                    E-mail
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--heading)" }}>
                    sklep@pro-kom.eu
                  </p>
                </div>
              </a>

              <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--island2)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                  Godziny
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed" style={{ color: "var(--ink)" }}>
                  Pon-Pt 9:00-17:00, Sob 9:00-14:00
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
