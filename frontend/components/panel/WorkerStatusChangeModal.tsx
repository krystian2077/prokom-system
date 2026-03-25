"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useWorkerStore } from "@/stores/workerStore";

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

/** Eksportowane dla zbiorczej zmiany statusu (lista admin). */
export const STATUS_OPTIONS: Array<{ value: RepairStatusValue; label: string }> = [
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
  const [blocker, setBlocker] = useState("");
  const [newStatus, setNewStatus] = useState<RepairStatusValue>("in_repair");
  const [publicStatus, setPublicStatus] = useState<RepairStatusValue>("in_repair");
  const [notes, setNotes] = useState("");
  const [suggestedMessage, setSuggestedMessage] = useState("");
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSavedBanner(null);
    setBlocker("");
    setNotes("");
    setSuggestedMessage("");
    const maybe = STATUS_OPTIONS.find((s) => s.value === currentStatus) ? (currentStatus as RepairStatusValue) : null;
    if (maybe) {
      setNewStatus(maybe);
      setPublicStatus(maybe);
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
    if (newStatus === "delivered") {
      const ok = await confirm({
        title: "Oznaczyć urządzenie jako wydane?",
        description:
          `Ta akcja oznaczy urządzenie ${repairNumber || repairId} jako wydane klientowi. Nie można cofnąć.`,
        confirmLabel: "Tak, wydano",
        variant: "danger",
      });
      if (!ok) return;
    }
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
        title: "Oznaczyć jako nie do naprawy?",
        description: "To komunikuje klientowi brak możliwości naprawy po diagnozie.",
        confirmLabel: "Tak, nie do naprawy",
        variant: "warning",
      });
      if (!ok) return;
    }
    if (newStatus === "abandoned") {
      const ok = await confirm({
        title: "Oznaczyć jako porzucone przez klienta?",
        description: "Sprawa zostanie zamknięta jako porzucona.",
        confirmLabel: "Tak, porzucone",
        variant: "warning",
      });
      if (!ok) return;
    }
    setSavedBanner(null);
    const combined = [blocker.trim(), notes.trim()].filter(Boolean).join("\n\n");
    try {
      const response = await api.post<any>(
        `/repairs/${repairId}/change-status/`,
        { new_status: newStatus, notes: combined },
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
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">1. Bloker sprawy (opcjonalnie)</label>
            <input
              type="text"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
              placeholder="np. czeka na część, decyzja klienta…"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">2. Status wewnętrzny</label>
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
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">3. Status publiczny</label>
            <select
              value={publicStatus}
              onChange={(e) => setPublicStatus(e.target.value as RepairStatusValue)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={`pub-${s.value}`} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a8]">4. Notatka wewnętrzna (opcjonalnie)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-2xl border border-white/10 bg-[#111318] px-4 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]"
              rows={4}
              placeholder="np. szczegóły dla zespołu, komentarz po zmianie…"
            />
          </div>

          {canShowMessageBox ? (
            <div className="rounded-2xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                5. Sugerowana wiadomość
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
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            >
              Pomiń komunikat
            </button>
            <button type="submit" className="rounded-2xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]">
              Zapisz status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

