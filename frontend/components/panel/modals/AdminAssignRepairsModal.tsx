"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type AdminAssignStaffOption = {
  id: string;
  label: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  repairIds: string[];
  staff: AdminAssignStaffOption[];
  token: string | null;
  onSuccess: (summary: { ok: number; failed: number }) => void;
};

export function AdminAssignRepairsModal({ open, onClose, repairIds, staff, token, onSuccess }: Props) {
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

  const count = repairIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || count === 0) return;
    if (!assignedToId.trim()) {
      setError("Wybierz pracownika.");
      return;
    }
    setError(null);
    setSubmitting(true);
    let ok = 0;
    let failed = 0;
    for (const repairId of repairIds) {
      try {
        await api.post(
          `/repairs/${repairId}/assign/`,
          { assigned_to_id: assignedToId.trim(), notes: notes.trim() || undefined },
          token,
        );
        ok++;
      } catch {
        failed++;
      }
    }
    setSubmitting(false);
    onSuccess({ ok, failed });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-[18px] border border-white/15 bg-[var(--s1)] p-5 shadow-[0_20px_60px_rgba(0,0,0,.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Szybka akcja</div>
            <h3 className="mt-1 text-xl font-semibold text-[var(--white)]">Przypisz naprawę</h3>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {count === 1 ? "Jedna naprawa" : `Zbiorczo: ${count} napraw`} — wybierz pracownika z listy.
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

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Pracownik</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
              required
            >
              <option value="">— Wybierz —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
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
              className="mt-1 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
              rows={3}
              placeholder="np. przydział po konsultacji, pilne…"
            />
          </div>

          {error ? <p className="text-sm text-[#fca5a5]">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--row-active)] hover:text-[var(--white)] disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting || staff.length === 0}
              className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] hover:bg-[#2563eb] disabled:opacity-60"
            >
              {submitting ? "Przypisywanie…" : count > 1 ? `Przypisz wszystkie (${count})` : "Przypisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
