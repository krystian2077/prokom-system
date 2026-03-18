"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ComplaintWarrantyStatusValue =
  | "accepted"
  | "verification"
  | "awaiting_decision"
  | "recognized"
  | "rejected"
  | "in_progress"
  | "closed";

type TabKey = "all" | "complaint" | "warranty";

const PAGE_SIZE = 25;

const COMPLAINT_WARRANTY_STATUS_OPTIONS: Array<{ value: ComplaintWarrantyStatusValue; label: string }> = [
  { value: "accepted", label: "Przyjęta" },
  { value: "verification", label: "Weryfikacja" },
  { value: "awaiting_decision", label: "Oczekuje na decyzję" },
  { value: "recognized", label: "Uznana" },
  { value: "rejected", label: "Odrzucona" },
  { value: "in_progress", label: "W trakcie realizacji" },
  { value: "closed", label: "Zakończona" },
];

function getComplaintWarrantyLabel(value: string | null | undefined) {
  if (!value) return "—";
  const v = value as ComplaintWarrantyStatusValue;
  return COMPLAINT_WARRANTY_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? value;
}

function complaintWarrantyBadgeClass(value: string | null | undefined) {
  const v = value ?? "";
  if (["accepted", "recognized", "closed"].includes(v)) return "border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]";
  if (["verification"].includes(v)) return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
  if (["awaiting_decision", "in_progress"].includes(v)) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (["rejected"].includes(v)) return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

function priorityBadgeClass(priorityDisplay: string) {
  const p = (priorityDisplay ?? "").toLowerCase();
  if (p.includes("piln") || p.includes("urgent")) return "border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]";
  if (p.includes("ważn") || p.includes("important") || p.includes("wysok")) return "border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]";
  if (p.includes("niski") || p.includes("low")) return "border-white/10 bg-white/5 text-[#9ca3af]";
  return "border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]";
}

function statusPillStyle(statusDisplay: string) {
  const s = (statusDisplay ?? "").toLowerCase();
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";
  if (["cancelled", "unrepairable", "abandoned"].includes(s)) return `${base} border-[#dc1e1e]/35 bg-[#dc1e1e]/15 text-[#ffb4b4]`;
  if (["delivered", "picked_up"].includes(s)) return `${base} border-[#22c55e]/35 bg-[#22c55e]/15 text-[#bbf7d0]`;
  if (["shipped"].includes(s)) return `${base} border-[#3b82f6]/35 bg-[#3b82f6]/15 text-[#bcd6ff]`;
  if (["ready_for_pickup", "repair_done"].includes(s)) return `${base} border-[#f59e0b]/35 bg-[#f59e0b]/15 text-[#ffe3b0]`;
  return `${base} border-white/10 bg-white/5 text-[#9ca3af]`;
}

export default function ComplaintsWarrantyPage() {
  const { user, token } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const [tab, setTab] = useState<TabKey>("all");
  const [complaintStatus, setComplaintStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  const load = async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("ordering", "-created_at");

      // Staff: tylko przypisane do mnie (analogicznie jak w innych panelach).
      if (user.role === "staff") params.set("assigned_to", String(user.id));

      if (tab !== "all") params.set("repair_type", tab === "complaint" ? "complaint" : "warranty");
      if (complaintStatus.trim()) params.set("complaint_warranty_status", complaintStatus.trim());
      if (search.trim()) params.set("search", search.trim());

      const url = `/repairs/?${params.toString()}`;
      const res = await api.get<PaginatedResponse<RepairRequestListItem>>(url, token);
      setItems(res.results ?? []);
      setCount(res.count ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy reklamacji/gwarancji.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaffOrAdmin || !token) return;
    void load();

    const id = window.setInterval(() => {
      void load();
    }, 30_000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, isStaffOrAdmin, tab, complaintStatus, search, page]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, complaintStatus, search]);

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9ca3af]">
          {user?.role === "admin" ? "Panel Admina" : "Panel pracownika"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Reklamacje i gwarancje</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Sprawy powiązane z naprawami: statusy reklamacji/gwarancji, priorytety i oczekiwanie na klienta.
        </p>
      </header>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Wszystkie"],
                ["complaint", "Reklamacje"],
                ["warranty", "Gwarancje"],
              ] as Array<[TabKey, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  tab === k
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full md:w-[340px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                Szukaj
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Numer naprawy / klient / urządzenie…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
              />
            </div>

            <div className="w-full md:w-[220px]">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                Status decyzji
              </label>
              <select
                value={complaintStatus}
                onChange={(e) => setComplaintStatus(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Wszystkie</option>
                {COMPLAINT_WARRANTY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full justify-end gap-3 md:w-auto">
              <button
                type="button"
                onClick={() => void load()}
                disabled={!token || loading}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                Odśwież
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-[#fca5a5]">{error}</p> : null}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#9ca3af]">
              Wyniki: <span className="text-white font-semibold">{items.length}</span> z{" "}
              <span className="text-white font-semibold">{count}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                ← Poprzednie
              </button>
              <span className="text-sm text-[#9ca3af]">
                Strona <span className="text-white font-semibold">{page}</span> / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                Następne →
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">
              Brak spraw w tym widoku.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <div key={r.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Sprawa</p>
                      <Link
                        href={`/panel/repairs/${r.id}`}
                        className="mt-1 block truncate text-lg font-semibold text-white hover:underline"
                      >
                        {r.repair_number}
                      </Link>
                      <p className="mt-2 truncate text-sm text-[#9ca3af]">
                        {r.device_name} · {r.client_name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${complaintWarrantyBadgeClass(
                        r.complaint_warranty_status,
                      )} uppercase tracking-wide`}
                      title="Status reklamacji/gwarancji"
                    >
                      {getComplaintWarrantyLabel(r.complaint_warranty_status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={statusPillStyle(r.status)} title="Status naprawy">
                      {r.status_display}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${priorityBadgeClass(
                        r.priority_display,
                      )}`}
                      title="Priorytet"
                    >
                      {r.priority_display}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-[#e5e7eb]">
                    {r.complaint_warranty_status ? (
                      <div className="text-xs text-[#9ca3af]">
                        Wymaga decyzji:{" "}
                        <span className="font-semibold text-white">{r.complaint_warranty_status}</span>
                      </div>
                    ) : null}
                    {typeof r.waiting_for_client_days === "number" ? (
                      <div className="mt-1 text-xs text-[#9ca3af]">
                        Czeka {r.waiting_for_client_days} dni na klienta
                      </div>
                    ) : null}
                    {r.requires_attention ? <div className="mt-2 text-xs font-semibold text-[#ffe3b0]">Oznaczone jako wymaga uwagi</div> : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-[#9ca3af]">
                      Utworzono: {new Date(r.created_at).toLocaleDateString("pl-PL")}
                    </p>
                    <Link
                      href={`/panel/repairs/${r.id}`}
                      className="text-xs font-semibold text-[#9ca3af] hover:text-white hover:underline"
                    >
                      Otwórz →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

