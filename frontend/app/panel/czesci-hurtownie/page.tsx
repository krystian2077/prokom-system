"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { InventoryPartCard, InventoryPartListItem, InventorySupplier } from "@/types/inventory";

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type TabKey = "parts" | "suppliers";

export default function PartsSuppliersPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState<TabKey>("parts");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [ordering, setOrdering] = useState<string>("name");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const [parts, setParts] = useState<InventoryPartListItem[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);

  const PAGE_SIZE = 25;

  const PAGE_TITLE = tab === "parts" ? "Części" : "Hurtownie";

  const orderingOptionsParts = useMemo(
    () => [
      { value: "name", label: "Nazwa" },
      { value: "-sell_price", label: "Cena sprzedaży (malejąco)" },
      { value: "sell_price", label: "Cena sprzedaży (rosnąco)" },
      { value: "-quantity_in_stock", label: "Stan magazynu (malejąco)" },
    ],
    [],
  );

  const orderingOptionsSuppliers = useMemo(
    () => [
      { value: "name", label: "Nazwa" },
      { value: "-created_at", label: "Najnowsze" },
      { value: "created_at", label: "Najstarsze" },
    ],
    [],
  );

  const resetAndReload = () => {
    setPage(1);
    void load();
  };

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const qs: string[] = [];
      qs.push(`page=${page}`);
      qs.push(`page_size=${PAGE_SIZE}`);
      if (search.trim()) qs.push(`search=${encodeURIComponent(search.trim())}`);
      if (onlyActive) qs.push(`is_active=true`);
      if (ordering) qs.push(`ordering=${encodeURIComponent(ordering)}`);

      if (tab === "parts") {
        const res = await api.get<PaginatedResponse<InventoryPartListItem>>(
          `/inventory/parts/?${qs.join("&")}`,
          token,
        );
        setParts(res.results);
        setCount(res.count);
        setNext(res.next);
        setPrevious(res.previous);
      } else {
        const res = await api.get<PaginatedResponse<InventorySupplier>>(
          `/inventory/suppliers/?${qs.join("&")}`,
          token,
        );
        setSuppliers(res.results);
        setCount(res.count);
        setNext(res.next);
        setPrevious(res.previous);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać danych.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, onlyActive, ordering, token]);

  useEffect(() => {
    // reset ordering when switching tabs (UX)
    if (tab === "parts") setOrdering("name");
    if (tab === "suppliers") setOrdering("name");
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Part card modal
  const [cardOpen, setCardOpen] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [card, setCard] = useState<InventoryPartCard | null>(null);

  const openCard = async (partId: string) => {
    if (!token) return;
    setCardOpen(true);
    setCardLoading(true);
    setCardError(null);
    setCard(null);

    try {
      const res = await api.get<InventoryPartCard>(`/inventory/parts/${partId}/card/`, token);
      setCard(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać karty części.";
      setCardError(msg);
    } finally {
      setCardLoading(false);
    }
  };

  const formatMoney = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === "") return "–";
    const n = typeof v === "string" ? Number(v) : v;
    if (!Number.isFinite(n)) return String(v);
    return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
  };

  const closeCard = () => {
    setCardOpen(false);
    setCardLoading(false);
    setCardError(null);
    setCard(null);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
          {isAdmin ? "Panel Admina" : "Panel pracownika"} · Moduł
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Części i hurtownie</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">Katalog części + lista hurtowni oraz podgląd karty części.</p>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("parts")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                tab === "parts"
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              Części
            </button>
            <button
              type="button"
              onClick={() => setTab("suppliers")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                tab === "suppliers"
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
              }`}
            >
              Hurtownie
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full md:w-[420px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") resetAndReload();
                }}
                placeholder={tab === "parts" ? "Szukaj: nazwa, kod, typ… (Enter)" : "Szukaj: nazwa, NIP, e-mail… (Enter)"}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#6b7280]"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e5e7eb]">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4" />
              Tylko aktywne
            </label>

            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {(tab === "parts" ? orderingOptionsParts : orderingOptionsSuppliers).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="rounded-3xl border border-white/10 bg-[#0c0d12] p-6 text-sm text-[#9ca3af]">Ładowanie…</div>}
      {error && <p className="mt-3 text-sm text-[#fca5a5]">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#9ca3af]">
              {PAGE_TITLE}: <span className="text-white font-semibold">{count}</span>
            </p>
            <div className="text-sm text-[#9ca3af]">
              Strona {page} / {Math.max(1, Math.ceil(count / PAGE_SIZE))}
            </div>
          </div>

          {tab === "parts" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {parts.map((p) => {
                const stock = typeof p.quantity_in_stock === "string" ? Number(p.quantity_in_stock) : p.quantity_in_stock;
                const minQ = typeof p.min_quantity === "string" ? Number(p.min_quantity) : p.min_quantity;
                const isLow = Number.isFinite(stock as number) && Number.isFinite(minQ as number) && (stock as number) <= (minQ as number);
                return (
                  <div key={p.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Część</p>
                        <p className="mt-1 truncate text-lg font-semibold text-white">{p.name}</p>
                        <p className="mt-1 text-sm text-[#9ca3af]">
                          Kod: <span className="text-white font-semibold">{p.code}</span>
                        </p>
                        <p className="mt-2 text-sm text-[#9ca3af]">
                          {p.device_category_display ?? p.device_category ?? "—"} · {p.brand ?? "—"}
                        </p>
                        <p className="mt-1 text-sm text-[#9ca3af]">
                          Typ: {p.part_type ?? "—"} · Wariant: {p.quality_variant ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Stan</p>
                        <p className={`mt-1 text-sm font-semibold ${isLow ? "text-[#ffb4b4]" : "text-white"}`}>
                          {p.quantity_in_stock ?? "–"} {p.unit ?? ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#9ca3af]">Cena sprzedaży</p>
                        <p className="mt-1 text-sm text-white">{formatMoney(p.sell_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af]">Dostawca</p>
                        <p className="mt-1 text-sm text-white">{p.supplier_name ?? "—"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <Link href="/panel/repairs" className="text-sm text-[#9ca3af] hover:text-white">
                        Przejdź do napraw
                      </Link>
                      <button
                        type="button"
                        onClick={() => openCard(p.id)}
                        className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
                      >
                        Karta
                      </button>
                    </div>
                  </div>
                );
              })}
              {parts.length === 0 && <p className="text-sm text-[#6b7280]">Brak części w wynikach.</p>}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {suppliers.map((s) => (
                <div key={s.id} className="rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Hurtownia</p>
                  <p className="mt-1 text-lg font-semibold text-white">{s.name}</p>
                  <p className="mt-2 text-sm text-[#9ca3af]">
                    NIP: <span className="text-white font-semibold">{s.nip ?? "—"}</span>
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-[#9ca3af]">
                    {s.email ? (
                      <p>
                        E-mail: <span className="text-white font-semibold">{s.email}</span>
                      </p>
                    ) : null}
                    {s.phone ? (
                      <p>
                        Tel: <span className="text-white font-semibold">{s.phone}</span>
                      </p>
                    ) : null}
                    {s.website_url ? (
                      <p>
                        Strona: <span className="text-white font-semibold">{s.website_url}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 text-sm text-[#9ca3af]">
                    Status: <span className="text-white font-semibold">{s.is_active ? "Aktywna" : "Nieaktywna"}</span>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && <p className="text-sm text-[#6b7280]">Brak hurtowni w wynikach.</p>}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-[#0c0d12] p-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!previous || page <= 1}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Poprzednia
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!next}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Następna
            </button>
          </div>
        </>
      )}

      {cardOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d12] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Karta części</p>
                <p className="mt-1 text-lg font-semibold text-white">{card?.part?.name ?? "—"}</p>
              </div>
              <button
                type="button"
                onClick={closeCard}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <div className="p-4">
              {cardLoading && <p className="text-sm text-[#9ca3af]">Ładowanie karty…</p>}
              {cardError && <p className="text-sm text-[#fca5a5]">{cardError}</p>}

              {!cardLoading && !cardError && card && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Skrót</p>
                      <p className="mt-2 text-sm text-[#e5e7eb]">
                        Kod: <span className="text-white font-semibold">{card.part.code}</span>
                      </p>
                      <p className="mt-1 text-sm text-[#e5e7eb]">
                        Kategoria: <span className="text-white font-semibold">{card.part.device_category_display ?? card.part.device_category ?? "—"}</span>
                      </p>
                      <p className="mt-1 text-sm text-[#e5e7eb]">
                        Dostawca (częsty): <span className="text-white font-semibold">{card.most_used_supplier?.name ?? "—"}</span>
                      </p>
                      <p className="mt-1 text-sm text-[#e5e7eb]">
                        Użycia: <span className="text-white font-semibold">{card.usage_count}</span>
                      </p>
                      {card.last_used_at ? (
                        <p className="mt-1 text-sm text-[#e5e7eb]">
                          Ostatnie użycie:{" "}
                          <span className="text-white font-semibold">{new Date(card.last_used_at).toLocaleString("pl-PL")}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[#e5e7eb]">Ostatnie użycie: –</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Ceny w historii</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#9ca3af]">Ostatnia cena</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatMoney(card.last_purchase_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9ca3af]">Średnia</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatMoney(card.avg_purchase_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9ca3af]">Min</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatMoney(card.min_purchase_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9ca3af]">Max</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatMoney(card.max_purchase_cost)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Ostatnie naprawy (z użyciem)</p>
                    {card.recent_repairs.length === 0 ? (
                      <p className="mt-2 text-sm text-[#6b7280]">Brak historii użycia.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {card.recent_repairs.map((r) => (
                          <div key={r.usage_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0c10] p-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                <Link href={`/panel/repairs/${r.repair_id}`}>{r.repair_number ?? r.repair_id}</Link>
                              </p>
                              <p className="mt-1 text-xs text-[#9ca3af]">
                                {new Date(r.created_at).toLocaleString("pl-PL")} · Status: {r.usage_status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#9ca3af]">Koszt</p>
                              <p className="mt-1 text-sm font-semibold text-white">{formatMoney(r.purchase_cost)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

