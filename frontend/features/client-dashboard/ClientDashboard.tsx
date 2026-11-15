"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useClientProfile } from "@/hooks/useClientProfile";
import {
  apiMySummaryToDashboardStats,
  apiRepairListItemToPanel,
  type ApiMySummary,
  type ApiRepairListItem,
} from "@/lib/panel-api";
import { formatMonthYear } from "@/lib/format";
import type { DashboardStats, Repair } from "@/types/panel";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconArrow, IconCheck, IconWrench } from "@/components/tech/icons";
import { IconAlert } from "@/components/tech/account/account-icons";
import { EmptyState, ErrorCard, KeyValue, PageHead, Panel, Skel } from "@/components/tech/account/AccountUi";
import { RepairRow, RepairRowsSkeleton } from "@/components/tech/account/RepairRow";
import { ServiceContact } from "@/components/tech/account/ServiceContact";
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
    return <ErrorCard message={error} />;
  }

  const firstName = profile?.firstName ?? "Kliencie";
  const statusLead = loading ? "Ładujemy podsumowanie Twojego konta..." : buildStatusLead(stats);
  const completedCount = stats
    ? Math.max(0, (stats.total ?? 0) - (stats.active ?? 0) - (stats.ready ?? 0))
    : null;
  const latestRepairs = repairs?.slice(0, 5) ?? [];

  const tiles = [
    { key: "active", label: "Aktywne", value: stats?.active, hint: "Naprawy w realizacji", icon: <IconWrench size={18} strokeWidth={2.2} />, tone: "" },
    { key: "ready", label: "Gotowe do odbioru", value: stats?.ready, hint: "Możesz odebrać urządzenie", icon: <IconCheck size={18} strokeWidth={2.6} />, tone: stats?.ready ? "ok" : "" },
    { key: "wait", label: "Oczekuje decyzji", value: stats?.waitingDecision, hint: "Sprawdź i potwierdź wycenę", icon: <IconAlert size={18} />, tone: stats?.waitingDecision ? "wait" : "" },
    { key: "total", label: "Wszystkie naprawy", value: stats?.total, hint: "Całkowita liczba zgłoszeń", icon: <IconArrow size={18} />, tone: "" },
  ];

  return (
    <div className="t-ck-page">
      <PageHead eyebrow="Pulpit" title={`Witaj, ${firstName}`} lead={statusLead} />

      <ul className="t-ck-stats" aria-label="Podsumowanie napraw">
        {tiles.map((t) => (
          <li key={t.key} className={`t-ck-card t-ck-stat${t.tone ? ` t-ck-stat--${t.tone}` : ""}`}>
            <span className="t-ck-stat__top">
              <span className="t-ck-stat__label">{t.label}</span>
              <span className="t-ck-stat__ico" aria-hidden="true">
                {t.icon}
              </span>
            </span>
            {loading ? <Skel w={44} h={34} r={8} /> : <span className="t-ck-stat__value">{t.value ?? "-"}</span>}
            <span className="t-ck-stat__hint">{t.hint}</span>
          </li>
        ))}
      </ul>

      <div className="t-ck-cols">
        <div className="t-ck-cols__main">
          <Panel
            title="Ostatnie naprawy"
            desc="Pięć najnowszych zgłoszeń"
            icon={<IconWrench size={18} strokeWidth={2.2} />}
            action={
              <Link href="/client/naprawy" className="t-ck-link t-ck-link--sm t-ck-more">
                Zobacz wszystkie
                <IconArrow size={13} />
              </Link>
            }
          >
            {loading ? (
              <RepairRowsSkeleton count={3} />
            ) : latestRepairs.length > 0 ? (
              <ul className="t-ck-rows">
                {latestRepairs.map((repair) => (
                  <RepairRow key={repair.id} repair={repair} />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Brak napraw"
                text="Zgłoś usterkę, aby zobaczyć tutaj swoje zgłoszenia."
                action={
                  <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--acc t-pbtn--m">
                    Zgłoś naprawę
                  </Link>
                }
              />
            )}
          </Panel>

          <FindMyRepairCard />
        </div>

        <aside className="t-ck-cols__side">
          <Panel title="Twoje konto" icon={<IconCheck size={18} strokeWidth={2.4} />}>
            {loading ? (
              <div className="t-ck-stack">
                <Skel w="60%" h={18} />
                <Skel w="80%" h={12} />
                <Skel w="70%" h={12} />
              </div>
            ) : (
              <>
                <p className="t-ck-acctname">{profile ? `${profile.firstName} ${profile.lastName}` : "-"}</p>
                <p className="t-ck-okline">
                  <i aria-hidden="true" />
                  Konto aktywne
                </p>
                <dl className="t-ck-kvs">
                  <KeyValue label="Wszystkie naprawy">{stats?.total ?? "-"}</KeyValue>
                  <KeyValue label="Aktywne">{stats?.active ?? "-"}</KeyValue>
                  <KeyValue label="Zakończone">{completedCount ?? "-"}</KeyValue>
                  <KeyValue label="Klient od">{profile?.createdAt ? formatMonthYear(profile.createdAt) : "-"}</KeyValue>
                </dl>
              </>
            )}
          </Panel>

          <Panel title="Kontakt z serwisem" desc="Telefon, e-mail i godziny pracy punktów">
            <ServiceContact compact />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
