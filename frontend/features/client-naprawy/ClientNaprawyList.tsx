"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { apiRepairListItemToPanel, type ApiRepairListItem } from "@/lib/panel-api";
import type { Repair } from "@/types/panel";
import { SUBMIT_HREF } from "@/lib/tech/nav";
import { IconCheck, IconChevronRight, IconWrench } from "@/components/tech/icons";
import { IconAlert } from "@/components/tech/account/account-icons";
import { EmptyState, ErrorCard, PageHead } from "@/components/tech/account/AccountUi";
import { RepairRow, RepairRowsSkeleton } from "@/components/tech/account/RepairRow";

const ITEMS_PER_PAGE = 10;
const FILTERS = ["Wszystkie", "W naprawie", "Gotowe", "Oczekuje", "Zakończone"] as const;

function filterRepairs(repairs: Repair[] | null, activeFilter: string): Repair[] {
  if (!repairs) return [];
  if (activeFilter === "Wszystkie") return repairs;
  if (activeFilter === "W naprawie") return repairs.filter((r) => r.status === "in_progress");
  if (activeFilter === "Gotowe") return repairs.filter((r) => r.status === "ready" || r.status === "done");
  if (activeFilter === "Oczekuje") return repairs.filter((r) => r.status === "wait_decision" || r.status === "diagnosed");
  if (activeFilter === "Zakończone") return repairs.filter((r) => r.status === "done");
  return repairs;
}

function getFilterCounts(repairs: Repair[] | null): Record<string, number> {
  if (!repairs) return { Wszystkie: 0, "W naprawie": 0, Gotowe: 0, Oczekuje: 0, Zakonczone: 0 };
  return {
    Wszystkie: repairs.length,
    "W naprawie": repairs.filter((r) => r.status === "in_progress").length,
    Gotowe: repairs.filter((r) => r.status === "ready" || r.status === "done").length,
    Oczekuje: repairs.filter((r) => r.status === "wait_decision" || r.status === "diagnosed").length,
    Zakonczone: repairs.filter((r) => r.status === "done").length,
  };
}

export function ClientNaprawyList() {
  const { token } = useAuth();
  const [repairs, setRepairs] = useState<Repair[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Wszystkie");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredRepairs = filterRepairs(repairs, activeFilter);
  const filterCounts = getFilterCounts(repairs);
  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / ITEMS_PER_PAGE));
  const pageRepairs = filteredRepairs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<ApiRepairListItem[] | { results: ApiRepairListItem[] }>("/repairs/", token)
      .then((res) => {
        if (cancelled) return;
        const arr = Array.isArray(res) ? res : (res as { results: ApiRepairListItem[] }).results ?? [];
        setRepairs(arr.map(apiRepairListItemToPanel));
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

  if (error && !repairs) {
    return <ErrorCard message={error} />;
  }

  const summary = [
    { key: "W naprawie", label: "Aktywne", icon: <IconWrench size={17} strokeWidth={2.2} />, value: filterCounts["W naprawie"] },
    { key: "Gotowe", label: "Gotowe", icon: <IconCheck size={17} strokeWidth={2.6} />, value: filterCounts.Gotowe },
    { key: "Oczekuje", label: "Oczekuje", icon: <IconAlert size={17} />, value: filterCounts.Oczekuje },
  ];

  return (
    <div className="t-ck-page">
      <PageHead
        eyebrow="Moje naprawy"
        title="Moje naprawy"
        lead="Najważniejsze statusy i pełna historia zgłoszeń w jednym miejscu."
      />

      <section className="t-ck-card t-ck-list" aria-label="Lista napraw">
        {!loading && (
          <ul className="t-ck-mini" aria-label="Podsumowanie">
            {summary.map((m) => (
              <li key={m.key}>
                <span className="t-ck-mini__ico" aria-hidden="true">
                  {m.icon}
                </span>
                <span className="t-ck-mini__label">{m.label}</span>
                <strong>{m.value}</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="t-ck-filters" role="group" aria-label="Filtry">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`t-ck-filter${activeFilter === f ? " is-on" : ""}`}
              aria-pressed={activeFilter === f}
            >
              {f}
              <span className="t-ck-filter__n">{filterCounts[f] != null ? filterCounts[f] : 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <RepairRowsSkeleton count={5} />
        ) : pageRepairs.length === 0 ? (
          <EmptyState
            title="Brak napraw"
            text={activeFilter === "Wszystkie" ? "Nie masz jeszcze zgłoszeń." : "Brak napraw w tej kategorii."}
            action={
              activeFilter === "Wszystkie" ? (
                <Link href={SUBMIT_HREF} className="t-pbtn t-pbtn--acc t-pbtn--m">
                  Zgłoś naprawę
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="t-ck-rows">
            {pageRepairs.map((repair) => (
              <RepairRow key={repair.id} repair={repair} statusLabel={repair.statusDisplay} />
            ))}
          </ul>
        )}

        {!loading && filteredRepairs.length > 0 && (
          <nav className="t-ck-pager" aria-label="Strony listy napraw">
            <p>
              Wyświetlono {pageRepairs.length} z {filteredRepairs.length} napraw
            </p>
            <div className="t-ck-pager__btns">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="t-ck-pager__btn"
                aria-label="Poprzednia strona"
              >
                <IconChevronRight size={18} className="t-ck-flip" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`t-ck-pager__btn${currentPage === p ? " is-on" : ""}`}
                  aria-current={currentPage === p ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="t-ck-pager__btn"
                aria-label="Następna strona"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
