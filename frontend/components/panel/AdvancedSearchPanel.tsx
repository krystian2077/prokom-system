"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import type { AdvancedSearchResponse, GlobalSearchClient, GlobalSearchDevice, GlobalSearchRepair } from "@/types/search";

type RepairStatusValue =
  | "new"
  | "accepted"
  | "in_diagnostics"
  | "diagnostics_done"
  | "quote_pending"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  | "waiting_for_parts"
  | "in_repair"
  | "repair_done"
  | "in_testing"
  | "testing_passed"
  | "testing_failed"
  | "ready_for_pickup"
  | "picked_up"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "unrepairable"
  | "abandoned";

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "repairs", label: "Naprawy" },
  { value: "clients", label: "Klienci" },
  { value: "devices", label: "Urządzenia" },
  { value: "complaints", label: "Reklamacje" },
  { value: "warranties", label: "Gwarancje" },
];

const REPAIR_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "standard", label: "Standardowa" },
  { value: "warranty", label: "Gwarancyjna" },
  { value: "complaint", label: "Reklamacja" },
  { value: "scheduled", label: "Z umówionym terminem" },
];

const REPAIR_STATUS_OPTIONS: Array<{ value: RepairStatusValue; label: string }> = [
  { value: "new", label: "Nowe zgłoszenie" },
  { value: "accepted", label: "Przyjęte do serwisu" },
  { value: "in_diagnostics", label: "W diagnostyce" },
  { value: "diagnostics_done", label: "Diagnoza zakończona" },
  { value: "quote_pending", label: "Przygotowanie wyceny" },
  { value: "quote_sent", label: "Wycena wysłana" },
  { value: "quote_accepted", label: "Wycena zaakceptowana" },
  { value: "quote_rejected", label: "Wycena odrzucona" },
  { value: "waiting_for_parts", label: "Oczekiwanie na części" },
  { value: "in_repair", label: "W trakcie naprawy" },
  { value: "repair_done", label: "Naprawa zakończona" },
  { value: "in_testing", label: "Testowanie" },
  { value: "testing_passed", label: "Testy przeszły" },
  { value: "testing_failed", label: "Testy nie przeszły" },
  { value: "ready_for_pickup", label: "Gotowe do odbioru" },
  { value: "picked_up", label: "Odebrane" },
  { value: "shipped", label: "Wysłane" },
  { value: "delivered", label: "Dostarczone" },
  { value: "cancelled", label: "Anulowane" },
  { value: "unrepairable", label: "Nie do naprawy" },
  { value: "abandoned", label: "Porzucone przez klienta" },
];

function clientBadgeReturns(c: GlobalSearchClient) {
  return Boolean(c.badges?.includes("klient_wraca"));
}

function clientBadgeCompany(c: GlobalSearchClient) {
  return Boolean(c.badges?.includes("firma"));
}

export default function AdvancedSearchPanel() {
  const { user, token } = useAuth();
  const isStaffOrAdmin = user?.role === "staff" || user?.role === "admin";

  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("repairs"); // backend expects type=clients/repairs/devices/complaints/warranties
  const [status, setStatus] = useState<RepairStatusValue | "">("");
  const [repairType, setRepairType] = useState<string>("");
  const [clientType, setClientType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AdvancedSearchResponse | null>(null);

  const shouldIncludeStatusAndRepairType = useMemo(() => {
    return type === "repairs" || type === "complaints" || type === "warranties" || type === "all";
  }, [type]);

  const submit = async () => {
    if (!token || !user) return;
    const needle = q.trim();
    if (needle.length < 2) {
      setError("Podaj min. 2 znaki.");
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("q", needle);
      params.set("limit", "20");

      if (type) params.set("type", type);

      if (shouldIncludeStatusAndRepairType) {
        if (status) params.set("status", status);
        // dla complaints/warranties backend i tak wymusza repair_type; zostawiamy mimo wszystko dla "repairs"
        if (type === "repairs" && repairType) params.set("repair_type", repairType);
      }

      if (user.role === "staff") {
        params.set("assigned_to", String(user.id));
      }

      if (clientType && (type === "clients" || type === "all")) params.set("client_type", clientType);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const url = `/search/advanced/?${params.toString()}`;
      const res = await api.get<AdvancedSearchResponse>(url, token);
      setResults(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wykonać wyszukiwania.";
      setError(msg);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isStaffOrAdmin) return null;

  const clients = results?.clients ?? [];
  const repairs = results?.repairs ?? [];
  const devices = results?.devices ?? [];

  return (
    <section className="mx-auto mt-6 w-full max-w-[900px] rounded-3xl border border-white/10 bg-[#0b0c10]/40 p-5 text-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">Advanced Search</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Zaawansowane wyszukiwanie</h2>
          <p className="mt-1 text-sm text-[#9ca3af]">Klienci, naprawy i urządzenia z filtrami statusu/typu.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Fraza
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="np. numer naprawy, IMEI, e-mail, model…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-[#6b7280]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Typ wyników
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Status (opcjonalnie)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RepairStatusValue | "")}
              disabled={!(type === "repairs" || type === "complaints" || type === "warranties")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              <option value="">Wszystkie</option>
              {REPAIR_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Typ sprawy (opcjonalnie)
            </label>
            <select
              value={repairType}
              onChange={(e) => setRepairType(e.target.value)}
              disabled={type !== "repairs"}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              <option value="">Wszystkie</option>
              {REPAIR_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Typ klienta (opcjonalnie)
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              disabled={type !== "clients"}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              <option value="">Wszyscy</option>
              <option value="individual">Osoba prywatna</option>
              <option value="business">Firma</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Data od
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
              disabled={!(type === "repairs" || type === "complaints" || type === "warranties" || type === "all" || type === "devices" || type === "clients")}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Data do
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
              disabled={!(type === "repairs" || type === "complaints" || type === "warranties" || type === "all" || type === "devices" || type === "clients")}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {error ? <p className="text-sm text-[#fca5a5]">{error}</p> : <span />}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading}
            className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
          >
            {loading ? "Szukam…" : "Szukaj"}
          </button>
        </div>
      </div>

      {results ? (
        <div className="mt-4 space-y-4">
          {clients.length > 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                KLIENCI ({clients.length})
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {clients.map((c) => (
                  <Link
                    key={c.id}
                    href={c.last_repair_summary?.id ? `/panel/repairs/${c.last_repair_summary.id}` : "#"}
                    onClick={(ev) => {
                      if (!c.last_repair_summary?.id) ev.preventDefault();
                    }}
                    className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:bg-white/10 ${
                      c.last_repair_summary?.id ? "" : "pointer-events-none opacity-70"
                    }`}
                  >
                    <p className="truncate font-mono text-sm font-semibold text-white">{c.full_name}</p>
                    <p className="mt-1 truncate text-xs text-[#9ca3af]">{c.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {clientBadgeReturns(c) ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
                          WRACA
                        </span>
                      ) : null}
                      {clientBadgeCompany(c) ? (
                        <span className="rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-2 py-1 text-[11px] font-semibold text-[#3b82f6]">
                          FIRMA
                        </span>
                      ) : null}
                      {c.last_repair_summary?.repair_number ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#9ca3af]">
                          Ostatnia: {c.last_repair_summary.repair_number}
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#6b7280]">
                          Brak ostatniej naprawy
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {repairs.length > 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                NAPRAWY ({repairs.length})
              </p>
              <div className="mt-3 space-y-3">
                {repairs.map((r: GlobalSearchRepair) => (
                  <Link
                    key={r.id}
                    href={`/panel/repairs/${r.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:bg-white/10"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold text-white">{r.repair_number}</p>
                        <p className="mt-1 text-xs text-[#9ca3af] truncate">
                          {r.client_name ?? "—"} · {r.device_name ?? "—"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
                        {r.status_display}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {devices.length > 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                URZĄDZENIA ({devices.length})
              </p>
              <div className="mt-3 space-y-3">
                {devices.map((d: GlobalSearchDevice) => (
                  <div key={d.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="truncate font-mono text-sm font-semibold text-white">{d.device_name}</p>
                    <p className="mt-1 text-xs text-[#9ca3af] truncate">{d.client_name ?? "—"}</p>
                    <p className="mt-2 text-[11px] text-[#9ca3af]">
                      Kategoria: {d.category ?? "—"} · Napraw: {d.repair_count ?? 0}
                    </p>
                    {/* Akcje dla urządzeń w kolejnym kroku (docelowe actions) */}
                    <p className="mt-2 text-[11px] text-[#6b7280]">Brak docelowej akcji dla urządzeń w tym trybie.</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

