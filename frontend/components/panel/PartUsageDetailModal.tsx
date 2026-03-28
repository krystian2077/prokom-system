"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { partUsageDisplayName, type PartUsage } from "@/types/repairs";
import type { InventoryPartCard } from "@/types/inventory";

function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "–";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

function formatPlDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return "—";
  return new Date(y, m - 1, day).toLocaleDateString("pl-PL");
}

export function PartUsageDetailModal({
  open,
  onClose,
  usageRow,
  token,
}: {
  open: boolean;
  onClose: () => void;
  usageRow: PartUsage | null;
  token: string | null;
}) {
  const [card, setCard] = useState<InventoryPartCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const partId = usageRow?.part?.id;

  useEffect(() => {
    if (!open || !token || !partId) {
      setCard(null);
      setCardError(null);
      return;
    }
    let cancelled = false;
    setCardLoading(true);
    setCardError(null);
    void (async () => {
      try {
        const c = await api.get<InventoryPartCard>(`/inventory/parts/${partId}/card/`, token);
        if (!cancelled) setCard(c);
      } catch (e) {
        if (!cancelled) {
          setCardError(e instanceof Error ? e.message : "Nie udało się wczytać karty części.");
        }
      } finally {
        if (!cancelled) setCardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token, partId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !usageRow) return null;

  const repairId = usageRow.repair;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/65"
        aria-label="Zamknij"
        onClick={onClose}
      />
      <div className="relative z-10 m-4 max-h-[min(92vh,880px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5 shadow-xl sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink2)]">Pozycja w naprawie</p>
            <h3 className="mt-1 text-lg font-semibold text-[var(--white)]">
              {partUsageDisplayName(usageRow)}{" "}
              {usageRow.part?.code ? <span className="text-[var(--ink2)]">({usageRow.part.code})</span> : null}
            </h3>
            {usageRow.repair_number ? (
              <p className="mt-1 font-mono text-sm text-[var(--ink2)]">{usageRow.repair_number}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] p-2 text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--s1)] p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[var(--ink2)]">Urządzenie</p>
              <p className="text-[var(--white)]">{usageRow.repair_device_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Przypisany</p>
              <p className="text-[var(--white)]">{usageRow.assigned_to_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Status części</p>
              <p className="text-[var(--white)]">{usageRow.usage_status_display}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Status zamówienia</p>
              <p className="text-[var(--white)]">{usageRow.order_status_display ?? usageRow.order_status ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Ilość</p>
              <p className="text-[var(--white)]">{usageRow.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Cena jedn. / suma</p>
              <p className="text-[var(--white)]">
                {formatMoney(usageRow.unit_price_used)} · {formatMoney(usageRow.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Cena zakupu (części)</p>
              <p className="text-[var(--white)]">{usageRow.purchase_cost != null ? formatMoney(usageRow.purchase_cost) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink2)]">Planowana dostawa</p>
              <p className="text-[var(--white)]">{formatPlDate(usageRow.expected_arrival_date)}</p>
            </div>
          </div>
          {usageRow.supplier_detail?.name ? (
            <div>
              <p className="text-xs text-[var(--ink2)]">Hurtownia</p>
              <p className="text-[var(--white)]">{usageRow.supplier_detail.name}</p>
            </div>
          ) : null}
          {usageRow.notes ? (
            <div>
              <p className="text-xs text-[var(--ink2)]">Notatka</p>
              <p className="whitespace-pre-wrap text-[#e5e7eb]">{usageRow.notes}</p>
            </div>
          ) : null}
        </div>

        {repairId ? (
          <div className="mt-4">
            <Link
              href={`/panel/naprawy/${repairId}`}
              className="inline-flex rounded-xl bg-[#3b82f6]/20 px-4 py-2 text-sm font-semibold text-[#93c5fd] transition hover:bg-[#3b82f6]/30"
            >
              Otwórz naprawę
            </Link>
          </div>
        ) : null}

        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--ink2)]">Katalog części</p>
          {!partId ? (
            <p className="mt-2 text-sm text-[var(--ink2)]">Pozycja bez powiązania z katalogiem — brak statystyk z magazynu.</p>
          ) : null}
          {partId && cardLoading ? <p className="mt-2 text-sm text-[var(--ink2)]">Wczytywanie karty części…</p> : null}
          {partId && cardError ? <p className="mt-2 text-sm text-[#fca5a5]">{cardError}</p> : null}
          {partId && card && !cardLoading ? (
            <div className="mt-3 space-y-2 text-sm text-[#e5e7eb]">
              <p>
                Użyć w serwisie: <span className="font-semibold text-[var(--white)]">{card.usage_count}</span>
              </p>
              {card.avg_purchase_cost ? (
                <p>
                  Śr. koszt zakupu:{" "}
                  <span className="font-mono text-[var(--white)]">{formatMoney(card.avg_purchase_cost)}</span>
                </p>
              ) : null}
              {card.last_supplier?.name ? (
                <p>
                  Ostatnia hurtownia: <span className="text-[var(--white)]">{card.last_supplier.name}</span>
                </p>
              ) : null}
              {card.recent_repairs?.length ? (
                <div className="mt-2">
                  <p className="text-xs text-[var(--ink2)]">Ostatnie naprawy z tą częścią</p>
                  <ul className="mt-1 space-y-1">
                    {card.recent_repairs.slice(0, 5).map((r) => (
                      <li key={r.usage_id} className="flex flex-wrap gap-2 text-xs">
                        <span className="font-mono text-[var(--ink2)]">{r.repair_number ?? r.repair_id}</span>
                        <span className="text-[var(--muted)]">{r.usage_status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
