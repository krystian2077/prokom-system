"use client";

import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useWorkerStore } from "@/stores/workerStore";
import {
  QUICK_CHANGE_STATUS_OPTIONS,
  normalizeStatusToQuickChangeValue,
  type RepairStatusValue,
} from "@/lib/repairStatusOptions";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";
import { Check, ChevronDown, AlertTriangle, XCircle } from "lucide-react";

const STATUS_META: Partial<Record<RepairStatusValue, { color: string; dot: string }>> = {
  accepted:          { color: "#3b82f6", dot: "bg-[#3b82f6]" },
  in_diagnostics:    { color: "#a78bfa", dot: "bg-[#a78bfa]" },
  diagnostics_done:  { color: "#818cf8", dot: "bg-[#818cf8]" },
  quote_sent:        { color: "#22d3ee", dot: "bg-[#22d3ee]" },
  waiting_for_parts: { color: "#f59e0b", dot: "bg-[#f59e0b]" },
  in_repair:         { color: "#60a5fa", dot: "bg-[#60a5fa]" },
  repair_done:       { color: "#34d399", dot: "bg-[#34d399]" },
  ready_for_pickup:  { color: "#22c55e", dot: "bg-[#22c55e]" },
  shipped:           { color: "#10b981", dot: "bg-[#10b981]" },
  picked_up:         { color: "#4ade80", dot: "bg-[#4ade80]" },
  cancelled:         { color: "#ef4444", dot: "bg-[#ef4444]" },
  unrepairable:      { color: "#f97316", dot: "bg-[#f97316]" },
};

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!open) return;
    setNewStatus(normalizeStatusToQuickChangeValue(currentStatus));
    setNotes("");
  }, [open]);

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
            <div ref={dropdownRef} className="relative mt-1">
              {/* trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-3 text-left transition hover:border-white/20 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_META[newStatus]?.color ?? "#6b7280" }}
                  />
                  <span className="text-base font-semibold text-[var(--white)]">
                    {QUICK_CHANGE_STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--ink2)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* dropdown list */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0e1015] shadow-2xl">
                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {QUICK_CHANGE_STATUS_OPTIONS.map((opt) => {
                      const isSelected = opt.value === newStatus;
                      const isDestructive = opt.value === "cancelled";
                      const isWarning = opt.value === "unrepairable";
                      const meta = STATUS_META[opt.value];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setNewStatus(opt.value); setDropdownOpen(false); }}
                          className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-white/8"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-110"
                            style={{ backgroundColor: meta?.color ?? "#6b7280" }}
                          />
                          <span
                            className={`flex-1 text-base font-medium transition-colors ${
                              isDestructive
                                ? "text-[#fca5a5] group-hover:text-[#ef4444]"
                                : isWarning
                                ? "text-[#fdba74] group-hover:text-[#f97316]"
                                : isSelected
                                ? "text-[var(--white)]"
                                : "text-[var(--ink2)] group-hover:text-[var(--white)]"
                            }`}
                          >
                            {opt.label}
                          </span>
                          {isDestructive && <AlertTriangle className="h-4 w-4 shrink-0 text-[#ef4444]/70" />}
                          {isWarning && <AlertTriangle className="h-4 w-4 shrink-0 text-[#f97316]/70" />}
                          {isSelected && !isDestructive && !isWarning && (
                            <Check className="h-4 w-4 shrink-0 text-[var(--ink2)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

