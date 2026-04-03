"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";

type TypeFilter = "all" | "complaint" | "warranty";
type StatusFilter = "all" | "in_progress" | "awaiting" | "closed";

const PHASE_IN_PROGRESS = ["verification", "in_progress", "recognized"] as const;
const PHASE_AWAITING = ["accepted", "awaiting_decision"] as const;
const PHASE_CLOSED = ["closed", "rejected"] as const;

function statusInQuery(v: StatusFilter): string | null {
  if (v === "in_progress") return PHASE_IN_PROGRESS.join(",");
  if (v === "awaiting") return PHASE_AWAITING.join(",");
  if (v === "closed") return PHASE_CLOSED.join(",");
  return null;
}

function complaintBucket(status: string | null | undefined): "in_progress" | "awaiting" | "closed" | "other" {
  const s = status ?? "";
  if ((PHASE_IN_PROGRESS as readonly string[]).includes(s)) return "in_progress";
  if ((PHASE_AWAITING as readonly string[]).includes(s)) return "awaiting";
  if ((PHASE_CLOSED as readonly string[]).includes(s)) return "closed";
  return "other";
}

function badgeClass(bucket: ReturnType<typeof complaintBucket>) {
  if (bucket === "in_progress") return "border-[#f59e0b]/40 bg-[#f59e0b]/12 text-[#ffe3b0]";
  if (bucket === "awaiting") return "border-[#3b82f6]/40 bg-[#3b82f6]/12 text-[#bcd6ff]";
  if (bucket === "closed") return "border-white/20 bg-white/10 text-[#d1d5db]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

function badgeLabel(bucket: ReturnType<typeof complaintBucket>) {
  if (bucket === "in_progress") return "W toku";
  if (bucket === "awaiting") return "Oczekuje";
  if (bucket === "closed") return "Zamknięta";
  return "—";
}

function typeBadgeClass(type: string | null | undefined) {
  if (type === "warranty") return "border-[#3b82f6]/35 bg-[#3b82f6]/12 text-[#bfdbfe]";
  return "border-[#f59e0b]/35 bg-[#f59e0b]/12 text-[#fde68a]";
}

function typeBadgeLabel(type: string | null | undefined) {
  return type === "warranty" ? "Gwarancja" : "Reklamacja";
}

function assignedLabel(r: RepairRequestListItem): string {
  const a = r.assigned_to;
  if (!a) return "—";
  if (typeof a === "string") return a;
  const full = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  return full || a.email || "—";
}

function symbolFor(item: RepairRequestListItem): "🛡️" | "⚠️" {
  const cws = (item.complaint_warranty_status ?? "").toLowerCase();
  if (cws.includes("warranty") || cws.includes("gwaranc")) return "⚠️";
  return "🛡️";
}

export default function ComplaintsWarrantyPage() {
  const { user, token } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = useMemo<TypeFilter>(() => {
    const t = searchParams.get("type") ?? searchParams.get("kind");
    if (t === "complaint" || t === "warranty") return t;
    return "all";
  }, [searchParams]);

  const status = useMemo<StatusFilter>(() => {
    const s = searchParams.get("status") ?? searchParams.get("phase");
    if (s === "in_progress" || s === "awaiting" || s === "closed") return s;
    return "all";
  }, [searchParams]);

  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setFilters = useCallback(
    (next: Partial<{ type: TypeFilter; status: StatusFilter }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const t = next.type ?? type;
      const s = next.status ?? status;
      params.delete("kind");
      params.delete("phase");
      if (t === "all") params.delete("type");
      else params.set("type", t);
      if (s === "all") params.delete("status");
      else params.set("status", s);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, status, type],
  );

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("ordering", "-created_at");
      if (user.role === "staff") params.set("assigned_to", String(user.id));

      if (type === "complaint") params.set("repair_type", "complaint");
      else if (type === "warranty") params.set("repair_type", "warranty");
      else params.set("repair_types", "complaint,warranty");

      const inQuery = statusInQuery(status);
      if (inQuery) params.set("complaint_warranty_status_in", inQuery);

      const rows = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      const safeRows = (Array.isArray(rows) ? rows : []).filter(
        (row) => row.repair_type === "complaint" || row.repair_type === "warranty",
      );
      setItems(safeRows);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać reklamacji."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, user, status, type]);

  useEffect(() => {
    if (!isStaffOrAdmin || !token) return;
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [isStaffOrAdmin, token, load]);

  if (!isStaffOrAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Brak uprawnień.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Panel Pracownika</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
            <Sparkles size={20} className="text-[#f59e0b]" />
            Reklamacje i Gwarancje
          </h1>
          <p className="mt-1 text-sm text-[#9ca3af]">Widok premium tylko dla spraw reklamacyjnych i gwarancyjnych.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#d1d5db] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            Odśwież
          </button>
          <button
            type="button"
            onClick={() => router.push("/panel/reklamacje-gwarancje/przyjecie")}
            className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
          >
            + Nowa reklamacja
          </button>
        </div>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
          <p className="text-xs uppercase tracking-wide text-[#6b7280]">Wszystkie</p>
          <p className="mt-2 text-2xl font-semibold text-white">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-[#f59e0b]/25 bg-[#f59e0b]/10 p-4">
          <p className="text-xs uppercase tracking-wide text-[#fcd34d]">W toku</p>
          <p className="mt-2 text-2xl font-semibold text-[#fde68a]">
            {items.filter((i) => complaintBucket(i.complaint_warranty_status) === "in_progress").length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#3b82f6]/25 bg-[#3b82f6]/10 p-4">
          <p className="text-xs uppercase tracking-wide text-[#bfdbfe]">Oczekujące</p>
          <p className="mt-2 text-2xl font-semibold text-[#dbeafe]">
            {items.filter((i) => complaintBucket(i.complaint_warranty_status) === "awaiting").length}
          </p>
        </div>
      </section>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Wszystkie"],
              ["complaint", "Reklamacje"],
              ["warranty", "Gwarancje"],
            ] as Array<[TypeFilter, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilters({ type: k })}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                type === k
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-7 w-px bg-white/10 md:block" />
          {(
            [
              ["all", "Wszystkie"],
              ["in_progress", "W toku"],
              ["awaiting", "Oczekuje"],
              ["closed", "Zamknięte"],
            ] as Array<[StatusFilter, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilters({ status: k })}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                status === k
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
          <StackedRowSkeleton rows={6} />
        </div>
      ) : !error && items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] py-8">
          <EmptyState icon="🛡️" title="Brak reklamacji w tym widoku" description="Zmień filtry albo sprawdź ponownie później." />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => {
            const bucket = complaintBucket(r.complaint_warranty_status);
            const bucketLabel = badgeLabel(bucket);
            const created = new Date(r.created_at).toLocaleString("pl-PL");
            const icon = symbolFor(r);
            const caseCode = `${r.repair_type === "warranty" ? "GAW" : "REK"}-${r.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
            return (
              <li key={r.id}>
                <Link
                  href={`/panel/naprawy/${r.id}`}
                  className="group block rounded-2xl border border-white/10 bg-[#0b0c10] p-4 transition hover:border-white/20 hover:bg-[#0c0d14]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="font-mono text-sm font-bold text-white">{caseCode}</span>
                        <span className="text-[#6b7280]">·</span>
                        <span className="font-mono text-sm font-semibold text-[#9ca3af]">{r.repair_number}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeBadgeClass(r.repair_type)}`}>
                          {typeBadgeLabel(r.repair_type)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[#e5e7eb]">{r.device_name} - {r.problem_description ?? "Brak opisu"}</p>
                      <p className="mt-2 text-xs text-[#9ca3af]">
                        {r.client_name} · {created} · {assignedLabel(r)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass(bucket)}`}>
                        {bucketLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#d1d5db] transition group-hover:border-white/25 group-hover:text-white">
                        Szczegóły
                        <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
