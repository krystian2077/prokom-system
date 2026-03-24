"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/ConfirmDialog";

/**
 * UWAGA:
 * Tymczasowy adapter do istniejącego backendu:
 * - backend zmienia status przez POST `/repairs/:id/change-status/` (new_status + notes)
 * - nie mamy (jeszcze) pól/sugestii sms/email, więc modal trzyma się "bez zamykania" po zapisie.
 */

export type RepairStatusValue =
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

const STATUS_OPTIONS: Array<{ value: RepairStatusValue; label: string }> = [
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

export function WorkerStatusChangeModal({
  open,
  repairId,
  currentStatus,
  onClose,
  onStatusSaved,
}: {
  open: boolean;
  repairId: string;
  currentStatus: string | null | undefined;
  onClose: () => void;
  onStatusSaved?: () => void;
}) {
  const { token } = useAuth();
  const { confirm } = useConfirm();

  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [blocker, setBlocker] = useState("");
  const [newStatus, setNewStatus] = useState<RepairStatusValue>("in_repair");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setSavedBanner(null);
    setBlocker("");
    setNotes("");
    const maybe = STATUS_OPTIONS.find((s) => s.value === currentStatus) ? (currentStatus as RepairStatusValue) : null;
    if (maybe) setNewStatus(maybe);
  }, [open, currentStatus]);

  // Wykorzystujemy istniejący modal UI (select + notes), ale przechwytujemy zachowanie po submit:
  // StatusChangeModal niestety zamyka po submit, więc nie możemy go używać 1:1.
  // Dlatego renderujemy własny wrapper i dajemy użytkownikowi zamknięcie przyciskiem.

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newStatus === "delivered") {
      const ok = await confirm({
        title: "Potwierdzenie dostawy",
        description:
          "Status „Dostarczone” kończy proces obsługi zgłoszenia. Upewnij się, że urządzenie faktycznie dotarło do klienta.",
        confirmLabel: "Tak, oznacz jako dostarczone",
        variant: "warning",
      });
      if (!ok) return;
    }
    setSavedBanner(null);
    const combined = [blocker.trim(), notes.trim()].filter(Boolean).join("\n\n");
    await api.post(`/repairs/${repairId}/change-status/`, { new_status: newStatus, notes: combined }, token);
    setSavedBanner("✓ Status zmieniony");
    onStatusSaved?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f1117] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Zmień status</div>
            <h3 className="mt-1 text-xl font-semibold text-white">Szybka akcja</h3>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Obecny status: <span className="font-semibold text-white">{currentStatus ?? "—"}</span>
            </p>
            {savedBanner ? (
              <div className="mt-3 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm font-semibold" style={{ color: "#86efac" }}>
                {savedBanner}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] hover:bg-white/10"
          >
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Blokada / przyczyna (opcjonalnie)</label>
            <input
              type="text"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
              placeholder="np. czeka na część, decyzja klienta…"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Nowy status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RepairStatusValue)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Notatka (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
              rows={4}
              placeholder="np. szczegóły dla zespołu, komentarz po zmianie…"
            />
          </div>

          {savedBanner ? (
            <div
              className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm font-semibold"
              style={{ color: "#86efac" }}
            >
              {savedBanner}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="submit" className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]">
              Zapisz status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

