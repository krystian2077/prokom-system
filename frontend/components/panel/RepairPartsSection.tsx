"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, fetchAllPages } from "@/lib/api";
import type { InventorySupplier } from "@/types/inventory";
import { PanelDatePicker } from "@/components/panel/PanelDatePicker";
import { Select } from "@/components/ui/Select";
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
  const o = orderStatusEffective(u);
  if (step.body.order_status === "to_order") return o === "to_order";
  if (step.body.order_status === "ordered") return o === "ordered" || o === "delayed";
  if (step.body.order_status === "arrived") {
    return o === "arrived" || u.usage_status === "arrived" || u.usage_status === "used" || u.usage_status === "unused";
  }
  return false;
}

function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "–";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

function parseIsoTimestamp(value?: string | null): number {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function supplierWebsiteHref(url: string | null | undefined): string | null {
  const t = (url ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
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
  const queryClient = useQueryClient();
  const [usages, setUsages] = useState<PartUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [usagesError, setUsagesError] = useState<string | null>(null);

  const [partName, setPartName] = useState("");

  // Form state
  const [quantity, setQuantity] = useState<string>("1");
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
      await refreshPartsDashboardPreview();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować statusu części.";
      setUsagesError(msg);
    } finally {
      setPatchingId(null);
    }
  };

  const resetForm = () => {
    setQuantity("1");
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

  const selectedSupplier = useMemo(
    () =>
      supplierId ? suppliers.find((s) => String(s.id) === String(supplierId)) ?? null : null,
    [suppliers, supplierId],
  );
  const sortedUsages = useMemo(
    () => [...usages].sort((a, b) => parseIsoTimestamp(b.created_at) - parseIsoTimestamp(a.created_at)),
    [usages],
  );
  const newestUsageId = sortedUsages[0]?.id ?? null;
  const supplierLinkHref = selectedSupplier ? supplierWebsiteHref(selectedSupplier.website_url) : null;

  const refreshPartsDashboardPreview = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard", "parts-status"] });
  };

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
    const unit = Number(purchaseCost.trim());

    if (!Number.isFinite(q) || q <= 0) {
      setFormError("Ilość musi być liczbą większą od 0.");
      return;
    }
    if (!Number.isFinite(unit) || unit <= 0) {
      setFormError("Cena zakupu (jedn.) musi być liczbą większą od 0.");
      return;
    }

    setSubmitting(true);
    try {
      const { usage_status, order_status } = formPipelineToStatuses(formPipeline);
      const payload: Record<string, unknown> = {
        custom_part_name: name,
        supplier: supplierId,
        quantity: q,
        purchase_cost: unit,
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
      await refreshPartsDashboardPreview();
      resetForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać użycia części.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="order-2 flex justify-end">
        <button
          type="button"
          onClick={() => resetForm()}
          className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-xs font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
        >
          Wyczyść formularz
        </button>
      </div>

      <div className="order-3 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Dodaj pozycję części</div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
              Nazwa części
            </label>
            <input
              value={partName}
              onChange={(ev) => setPartName(ev.target.value)}
              placeholder="Np. LCD A56 ORG"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
              autoComplete="off"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
              Hurtownia
            </label>
            <Select
              value={supplierId ?? ""}
              solidMenu
              placeholder="— wybierz hurtownię —"
              options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
              onChange={(e) => setSupplierId(e.target.value || null)}
              className="w-full"
            />
            {supplierLinkHref ? (
              <a
                href={supplierLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3b82f6] transition hover:text-[#60a5fa] hover:underline"
              >
                Strona hurtowni
                <ExternalLink size={14} className="opacity-90" aria-hidden />
              </a>
            ) : selectedSupplier ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Brak zapisanego linku do strony — uzupełnij pole „link do hurtowni” przy edycji dostawcy.
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Ilość</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
              Cena zakupu (jedn.)
            </label>
            <input
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
              Kiedy ma dotrzeć (plan)
            </label>
            <PanelDatePicker value={expectedArrivalDate} onChange={setExpectedArrivalDate} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">
              Status części
            </label>
            <Select
              value={formPipeline}
              solidMenu
              options={[
                { value: "to_order", label: "Do zamówienia" },
                { value: "in_transit", label: "W drodze" },
                { value: "arrived", label: "Dotarła" },
              ]}
              onChange={(e) => setFormPipeline(e.target.value as FormPipelineKey)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Notatka</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Np. doprecyzowanie zamówienia…"
              className="min-h-[72px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--white)] placeholder:text-[var(--muted)]"
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

      <div className="order-1 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Użycia części</h4>
          {loadingUsages && <span className="text-xs text-[var(--ink2)]">Ładowanie…</span>}
        </div>

        {usagesError && <p className="mt-3 text-sm text-[#fca5a5]">{usagesError}</p>}
        {!usagesError && !loadingUsages && sortedUsages.length === 0 && (
          <p className="mt-3 text-sm text-[var(--muted)]">Brak użyć części w tej naprawie.</p>
        )}

        <div className="mt-4 space-y-3">
          {sortedUsages.map((u) => {
            const isNewest = u.id === newestUsageId;
            return (
            <div
              key={u.id}
              className={`rounded-2xl border p-4 transition ${
                isNewest
                  ? "border-[#3b82f6]/45 bg-gradient-to-br from-[#3b82f6]/14 to-transparent shadow-[0_14px_26px_-18px_rgba(59,130,246,0.65)]"
                  : "border-[var(--border)] bg-[var(--row-hover)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="min-w-[220px]">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {isNewest ? (
                      <span className="rounded-full border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93c5fd]">
                        Nowo dodana
                      </span>
                    ) : null}
                    {u.part?.code ? <span className="text-xs text-[var(--ink2)]">Kod: {u.part.code}</span> : null}
                  </div>
                  <p className="text-lg font-semibold leading-tight text-[var(--white)]">{partUsageDisplayName(u)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink2)]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--white)]">{u.usage_status_display}</p>
                  {u.order_status_display ? (
                    <p className="mt-0.5 text-xs text-[var(--ink2)]">Zamówienie: {u.order_status_display}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Ilość</p>
                  <p className="mt-1 text-base font-semibold text-[var(--white)]">{u.quantity}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Hurtownia</p>
                  <p className="mt-1 text-sm font-medium text-[var(--white)]">{u.supplier_detail?.name ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Planowana dostawa</p>
                  <div className="mt-1">
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
              </div>

              {(u.usage_status === "ordered" || u.usage_status === "arrived" || u.usage_status === "used" || u.usage_status === "unused") && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Etap zamówienia</p>
                  <p className="mb-2 text-xs text-[var(--ink2)]">Możesz poprawić etap dostawy, jeśli kliknięto status przez pomyłkę.</p>
                  <div className="flex flex-wrap gap-2">
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
                            ? "border-[#3b82f6]/50 bg-[#3b82f6]/20 text-[var(--white)]"
                            : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                        } disabled:opacity-50`}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}

              {(u.usage_status === "arrived" || u.usage_status === "used" || u.usage_status === "unused") && (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/15 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Po dostawie</p>
                  <div className="flex flex-wrap gap-2">
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
                          : "border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)]"
                      } disabled:opacity-50`}
                    >
                      {label}
                    </button>
                  ))}
                  </div>
                </div>
              )}

              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Podsumowanie kosztów</p>
                <div>
                <div>
                  <p className="text-xs text-[var(--ink2)]">Koszt zakupu części</p>
                  <p className="text-sm font-medium text-[var(--white)]">{u.purchase_cost ? formatMoney(u.purchase_cost) : "–"}</p>
                </div>
                </div>
              </div>

              {u.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-[#e5e7eb]">Notatka: {u.notes}</p> : null}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

