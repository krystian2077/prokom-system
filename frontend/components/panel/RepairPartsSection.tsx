"use client";

import { useEffect, useState } from "react";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier } from "@/types/inventory";
import { PanelDatePicker } from "@/components/panel/PanelDatePicker";
import { partUsageDisplayName, type PartOrderStatusValue, type PartUsage, type PartUsageStatusValue } from "@/types/repairs";

/** Kolejka zamówienia (spójna z dashboardem „Status części”). */
const PIPELINE_STEPS: Array<{
  label: string;
  body: { usage_status: PartUsageStatusValue; order_status?: PartOrderStatusValue };
}> = [
  { label: "Do zamówienia", body: { usage_status: "ordered", order_status: "to_order" } },
  { label: "W drodze", body: { usage_status: "ordered", order_status: "ordered" } },
  { label: "Dotarło", body: { usage_status: "arrived", order_status: "arrived" } },
];

function orderStatusEffective(u: PartUsage): PartOrderStatusValue {
  return u.order_status ?? "to_order";
}

/** Stan formularza dodawania — zsynchronizowany z kubełkami dashboardu „Status części”. */
type FormPipelineKey = "to_order" | "in_transit" | "arrived";

function formPipelineToStatuses(key: FormPipelineKey): {
  usage_status: PartUsageStatusValue;
  order_status: PartOrderStatusValue;
} {
  switch (key) {
    case "to_order":
      return { usage_status: "ordered", order_status: "to_order" };
    case "in_transit":
      return { usage_status: "ordered", order_status: "ordered" };
    case "arrived":
      return { usage_status: "arrived", order_status: "arrived" };
    default:
      return { usage_status: "ordered", order_status: "to_order" };
  }
}

function pipelineStepActive(u: PartUsage, step: (typeof PIPELINE_STEPS)[number]): boolean {
  if (step.body.usage_status === "arrived") {
    return u.usage_status === "arrived";
  }
  if (u.usage_status !== "ordered") return false;
  const o = orderStatusEffective(u);
  if (step.body.order_status === "to_order") return o === "to_order";
  if (step.body.order_status === "ordered") return o === "ordered" || o === "delayed";
  return false;
}

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

  const [partName, setPartName] = useState("");

  // Form state
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPriceUsed, setUnitPriceUsed] = useState<string>("");
  const [purchaseCost, setPurchaseCost] = useState<string>("");
  const [formPipeline, setFormPipeline] = useState<FormPipelineKey>("to_order");
  const [notes, setNotes] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [expectedArrivalDate, setExpectedArrivalDate] = useState("");
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patchingId, setPatchingId] = useState<string | null>(null);

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

  const patchUsage = async (usageId: string, body: Record<string, string | null>) => {
    if (!token) return;
    setPatchingId(usageId);
    try {
      await api.patch(`/repairs/${repairId}/parts/${usageId}/`, body, token);
      await loadUsages();
      if (onAfterMutation) await onAfterMutation();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować statusu części.";
      setUsagesError(msg);
    } finally {
      setPatchingId(null);
    }
  };

  const resetForm = () => {
    setQuantity("1");
    setUnitPriceUsed("");
    setPurchaseCost("");
    setFormPipeline("to_order");
    setExpectedArrivalDate("");
    setNotes("");
    setSupplierId(null);
    setPartName("");
    setFormError(null);
  };

  useEffect(() => {
    void loadUsages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, repairId]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchAllPages<InventorySupplier>(
          `/inventory/suppliers/?is_active=true&ordering=name&page_size=200`,
          token,
        );
        if (!cancelled) setSuppliers(list);
      } catch {
        if (!cancelled) setSuppliers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!token) return;

    const name = partName.trim();
    if (!name) {
      setFormError("Podaj nazwę części.");
      return;
    }

    const q = Number(quantity);
    const unit = Number(unitPriceUsed.trim());
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
      const { usage_status, order_status } = formPipelineToStatuses(formPipeline);
      const payload: Record<string, unknown> = {
        custom_part_name: name,
        supplier: supplierId,
        quantity: q,
        purchase_cost: cost,
        unit_price_used: unit,
        usage_status,
        order_status,
        notes: notes.trim() === "" ? "" : notes.trim(),
      };
      if (expectedArrivalDate.trim()) {
        payload.expected_arrival_date = expectedArrivalDate.trim();
      }

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Części w naprawie</h3>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Zamawianie części, lista pozycji i rozliczenie (zakup i cena dla klienta).
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">Zamawianie części</h4>
            <p className="mt-1 text-xs text-[#6b7280]">
              Statusy zgodne z kartą „Status części” na dashboardzie (do zamówienia / w drodze / dotarła).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Nazwa części
            </label>
            <input
              value={partName}
              onChange={(ev) => setPartName(ev.target.value)}
              placeholder="Np. LCD A56 ORG"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
              autoComplete="off"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Hurtownia
            </label>
            <select
              value={supplierId ?? ""}
              onChange={(e) => setSupplierId(e.target.value || null)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="">— wybierz hurtownię —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Ilość</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Cena zakupu (części)
            </label>
            <input
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              inputMode="decimal"
              placeholder="Opcjonalnie"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Cena jedn. dla klienta
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
              Kiedy ma dotrzeć (plan)
            </label>
            <PanelDatePicker value={expectedArrivalDate} onChange={setExpectedArrivalDate} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
              Status części
            </label>
            <select
              value={formPipeline}
              onChange={(e) => setFormPipeline(e.target.value as FormPipelineKey)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="to_order">Do zamówienia</option>
              <option value="in_transit">W drodze</option>
              <option value="arrived">Dotarła</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Notatka</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Np. doprecyzowanie zamówienia…"
              className="min-h-[72px] w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#6b7280]"
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
              {submitting ? "Zapisuję…" : "Dodaj pozycję"}
            </button>
          </div>
        </form>
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
                    {partUsageDisplayName(u)}{" "}
                    {u.part?.code ? <span className="text-[#9ca3af]">({u.part.code})</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">Ilość: {u.quantity}</p>
                  {u.supplier_detail?.name ? (
                    <p className="mt-1 text-xs text-[#9ca3af]">Hurtownia: {u.supplier_detail.name}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-[#6b7280]">Planowana dostawa</span>
                    <PanelDatePicker
                      compact
                      value={u.expected_arrival_date?.slice(0, 10) ?? ""}
                      onChange={(v) => {
                        void patchUsage(u.id, { expected_arrival_date: v || null });
                      }}
                      disabled={patchingId === u.id}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">{u.usage_status_display}</p>
                  {u.order_status_display ? (
                    <p className="mt-0.5 text-xs text-[#9ca3af]">Zamówienie: {u.order_status_display}</p>
                  ) : null}
                </div>
              </div>

              {(u.usage_status === "ordered" || u.usage_status === "arrived") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {PIPELINE_STEPS.map((step) => {
                    const active = pipelineStepActive(u, step);
                    const disabled = patchingId === u.id;
                    return (
                      <button
                        key={step.label}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setUsagesError(null);
                          const payload: Record<string, string | null> = {
                            usage_status: step.body.usage_status,
                          };
                          if (step.body.order_status) payload.order_status = step.body.order_status;
                          void patchUsage(u.id, payload);
                        }}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-[#3b82f6]/50 bg-[#3b82f6]/20 text-white"
                            : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                        } disabled:opacity-50`}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {(u.usage_status === "arrived" || u.usage_status === "used" || u.usage_status === "unused") && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="mr-1 self-center text-[11px] text-[#6b7280]">Po dostawie:</span>
                  {(
                    [
                      { label: "Użyta", v: "used" as const },
                      { label: "Niewykorzystana", v: "unused" as const },
                    ] as const
                  ).map(({ label, v }) => (
                    <button
                      key={v}
                      type="button"
                      disabled={patchingId === u.id}
                      onClick={() => {
                        setUsagesError(null);
                        void patchUsage(u.id, { usage_status: v });
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        u.usage_status === v
                          ? "border-emerald-500/40 bg-emerald-500/15 text-[#a7f3d0]"
                          : "border-white/10 bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

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
    </div>
  );
}

