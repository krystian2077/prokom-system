"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useWorkerStore } from "@/stores/workerStore";
import {
  QUICK_CHANGE_STATUS_OPTIONS,
  normalizeStatusToQuickChangeValue,
  type RepairStatusValue,
} from "@/lib/repairStatusOptions";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";

const DESTRUCTIVE_CONFIRM: Partial<
  Record<
    RepairStatusValue,
    { title: string; description: string; confirmLabel: string; variant: "danger" | "warning" }
  >
> = {
  cancelled: {
    title: "Anulować naprawę?",
    description: "Anulowanie jest poważną decyzją operacyjną. Sprawdź, czy klient został poinformowany.",
    confirmLabel: "Anuluj naprawę",
    variant: "danger",
  },
  unrepairable: {
    title: "Oznaczyć naprawę jako nieopłacalną?",
    description: "To komunikuje klientowi, że naprawa jest nieopłacalna. Upewnij się, że diagnoza jest ostateczna.",
    confirmLabel: "Tak, nieopłacalna",
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

  useEffect(() => {
    if (!open) return;
    setNewStatus(normalizeStatusToQuickChangeValue(currentStatus));
    setNotes("");
  }, [open, currentStatus]);

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
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Szybka akcja</div>
            <h3 className="mt-1 text-xl font-semibold text-[var(--white)]">Zmień status naprawy</h3>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Obecny status:{" "}
              <span className="font-semibold text-[var(--white)]">{repairStatusPublicLabel(currentStatus)}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--ink2)] hover:bg-[var(--row-active)]">
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Nowy status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RepairStatusValue)}
              className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
            >
              {QUICK_CHANGE_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Notatka (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
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

