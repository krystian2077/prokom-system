"use client";

import { useEffect, useState } from "react";
import { useWorkerStore } from "@/stores/workerStore";

export type RepairNoteTypeValue = "internal" | "system" | "client_contact";

export function AddNoteModal({
  open,
  onClose,
  isInternalDefault = true,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  isInternalDefault?: boolean;
  onSubmit: (payload: {
    note: string;
    is_internal?: boolean;
    is_important?: boolean;
    note_type?: RepairNoteTypeValue;
    pinned?: boolean;
  }) => Promise<void>;
}) {
  const addToast = useWorkerStore((s) => s.addToast);
  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(isInternalDefault);
  const [isImportant, setIsImportant] = useState(false);
  const [noteType, setNoteType] = useState<RepairNoteTypeValue>("internal");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setIsInternal(isInternalDefault);
    setIsImportant(false);
    setNoteType("internal");
    setPinned(false);
    setError(null);
  }, [open, isInternalDefault]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const trimmed = note.trim();
      if (!trimmed) throw new Error("Notatka nie może być pusta.");
      await onSubmit({
        note: trimmed,
        is_internal: isInternal,
        is_important: isImportant,
        note_type: noteType,
        pinned,
      });
      addToast("✓ Notatka dodana", "success");
      onClose();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : "Nie udało się dodać notatki.";
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
            <h3 className="mt-1 text-xl font-semibold text-white">Dodaj notatkę</h3>
            <p className="mt-1 text-sm text-[#9ca3af]">Notatki wewnętrzne nie są widoczne dla klienta.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#9ca3af] hover:bg-white/10">
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Treść notatki</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]"
              rows={5}
              placeholder="Wpisz notatkę dla zespołu…"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Notatka wewnętrzna
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
              Ważna
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">Typ notatki</div>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as RepairNoteTypeValue)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#dc1e1e]"
              >
                <option value="internal">wewnętrzna</option>
                <option value="system">systemowa</option>
                <option value="client_contact">kontakt z klientem</option>
              </select>
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Przypięta
            </label>
          </div>

          {error && <p className="text-sm text-[#fca5a5]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#dc1e1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b81818] disabled:opacity-60"
            >
              {submitting ? "Dodaję…" : "Dodaj notatkę"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

