"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { RepairRequestListItem } from "@/types/repairs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

type PhaseKey = "all" | "in_progress" | "awaiting" | "closed";
type KindKey = "all" | "complaint" | "warranty";

const PHASE_IN_PROGRESS = ["verification", "in_progress", "recognized"] as const;
const PHASE_AWAITING = ["accepted", "awaiting_decision"] as const;
const PHASE_CLOSED = ["closed", "rejected"] as const;

function phaseQueryValue(phase: PhaseKey): string | null {
  if (phase === "in_progress") return PHASE_IN_PROGRESS.join(",");
  if (phase === "awaiting") return PHASE_AWAITING.join(",");
  if (phase === "closed") return PHASE_CLOSED.join(",");
  return null;
}

function complaintUiBucket(status: string | null | undefined): "in_progress" | "awaiting" | "closed" | "other" {
  const s = status ?? "";
  if ((PHASE_IN_PROGRESS as readonly string[]).includes(s)) return "in_progress";
  if ((PHASE_AWAITING as readonly string[]).includes(s)) return "awaiting";
  if ((PHASE_CLOSED as readonly string[]).includes(s)) return "closed";
  return "other";
}

function complaintStatusBadgeClass(bucket: ReturnType<typeof complaintUiBucket>) {
  if (bucket === "in_progress") return "border-[#f59e0b]/40 bg-[#f59e0b]/12 text-[#ffe3b0]";
  if (bucket === "awaiting") return "border-[#3b82f6]/40 bg-[#3b82f6]/12 text-[#bcd6ff]";
  if (bucket === "closed") return "border-white/20 bg-white/10 text-[#d1d5db]";
  return "border-white/10 bg-white/5 text-[#9ca3af]";
}

function complaintStatusBadgeLabel(
  bucket: ReturnType<typeof complaintUiBucket>,
  display: string | null | undefined,
) {
  if (bucket === "in_progress") return "W toku";
  if (bucket === "awaiting") return "Oczekuje";
  if (bucket === "closed") return "Zamknięta";
  return display?.trim() || "—";
}

function formatAssignedTo(r: RepairRequestListItem): string {
  const a = r.assigned_to;
  if (!a) return "—";
  if (typeof a === "string") return a;
  const fn = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  return fn || a.email || "—";
}

function rekLabel(id: string) {
  const compact = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `REK-${compact || "—"}`;
}

export default function ComplaintsWarrantyPage() {
  const { user, token } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const phase = useMemo<PhaseKey>(() => {
    const p = searchParams.get("phase");
    if (p === "in_progress" || p === "awaiting" || p === "closed") return p;
    return "all";
  }, [searchParams]);

  const kind = useMemo<KindKey>(() => {
    const k = searchParams.get("kind");
    if (k === "complaint" || k === "warranty") return k;
    return "all";
  }, [searchParams]);

  const [items, setItems] = useState<RepairRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pushFilters = useCallback(
    (next: Partial<{ phase: PhaseKey; kind: KindKey }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const p = next.phase ?? phase;
      const k = next.kind ?? kind;
      if (p === "all") params.delete("phase");
      else params.set("phase", p);
      if (k === "all") params.delete("kind");
      else params.set("kind", k);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [searchParams, router, pathname, phase, kind],
  );

  const load = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("ordering", "-created_at");
      if (user.role === "staff") params.set("assigned_to", String(user.id));

      if (kind === "complaint") params.set("repair_type", "complaint");
      else if (kind === "warranty") params.set("repair_type", "warranty");
      else params.set("repair_types", "complaint,warranty");

      const cwsIn = phaseQueryValue(phase);
      if (cwsIn) params.set("complaint_warranty_status_in", cwsIn);

      const rows = await api.get<RepairRequestListItem[]>(`/staff/repairs/?${params.toString()}`, token);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać listy reklamacji/gwarancji.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, user, kind, phase]);

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
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Reklamacje i gwarancje</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Sprawy reklamacyjne i gwarancyjne — bez tworzenia z tego widoku.</p>
      </header>

      <div className="mb-6 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Wszystkie"],
                ["in_progress", "W toku"],
                ["awaiting", "Oczekuje"],
                ["closed", "Zamknięte"],
              ] as Array<[PhaseKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => pushFilters({ phase: key })}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  phase === key
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden h-8 w-px bg-white/10 lg:block" aria-hidden />

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Obie"],
                ["complaint", "Reklamacje"],
                ["warranty", "Gwarancje"],
              ] as Array<[KindKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => pushFilters({ kind: key })}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  kind === key
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 justify-end">
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

      {error ? (
        <div className="mb-6">
          <ErrorState error={new Error(error)} onRetry={() => void load()} />
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>
      ) : !error && items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0c0d12] py-6">
          <EmptyState
            icon="⚠️"
            title="Brak spraw w tym widoku"
            description="Zmień filtry albo sprawdź ponownie później."
          />
        </div>
      ) : !error ? (
        <>
          <p className="mb-4 text-sm text-[#9ca3af]">
            Wyniki: <span className="font-semibold text-white">{items.length}</span>
          </p>
          <ul className="space-y-3">
            {items.map((r) => {
              const bucket = complaintUiBucket(r.complaint_warranty_status);
              const badgeLabel = complaintStatusBadgeLabel(bucket, r.complaint_warranty_status_display);
              const problem = (r.problem_description ?? "").trim() || "—";
              const when = new Date(r.created_at).toLocaleString("pl-PL");
              return (
                <li key={r.id}>
                  <Link
                    href={`/panel/naprawy/${r.id}`}
                    className="block rounded-2xl border border-white/10 bg-[#0b0c10] p-4 transition hover:border-white/20 hover:bg-[#0c0d14]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--s3)] text-[var(--green)]"
                          aria-hidden
                        >
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-sm font-bold text-white">{rekLabel(r.id)}</span>
                            <span className="text-[#6b7280]">·</span>
                            <span className="font-mono text-sm font-semibold text-[#9ca3af]">{r.repair_number}</span>
                            {r.parent_repair_number ? (
                              <>
                                <span className="text-[#6b7280]">·</span>
                                <span className="text-xs text-[#9ca3af]">
                                  Naprawa źródłowa:{" "}
                                  <span className="font-mono font-semibold text-[#e5e7eb]">{r.parent_repair_number}</span>
                                </span>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-[#e5e7eb]">{problem}</p>
                          <p className="mt-2 text-xs text-[#9ca3af]">
                            {r.client_name}
                            {" · "}
                            Zgłosił: <span className="text-[#e5e7eb]">{r.created_by_label ?? "—"}</span>
                            {" · "}
                            {when}
                            {" · "}
                            Przypisany: <span className="text-[#e5e7eb]">{formatAssignedTo(r)}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${complaintStatusBadgeClass(
                          bucket,
                        )}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </main>
  );
}
