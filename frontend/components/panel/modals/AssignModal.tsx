"use client";

import { useEffect, useState } from "react";
import { useWorkerStore } from "@/stores/workerStore";

export function AssignModal({
  open,
  onClose,
  isAdmin,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onSubmit: (payload: { assigned_to_id?: string | null; notes?: string }) => Promise<void>;
}) {
  const addToast = useWorkerStore((s) => s.addToast);
  const [assignedToId, setAssignedToId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAssignedToId("");
    setNotes("");
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isAdmin) {
        if (!assignedToId.trim()) {
          throw new Error("Podaj UUID pracownika (assigned_to_id).");
        }
        await onSubmit({ assigned_to_id: assignedToId.trim(), notes: notes.trim() || undefined });
      } else {
        // staff: backend i tak przypisuje do siebie, więc notatka wystarczy
        await onSubmit({ assigned_to_id: null, notes: notes.trim() || undefined });
      }
      addToast("✓ Przypisanie zapisane", "success");
      onClose();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Nie udało się przypisać naprawy.";
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
            <h3 className="mt-1 text-xl font-semibold text-[var(--white)]">Przypisz naprawę</h3>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {isAdmin ? "Admin wybiera pracownika po UUID." : "Przypisanie do Ciebie (staff)."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--ink2)] hover:bg-[var(--row-active)]"
          >
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isAdmin && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">assigned_to_id (UUID)</label>
              <input
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
                placeholder="np. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Powód / notatka (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#dc1e1e]"
              rows={3}
              placeholder="np. wymagane kompetencje, pilne, zmiana planu…"
            />
          </div>

          {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:opacity-60"
            >
              {submitting ? "Przypisuję…" : "Zapisz przypisanie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

