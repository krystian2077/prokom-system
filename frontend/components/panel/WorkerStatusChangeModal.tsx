"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useWorkerStore } from "@/stores/workerStore";
import { repairStatusPublicLabel } from "@/lib/repairStatusPublic";
import {
  QUICK_CHANGE_STATUS_OPTIONS,
  STATUS_OPTIONS,
  normalizeStatusToQuickChangeValue,
  type RepairStatusValue,
} from "@/lib/repairStatusOptions";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";

const STATUS_META: Partial<Record<RepairStatusValue, { color: string }>> = {
  accepted:          { color: "#3b82f6" },
  in_diagnostics:    { color: "#a78bfa" },
  diagnostics_done:  { color: "#818cf8" },
  quote_sent:        { color: "#22d3ee" },
  waiting_for_parts: { color: "#f59e0b" },
  in_repair:         { color: "#60a5fa" },
  repair_done:       { color: "#34d399" },
  ready_for_pickup:  { color: "#22c55e" },
  shipped:           { color: "#10b981" },
  picked_up:         { color: "#4ade80" },
  cancelled:         { color: "#ef4444" },
  unrepairable:      { color: "#f97316" },
};

/**
 * UWAGA:
 * Tymczasowy adapter do istniejącego backendu:
 * - backend zmienia status przez POST `/repairs/:id/change-status/` (new_status + notes)
 * - nie mamy (jeszcze) pól/sugestii sms/email, więc modal trzyma się "bez zamykania" po zapisie.
 */

export { STATUS_OPTIONS, type RepairStatusValue };

export function WorkerStatusChangeModal({
  open,
  repairId,
  repairNumber,
  currentStatus,
  onClose,
  onStatusSaved,
}: {
  open: boolean;
  repairId: string;
  repairNumber?: string | null;
  currentStatus: string | null | undefined;
  onClose: () => void;
  onStatusSaved?: () => void;
}) {
  const { token } = useAuth();
  const { confirm } = useConfirm();
  const addToast = useWorkerStore((s) => s.addToast);

  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<RepairStatusValue>("in_repair");
  const [publicStatus, setPublicStatus] = useState<RepairStatusValue>("in_repair");
  const [notes, setNotes] = useState("");
  const [suggestedMessage, setSuggestedMessage] = useState("");
  const [loadingSuggested, setLoadingSuggested] = useState(false);
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
    setSavedBanner(null);
    setNotes("");
    setSuggestedMessage("");
    const prefill = useWorkerStore.getState().statusModalPrefillNewStatus;
    const v = prefill
      ? (prefill as RepairStatusValue)
      : normalizeStatusToQuickChangeValue(currentStatus);
    setNewStatus(v);
    setPublicStatus(v);
    if (prefill) {
      useWorkerStore.setState({ statusModalPrefillNewStatus: null });
    }
  }, [open, currentStatus]);

  useEffect(() => {
    if (!open || !token || !publicStatus) return;
    setLoadingSuggested(true);
    // Fallback dla suggested_sms: jeśli backend nie zwraca przy change-status,
    // próbujemy pobrać szablon komunikacji per trigger statusu.
    void api
      .get<any>(`/communications/templates/?trigger=${encodeURIComponent(publicStatus)}&channel=panel`, token)
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
        const first = list[0];
        const text =
          (typeof first?.body === "string" && first.body) ||
          (typeof first?.content === "string" && first.content) ||
          (typeof first?.message === "string" && first.message) ||
          "";
        setSuggestedMessage(text);
      })
      .catch(() => setSuggestedMessage(""))
      .finally(() => setLoadingSuggested(false));
  }, [open, token, publicStatus]);

  const canShowMessageBox = useMemo(
    () => Boolean(publicStatus && (loadingSuggested || suggestedMessage.trim())),
    [publicStatus, loadingSuggested, suggestedMessage],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newStatus === "cancelled") {
      const ok = await confirm({
        title: "Anulować naprawę?",
        description: `Naprawa ${repairNumber || repairId} zostanie anulowana. Upewnij się, że klient został poinformowany.`,
        confirmLabel: "Anuluj naprawę",
        variant: "danger",
      });
      if (!ok) return;
    }
    if (newStatus === "unrepairable") {
      const ok = await confirm({
        title: "Oznaczyć naprawę jako nieopłacalną?",
        description: "To komunikuje klientowi, że naprawa jest nieopłacalna po diagnozie.",
        confirmLabel: "Tak, nieopłacalna",
        variant: "warning",
      });
      if (!ok) return;
    }
    setSavedBanner(null);
    try {
      const response = await api.post<any>(
        `/repairs/${repairId}/change-status/`,
        { new_status: newStatus, notes: notes.trim() },
        token,
      );
      const backendSuggested = typeof response?.suggested_sms === "string" ? response.suggested_sms.trim() : "";
      if (backendSuggested) {
        setSuggestedMessage(backendSuggested);
      }
      setSavedBanner("✓ Status zmieniony");
      onStatusSaved?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zmienić statusu.";
      addToast(msg, "error");
    }
  };

  const sendSuggested = async (channel: "sms" | "email" | "both") => {
    if (!token || !suggestedMessage.trim()) return;
    try {
      if (channel === "both") {
        await Promise.all([
          api.post(`/communications/send/`, { repair_id: repairId, channel: "sms", content: suggestedMessage }, token),
          api.post(`/communications/send/`, { repair_id: repairId, channel: "email", content: suggestedMessage }, token),
        ]);
      } else {
        await api.post(`/communications/send/`, { repair_id: repairId, channel, content: suggestedMessage }, token);
      }
      addToast("✓ Wiadomość wysłana", "success");
      setSavedBanner("✓ Status i komunikat zostały zapisane");
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Nie udało się wysłać wiadomości.", "error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 py-8" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--s1)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">Zmień status</div>
            <h3 className="mt-1 text-xl font-semibold text-[var(--white)]">Szybka akcja</h3>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              Obecny status:{" "}
              <span className="font-semibold text-[var(--white)]">{repairStatusPublicLabel(currentStatus)}</span>
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
            className="rounded-xl border border-[var(--border)] bg-[var(--row-hover)] px-3 py-2 text-sm text-[var(--ink2)] hover:bg-[var(--row-active)]"
          >
            Zamknij
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-[var(--ink2)]">
              1. Status
            </label>
            <div ref={dropdownRef} className="relative mt-1">
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
                          onClick={() => {
                            setNewStatus(opt.value);
                            setPublicStatus(opt.value);
                            setDropdownOpen(false);
                          }}
                          className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected ? "bg-white/8" : "hover:bg-white/5"
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
                          {(isDestructive || isWarning) && (
                            <AlertTriangle className={`h-4 w-4 shrink-0 ${isDestructive ? "text-[#ef4444]/70" : "text-[#f97316]/70"}`} />
                          )}
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
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink2)]">2. Notatka wewnętrzna (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#111318] px-4 py-2.5 text-sm text-[var(--white)] outline-none focus:border-[#3b82f6]"
              rows={4}
              placeholder="np. szczegóły dla zespołu, komentarz po zmianie…"
            />
          </div>

          {canShowMessageBox ? (
            <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                3. Sugerowana wiadomość
              </div>
              <div className="mt-2 text-sm text-[#e5e7eb] whitespace-pre-wrap">
                {loadingSuggested ? "Pobieram sugestię..." : suggestedMessage || "Brak gotowej sugestii dla tego statusu."}
              </div>
              {suggestedMessage ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void sendSuggested("sms")}
                    className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-2 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/25"
                  >
                    Wyślij SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendSuggested("email")}
                    className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-2 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/25"
                  >
                    Wyślij e-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendSuggested("both")}
                    className="rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/15 px-3 py-2 text-xs font-semibold text-[#bfdbfe] hover:bg-[#3b82f6]/25"
                  >
                    Wyślij oba
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {savedBanner ? (
            <div
              className="rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm font-semibold"
              style={{ color: "#86efac" }}
            >
              {savedBanner}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--border)] bg-[var(--row-hover)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] transition hover:bg-[var(--row-active)] hover:text-[var(--white)]"
            >
              Pomiń komunikat
            </button>
            <button type="submit" className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[var(--white)] transition hover:bg-[#2563eb]">
              Zapisz status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

