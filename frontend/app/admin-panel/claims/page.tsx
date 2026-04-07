"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { fetchAllPages } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StackedRowSkeleton } from "@/components/ui/Skeleton";
import type { RepairRequestListItem } from "@/types/repairs";

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
  if (bucket === "in_progress") return "border-[var(--ab)] bg-[var(--al)] text-[var(--amber)]";
  if (bucket === "awaiting") return "border-[var(--bb)] bg-[var(--bl)] text-[var(--blue)]";
  if (bucket === "closed") return "border-[var(--border2)] bg-[var(--s3)] text-[var(--ink2)]";
  return "border-[var(--border)] bg-[var(--s2)] text-[var(--muted)]";
}

function badgeLabel(bucket: ReturnType<typeof complaintBucket>) {
  if (bucket === "in_progress") return "W toku";
  if (bucket === "awaiting") return "Oczekuje";
  if (bucket === "closed") return "Zamknięta";
  return "—";
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

export default function AdminClaimsPage() {
  const { token, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === "admin";

  const type = useMemo<TypeFilter>(() => {
    const t = searchParams.get("type");
    if (t === "complaint" || t === "warranty") return t;
    return "all";
  }, [searchParams]);

  const status = useMemo<StatusFilter>(() => {
    const s = searchParams.get("status");
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
    if (!token || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("ordering", "-created_at");
      params.set("is_complaint", "true");
      if (type === "complaint") params.set("repair_type", "complaint");
      if (type === "warranty") params.set("repair_type", "warranty");
      const inQuery = statusInQuery(status);
      if (inQuery) params.set("complaint_warranty_status_in", inQuery);
      params.set("page_size", "200");
      const rows = await fetchAllPages<RepairRequestListItem>(`/repairs/?${params.toString()}`, token);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać reklamacji."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, status, type]);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink2)]">Panel Admina</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--white)]">Reklamacje i Gwarancje</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin-panel/intake")}
          className="rounded-2xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b81818]"
        >
          + Nowa reklamacja
        </button>
      </header>

      <div className="mb-5 rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
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
                  ? "border-[var(--bb)] bg-[var(--bl)] text-[var(--blue)]"
                  : "border-[var(--border)] bg-[var(--s2)] text-[var(--ink2)] hover:bg-[var(--row-hover)] hover:text-[var(--white)]"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-7 w-px bg-[var(--border)] md:block" />
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
                  ? "border-[var(--bb)] bg-[var(--bl)] text-[var(--blue)]"
                  : "border-[var(--border)] bg-[var(--s2)] text-[var(--ink2)] hover:bg-[var(--row-hover)] hover:text-[var(--white)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-4">
          <StackedRowSkeleton rows={6} />
        </div>
      ) : !error && items.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--s1)] py-8">
          <EmptyState icon="🛡️" title="Brak reklamacji w tym widoku" description="Zmień filtry albo sprawdź ponownie później." />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r, idx) => {
            const bucket = complaintBucket(r.complaint_warranty_status);
            const created = new Date(r.created_at).toLocaleString("pl-PL");
            const icon = symbolFor(r);
            const codePrefix = icon === "⚠️" ? "GAW" : "REK";
            return (
              <li key={r.id}>
                <Link
                  href={`/admin-panel/repairs/${r.id}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 transition hover:border-[var(--border2)] hover:bg-[var(--row-hover)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="font-mono text-sm font-bold text-[var(--white)]">
                          {codePrefix}-{String(idx + 1).padStart(3, "0")}
                        </span>
                        <span className="text-[var(--muted)]">·</span>
                        <span className="font-mono text-sm font-semibold text-[var(--ink2)]">{r.repair_number}</span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--ink)]">{r.device_name} - {r.problem_description ?? "Brak opisu"}</p>
                      <p className="mt-2 text-xs text-[var(--ink2)]">
                        {r.client_name} · {created} · {assignedLabel(r)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass(bucket)}`}>
                        {badgeLabel(bucket)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // decyzja admina - endpoint docelowy do podpięcia w następnym kroku
                          }}
                          className="rounded-lg border border-[var(--gb)] bg-[var(--gl)] px-2.5 py-1 text-[11px] font-semibold text-[var(--green)]"
                        >
                          Uznana
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // decyzja admina - endpoint docelowy do podpięcia w następnym kroku
                          }}
                          className="rounded-lg border border-[var(--rb)] bg-[var(--rl)] px-2.5 py-1 text-[11px] font-semibold text-[var(--red)]"
                        >
                          Odrzucona
                        </button>
                      </div>
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

