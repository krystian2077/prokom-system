"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { PartAutocompleteItem, PartUsage, PartUsageStatusValue } from "@/types/repairs";

const USAGE_STATUS_OPTIONS: Array<{ value: PartUsageStatusValue; label: string }> = [
  { value: "ordered", label: "Zamówiona" },
  { value: "arrived", label: "Dotarła" },
  { value: "used", label: "Użyta w naprawie" },
  { value: "unused", label: "Niewykorzystana" },
];

function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "–";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

export function RepairPartsSection({
  repairId,
  token,
  onAfterMutation,
}: {
  repairId: string;
  token: string | null;
  onAfterMutation?: () => Promise<void> | void;
}) {
  const [usages, setUsages] = useState<PartUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [usagesError, setUsagesError] = useState<string | null>(null);

  // Autocomplete
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PartAutocompleteItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartAutocompleteItem | null>(null);

  // Form state
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPriceUsed, setUnitPriceUsed] = useState<string>("");
  const [purchaseCost, setPurchaseCost] = useState<string>("");
  const [usageStatus, setUsageStatus] = useState<PartUsageStatusValue>("ordered");
  const [notes, setNotes] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedSupplierName = useMemo(() => {
    if (!selectedPart) return null;
    return selectedPart.supplier_name ?? null;
  }, [selectedPart]);

  const loadUsages = async () => {
    if (!token) return;
    setUsagesError(null);
    setLoadingUsages(true);
    try {
      const res = await api.get<PartUsage[]>(`/repairs/${repairId}/parts/`, token);
      setUsages(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się pobrać części.";
      setUsagesError(msg);
    } finally {
      setLoadingUsages(false);
    }
  };

  const resetForm = () => {
    setQuantity("1");
    setUnitPriceUsed("");
    setPurchaseCost("");
    setUsageStatus("ordered");
    setNotes("");
    setSupplierId(null);
    setSelectedPart(null);
    setQuery("");
    setSuggestions([]);
    setFormError(null);
  };

  useEffect(() => {
    void loadUsages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, repairId]);

  useEffect(() => {
    if (!token) return;
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSuggestionsError(null);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        setSuggestionsError(null);
        setLoadingSuggestions(true);
        const url = `/inventory/parts/autocomplete/?q=${encodeURIComponent(query.trim())}&repair_id=${encodeURIComponent(repairId)}&limit=8`;
        const res = await api.get<PartAutocompleteItem[]>(url, token);
        if (!cancelled) setSuggestions(res);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Błąd podpowiedzi części.";
        setSuggestionsError(msg);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, token, repairId]);

  // Prefill supplier + unit price on selection
  useEffect(() => {
    if (!selectedPart) return;
    setSupplierId(selectedPart.supplier ?? null);
    if (selectedPart.sell_price !== null && selectedPart.sell_price !== undefined) {
      const sp = typeof selectedPart.sell_price === "number" ? String(selectedPart.sell_price) : selectedPart.sell_price;
      setUnitPriceUsed(sp);
    }
  }, [selectedPart]);

  const handleSelectSuggestion = (p: PartAutocompleteItem) => {
    setSelectedPart(p);
    setQuery(`${p.name}${p.code ? ` (${p.code})` : ""}`);
    setSuggestions([]);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!token) return;

    if (!selectedPart?.id) {
      setFormError("Wybierz część z listy.");
      return;
    }

    const q = Number(quantity);
    const unit = Number(unitPriceUsed);
    const cost = purchaseCost.trim() === "" ? null : Number(purchaseCost);

    if (!Number.isFinite(q) || q <= 0) {
      setFormError("Ilość musi być liczbą większą od 0.");
      return;
    }
    if (!Number.isFinite(unit) || unit <= 0) {
      setFormError("Cena jednostkowa musi być liczbą większą od 0.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        part: selectedPart.id,
        supplier: supplierId,
        quantity: q,
        purchase_cost: cost,
        unit_price_used: unit,
        usage_status: usageStatus,
        notes: notes.trim() === "" ? "" : notes.trim(),
      };

      await api.post(`/repairs/${repairId}/parts/`, payload, token);

      await loadUsages();
      if (onAfterMutation) await onAfterMutation();
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać użycia części.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Części w naprawie</h3>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Lista użyć części oraz kosztów (zakup i cena zastosowana).
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetForm()}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
        >
          Wyczyść formularz
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Użycia części</h4>
          {loadingUsages && <span className="text-xs text-[#9ca3af]">Ładowanie…</span>}
        </div>

        {usagesError && <p className="mt-3 text-sm text-[#fca5a5]">{usagesError}</p>}
        {!usagesError && !loadingUsages && usages.length === 0 && (
          <p className="mt-3 text-sm text-[#6b7280]">Brak użyć części w tej naprawie.</p>
        )}

        <div className="mt-4 space-y-3">
          {usages.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[220px]">
                  <p className="text-sm font-semibold text-white">
                    {u.part?.name ?? "Część"} {u.part?.code ? <span className="text-[#9ca3af]">({u.part.code})</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">Ilość: {u.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">{u.usage_status_display}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <p className="text-xs text-[#9ca3af]">Cena zastosowana</p>
                  <p className="text-sm text-white">
                    {formatMoney(u.unit_price_used)} {u.part?.unit ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Koszt zakupu (opcjonalnie)</p>
                  <p className="text-sm text-white">{u.purchase_cost ? formatMoney(u.purchase_cost) : "–"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af]">Suma</p>
                  <p className="text-sm font-semibold text-white">{formatMoney(u.total)}</p>
                </div>
              </div>

              {u.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-[#e5e7eb]">Notatka: {u.notes}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Dodaj użycie części</h4>
          <span className="text-xs text-[#9ca3af]">
            {selectedSupplierName ? `Hurtownia: ${selectedSupplierName}` : "Opcjonalna hurtownia"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2" ref={dropdownRef}>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Część (autouzupełnianie)
            </label>
            <input
              value={query}
              onChange={(ev) => {
                setQuery(ev.target.value);
                setSelectedPart(null);
              }}
              placeholder="Szukaj: nazwa, kod, model…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
              autoComplete="off"
            />

            {loadingSuggestions && (
              <p className="mt-2 text-xs text-[#9ca3af]">Szukam części…</p>
            )}
            {suggestionsError && (
              <p className="mt-2 text-xs text-[#fca5a5]">{suggestionsError}</p>
            )}

            {suggestions.length > 0 && (
              <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/10 bg-[#0c0d12] p-1">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#e5e7eb] transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {s.name}
                        {s.code ? <span className="text-[#9ca3af]"> ({s.code})</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-[#9ca3af]">{s.supplier_name ?? "—"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Ilość
            </label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Cena jedn. zastosowana
            </label>
            <input
              value={unitPriceUsed}
              onChange={(e) => setUnitPriceUsed(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Koszt zakupu (opcjonalnie)
            </label>
            <input
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Status części w naprawie
            </label>
            <select
              value={usageStatus}
              onChange={(e) => setUsageStatus(e.target.value as PartUsageStatusValue)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {USAGE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Notatka
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Np. doprecyzowanie zamówienia, uwagi do rozliczenia…"
              className="min-h-[84px] w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
            />
          </div>

          {formError && (
            <div className="md:col-span-2">
              <p className="text-sm text-[#fca5a5]">{formError}</p>
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#dc1e1e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b61717] disabled:opacity-60"
            >
              {submitting ? "Dodaję…" : "Dodaj użycie części"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

