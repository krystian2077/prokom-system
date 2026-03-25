"use client";

import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useWorkerStore } from "@/stores/workerStore";

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

const DESTRUCTIVE_CONFIRM: Partial<
  Record<
    RepairStatusValue,
    { title: string; description: string; confirmLabel: string; variant: "danger" | "warning" }
  >
> = {
  delivered: {
    title: "Oznaczyć jako dostarczone?",
    description: "Status „dostarczone” zamyka ścieżkę wydania. Upewnij się, że klient odebrał urządzenie.",
    confirmLabel: "Tak, dostarczone",
    variant: "danger",
  },
  cancelled: {
    title: "Anulować naprawę?",
    description: "Anulowanie jest poważną decyzją operacyjną. Sprawdź, czy klient został poinformowany.",
    confirmLabel: "Anuluj naprawę",
    variant: "danger",
  },
  unrepairable: {
    title: "Oznaczyć jako nie do naprawy?",
    description: "To komunikuje klientowi brak możliwości naprawy. Upewnij się, że diagnoza jest ostateczna.",
    confirmLabel: "Tak, nie do naprawy",
    variant: "warning",
  },
  abandoned: {
    title: "Oznaczyć jako porzucone?",
    description: "Sprawa zostanie zamknięta jako porzucona przez klienta.",
    confirmLabel: "Tak, porzucone",
    variant: "warning",
  },
};

export function StatusChangeModal({
  open,
  onClose,
  currentStatus,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  currentStatus: string | null | undefined;
  onSubmit: (payload: { new_status: RepairStatusValue; notes?: string }) => Promise<void>;
}) {
  const { confirm } = useConfirm();
  const addToast = useWorkerStore((s) => s.addToast);
  const [newStatus, setNewStatus] = useState<RepairStatusValue>("in_repair");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!currentStatus) return null;
    return STATUS_OPTIONS.find((s) => s.value === currentStatus) ? currentStatus : null;
  }, [currentStatus]);

  useEffect(() => {
    if (!open) return;
    if (!selected) return;
    setNewStatus(selected as RepairStatusValue);
    // Reset pola notatki przy otwarciu
    setNotes("");
  }, [open, selected]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const confirmCfg = DESTRUCTIVE_CONFIRM[newStatus];
    if (confirmCfg) {
      const ok = await confirm({
        title: confirmCfg.title,
        description: confirmCfg.description,
        confirmLabel: confirmCfg.confirmLabel,
        variant: confirmCfg.variant,
      });
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      if (!newStatus) return;
      await onSubmit({ new_status: newStatus, notes: notes.trim() || undefined });
      addToast("✓ Status zaktualizowany", "success");
      onClose();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Nie udało się zmienić statusu.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f1117] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Szybka akcja</div>
            <h3 className="mt-1 text-xl font-semibold text-white">Zmień status naprawy</h3>
            <p className="mt-1 text-sm text-[#9ca3af]">
              Obecny status: <span className="font-semibold text-white">{currentStatus ?? "—"}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] hover:bg-white/10">
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Nowy status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RepairStatusValue)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]"
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
              className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]"
              rows={4}
              placeholder="np. decyzja klienta, przyczyna zmiany, komentarz dla zespołu…"
            />
          </div>

          {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:opacity-60"
            >
              {submitting ? "Zmieniam…" : "Zapisz status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

