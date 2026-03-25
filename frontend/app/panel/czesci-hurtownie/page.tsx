"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { InventorySupplier } from "@/types/inventory";
import type { PartUsage } from "@/types/repairs";
import type { RepairRequestListItem } from "@/types/repairs";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type PartsFilter = "all" | "in_transit" | "arrived" | "used";

type PartRow = {
  id: string;
  repairId: string;
  repairNumber: string;
  deviceName: string;
  partName: string;
  supplierName: string;
  createdAt: string;
  status: "ordered" | "in_transit" | "arrived" | "used" | "unused";
  statusDisplay: string;
};

const FILTERS: Array<{ value: PartsFilter; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "in_transit", label: "W drodze" },
  { value: "arrived", label: "Dotarły — zamontuj!" },
  { value: "used", label: "Użyte" },
];

const SUPPLIER_FALLBACK = [
  { name: "Dostawca A - GSM Parts PL", website_url: "https://gsm-parts.pl", leadDays: 1 },
  { name: "Dostawca B - MobileHub", website_url: "https://mobilehub.example", leadDays: 2 },
  { name: "Dostawca C - iTech Supply", website_url: "https://itech-supply.example", leadDays: 3 },
];

export default function PartsSuppliersPage() {
  const { token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PartRow[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);

  const statusFilter = useMemo<PartsFilter>(() => {
    const raw = searchParams.get("status");
    if (raw === "in_transit" || raw === "arrived" || raw === "used") return raw;
    return "all";
  }, [searchParams]);

  const setFilter = (next: PartsFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const repairs = await api.get<RepairRequestListItem[]>(`/staff/repairs/?assigned_to=me&ordering=-created_at`, token);
        const partLists = await Promise.all(
          repairs.map(async (repair) => {
            try {
              const usages = await api.get<PartUsage[]>(`/staff/repairs/${repair.id}/parts/`, token);
              return usages.map((usage) => ({
                id: usage.id,
                repairId: repair.id,
                repairNumber: repair.repair_number,
                deviceName: repair.device_name,
                partName: usage.part?.name ?? "Część",
                supplierName: usage.supplier_detail?.name ?? usage.part?.supplier_name ?? "Brak dostawcy",
                createdAt: usage.created_at,
                status: usage.usage_status,
                statusDisplay: usage.usage_status_display,
              }));
            } catch {
              return [];
            }
          }),
        );
        setRows(partLists.flat());

        const suppliersRes = await api.get<PaginatedResponse<InventorySupplier> | InventorySupplier[]>(
          `/inventory/suppliers/?is_active=true&ordering=name&page_size=3`,
          token,
        );
        const supplierRows = Array.isArray(suppliersRes) ? suppliersRes : suppliersRes.results;
        setSuppliers(supplierRows.slice(0, 3));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się pobrać części.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const statusBadge = (row: PartRow) => {
    if (row.status === "arrived") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--gb)] bg-[var(--gl)] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--green)]">
            Dotarła ✓
          </span>
          <span className="rounded-full border border-[var(--gb)] bg-[var(--gl)] px-3 py-1 text-xs font-extrabold text-[var(--green)] animate-glow-g">
            Zamontuj!
          </span>
        </div>
      );
    }
    if (row.status === "in_transit") {
      return <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-200">W drodze</span>;
    }
    if (row.status === "used") {
      return <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-[#d1d5db]">Użyta</span>;
    }
    if (row.status === "ordered") {
      return <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">Zamówiona</span>;
    }
    return <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-[#d1d5db]">{row.statusDisplay}</span>;
  };

  const supplierCards = useMemo(() => {
    if (suppliers.length > 0) {
      return suppliers.map((s, idx) => ({
        name: s.name,
        website_url: s.website_url ?? "",
        leadDays: idx + 1,
      }));
    }
    return SUPPLIER_FALLBACK;
  }, [suppliers]);

  const formatDate = (value: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pl-PL");
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Magazyn</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Moje części</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Części przypisanych napraw</p>
      </div>

      <div className="mb-6 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const active = filter.value === statusFilter;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilter(filter.value)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div> : null}
      {error ? <p className="mb-6 text-sm text-[#fca5a5]">{error}</p> : null}

      {!loading && !error ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Aktywne części</h2>
            <span className="text-sm text-[#9ca3af]">
              Wyniki: <span className="font-semibold text-white">{filteredRows.length}</span>
            </span>
          </div>
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-[280px] items-start gap-3">
                    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--s3)] text-sm text-white">🔧</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{row.partName}</p>
                      <p className="mt-1 text-xs text-[#9ca3af]">
                        {row.repairNumber} · {row.deviceName}
                      </p>
                      <p className="mt-1 text-xs text-[#9ca3af]">
                        {row.supplierName} · {formatDate(row.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {statusBadge(row)}
                    <Link href={`/panel/naprawy/${row.repairId}`} className="text-xs font-semibold text-[#9ca3af] hover:text-white">
                      Otwórz naprawę
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-6 text-sm text-[#6b7280]">Brak części dla wybranego filtra.</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Hurtownie</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {supplierCards.map((s) => (
            <article key={s.name} className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
              <p className="text-sm font-semibold text-white">{s.name}</p>
              <p className="mt-2 truncate text-xs text-[#9ca3af]">{s.website_url || "Brak URL"}</p>
              <p className="mt-3 text-xs font-semibold text-[#e5e7eb]">Czas dostawy: {s.leadDays} dni</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

