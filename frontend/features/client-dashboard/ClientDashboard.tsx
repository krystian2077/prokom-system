"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { formatDate, formatMonthYear } from "@/lib/format";
import { formatPrice } from "@/types/panel";
import { getDeviceEmoji } from "@/types/panel";
import { truncate } from "@/lib/format";
import type { DashboardStats } from "@/types/panel";
import type { Repair } from "@/types/panel";

export function ClientDashboard() {
  const { token, user } = useAuth();
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
        const list = Array.isArray(listRes) ? listRes : (listRes as { results: ApiRepairListItem[] }).results ?? [];
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

  const firstName = profile?.firstName ?? "...";
  let subtitle: React.ReactNode = "Nie masz aktywnych napraw.";
  if (stats) {
    if (stats.active > 0 && stats.ready > 0) {
      subtitle = (
        <>
          Masz <span style={{ color: "var(--amber)" }}>{stats.active}</span> aktywnych napraw i{" "}
          <span style={{ color: "var(--green)" }}>{stats.ready}</span> gotową do odbioru.
        </>
      );
    } else if (stats.active > 0) {
      subtitle = (
        <>
          Masz <span style={{ color: "var(--amber)" }}>{stats.active}</span> aktywnych napraw.
        </>
      );
    } else if (stats.ready > 0) {
      subtitle = (
        <>
          Masz <span style={{ color: "var(--green)" }}>{stats.ready}</span> gotową do odbioru.
        </>
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                <span
                  className="h-2 w-2 rounded-full bg-[var(--green)]"
                  style={{ animation: "statusPulse 1.5s ease infinite" }}
                />
                PANEL KLIENTA
              </p>
              <h1
                className="font-extrabold cp-heading"
                style={{
                  fontFamily: "var(--font-unbounded)",
                  fontSize: "clamp(22px, 2.8vw, 34px)",
                }}
              >
                Dzień dobry, {firstName}.
              </h1>
              {loading ? (
                <div className="skeleton mt-2 h-4 w-[200px] rounded" />
              ) : (
                <p className="mt-2 text-sm" style={{ color: "var(--ink2)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* 4 stat cards */}
          <div className="grid gap-3.5 grid-cols-2 xl:grid-cols-4">
            {[
              { color: "green", icon: "🔧", value: stats?.active ?? "–", label: "Aktywne naprawy", badge: "AKTYWNE" },
              { color: "amber", icon: "📦", value: stats?.ready ?? "–", label: "Gotowe do odbioru", badge: "GOTOWE" },
              { color: "blue", icon: "⏳", value: stats?.waitingDecision ?? "–", label: "Oczekujące na decyzję", badge: "OCZEKUJE" },
              { color: "red", icon: "📋", value: stats?.total ?? "–", label: "Wszystkie naprawy", badge: "ŁĄCZNIE" },
            ].map((card, i) => (
              <div
                key={card.label}
                className="panel-card group overflow-hidden"
                style={{
                  animation: `fadeUp .5s ${i * 0.05}s ease both`,
                }}
              >
                <div className="p-5">
                  {loading ? (
                    <>
                      <div className="skeleton mb-3 h-9 w-9 rounded-full" />
                      <div className="skeleton mb-2 h-3 w-12 rounded" />
                      <div className="skeleton mb-1 h-8 w-11 rounded" />
                      <div className="skeleton h-3 w-24 rounded" />
                    </>
                  ) : (
                    <>
                      <div
                        className="mb-3 flex h-9 w-9 items-center justify-center rounded-full text-lg"
                        style={{
                          background: `var(--${card.color}-l)`,
                          border: `1px solid var(--${card.color}-b)`,
                        }}
                      >
                        {card.icon}
                      </div>
                      <span
                        className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          background: card.color === "red" ? "var(--island3)" : `var(--${card.color}-l)`,
                          color: card.color === "red" ? "var(--ink2)" : `var(--${card.color})`,
                        }}
                      >
                        {card.badge}
                      </span>
                      <p className="cp-heading text-2xl font-bold">{card.value}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {card.label}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ostatnie naprawy */}
          <div className="panel-card mt-8">
            <div className="panel-card-header flex items-center justify-between">
              <h2 className="cp-heading font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 13 }}>
                Ostatnie naprawy
              </h2>
              <Link
                href="/client/naprawy"
                className="text-xs font-medium transition hover:text-[var(--heading)]"
                style={{ color: "var(--red)" }}
              >
                Zobacz wszystkie →
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
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
              ) : repairs && repairs.length > 0 ? (
                repairs.slice(0, 5).map((repair) => (
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
                        {truncate(repair.problemDescription ? `${repair.deviceModel} – ${repair.problemDescription}` : repair.deviceModel, 60)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Nr ref: {repair.repairNumber} · Przyjęto {formatDate(repair.createdAt)}
                        {(repair.deliveryMethod === "kurier" || repair.pickupMethod === "kurier") && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: "rgba(220,30,30,.15)", color: "var(--red)", border: "1px solid rgba(220,30,30,.35)" }}>
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
                    className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
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
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5 lg:max-w-[300px]">
          <div className="panel-card" style={{ animation: "fadeUp .5s .2s ease both" }}>
            <div className="panel-card-header">
              <h3 className="cp-heading flex items-center gap-2 font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" style={{ animation: "statusPulse 1.2s ease infinite" }} />
                SZYBKIE AKCJE
              </h3>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <Link
                href="/zgloszenie"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm font-medium text-white transition hover:opacity-95"
                style={{ background: "var(--red)" }}
              >
                <span>🔧 Zgłoś nową naprawę</span>
                <span className="text-xs opacity-90">Formularz online w 5 min</span>
              </Link>
              <Link
                href="/client/naprawy"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm transition hover:bg-[var(--island3)]"
                style={{ background: "var(--island2)", color: "var(--ink)" }}
              >
                <span>📋 Moje naprawy</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>Historia i statusy</span>
              </Link>
              <Link
                href="/client/profil"
                className="flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm transition hover:bg-[var(--island3)]"
                style={{ color: "var(--ink)" }}
              >
                <span>👤 Edytuj profil</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>Dane i preferencje</span>
              </Link>
            </div>
          </div>

          <div className="panel-card" style={{ animation: "fadeUp .5s .25s ease both" }}>
            <div className="panel-card-header">
              <h3 className="cp-heading flex items-center gap-2 font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" style={{ animation: "statusPulse 1.2s ease infinite" }} />
                TWÓJ PROFIL
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
                    {profile ? `${profile.firstName} ${profile.lastName}` : "…"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--blue)" }}>Konto aktywne</p>
                  <ul className="mt-3 space-y-1 text-xs">
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Wszystkie naprawy:</span>
                      <span className="cp-heading">{stats?.total ?? "–"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Aktywne:</span>
                      <span style={{ color: "var(--amber)" }}>{stats?.active ?? "–"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Zakończone:</span>
                      <span className="cp-heading">{(stats ? Math.max(0, (stats.total ?? 0) - (stats.active ?? 0) - (stats.ready ?? 0)) : "–")}</span>
                    </li>
                    <li className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Klient od:</span>
                      <span className="cp-heading">{profile?.createdAt ? formatMonthYear(profile.createdAt) : "–"}</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="panel-card" style={{ animation: "fadeUp .5s .28s ease both" }}>
            <div className="panel-card-header">
              <h3 className="cp-heading flex items-center gap-2 font-bold" style={{ fontFamily: "var(--font-unbounded)", fontSize: 11 }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" style={{ animation: "statusPulse 1.2s ease infinite" }} />
                KONTAKT Z SERWISEM
              </h3>
            </div>
            <div className="space-y-2 p-4 text-sm" style={{ color: "var(--ink)" }}>
              <p>📞 883 200 151</p>
              <p>✉️ sklep@pro-kom.eu</p>
              <p>🕐 Pon–Pt 9:00–17:00 / Sob 9:00–14:00</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
