/**
 * Statusy naprawy — wartości API + etykiety publiczne (klient i serwis).
 * Samodzielny moduł (bez importu z komponentów), żeby uniknąć cykli z repairStatusPublic.
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

/**
 * Lista w modalu „Zmień status” (Szybka akcja) — unikalne etykiety, jeden kod API na pozycję.
 */
export const QUICK_CHANGE_STATUS_OPTIONS: Array<{ value: RepairStatusValue; label: string }> = [
  { value: "accepted", label: "Zgłoszenie przyjęte" },
  { value: "in_diagnostics", label: "W Diagnostyce" },
  { value: "diagnostics_done", label: "Diagnoza Ukończona" },
  { value: "quote_sent", label: "Wycena Wysłana" },
  { value: "waiting_for_parts", label: "Oczekiwanie na Części" },
  { value: "in_repair", label: "W naprawie" },
  { value: "repair_done", label: "Naprawa Zakończona" },
  { value: "ready_for_pickup", label: "Gotowe Do Odbioru" },
  { value: "shipped", label: "Wysłane" },
  { value: "picked_up", label: "Odebrane" },
  { value: "cancelled", label: "Anulowane" },
  { value: "unrepairable", label: "Naprawa Nieopłacalna" },
];

/** Mapuje dowolny status z API na wartość z listy szybkiej zmiany (do ustawienia selecta). */
export function normalizeStatusToQuickChangeValue(status: string | null | undefined): RepairStatusValue {
  const s = (status ?? "").trim();
  const map: Record<string, RepairStatusValue> = {
    new: "accepted",
    accepted: "accepted",
    in_diagnostics: "in_diagnostics",
    diagnostics_done: "diagnostics_done",
    quote_pending: "diagnostics_done",
    quote_sent: "quote_sent",
    quote_accepted: "in_repair",
    quote_rejected: "quote_sent",
    waiting_for_parts: "waiting_for_parts",
    in_repair: "in_repair",
    repair_done: "repair_done",
    in_testing: "in_repair",
    testing_passed: "repair_done",
    testing_failed: "in_repair",
    ready_for_pickup: "ready_for_pickup",
    picked_up: "picked_up",
    shipped: "shipped",
    delivered: "picked_up",
    cancelled: "cancelled",
    unrepairable: "unrepairable",
    abandoned: "picked_up",
  };
  return map[s] ?? "in_repair";
}

/**
 * Typowy „szczęśliwy” ciąg statusów (bez anulowania / nieopłacalnej).
 * Używane do podpowiedzi „następny status” w modalu szybkiej zmiany.
 */
export const TYPICAL_NEXT_STATUS_SEQUENCE: RepairStatusValue[] = [
  "accepted",
  "in_diagnostics",
  "diagnostics_done",
  "quote_sent",
  "waiting_for_parts",
  "in_repair",
  "repair_done",
  "ready_for_pickup",
  "shipped",
  "picked_up",
];

/** Następny sensowny krok względem bieżącego statusu z listy szybkiej — albo null (koniec ścieżki / status poza sekwencją). */
export function getSuggestedNextQuickStatus(currentQuick: RepairStatusValue): RepairStatusValue | null {
  const idx = TYPICAL_NEXT_STATUS_SEQUENCE.indexOf(currentQuick);
  if (idx === -1) return null;
  if (idx >= TYPICAL_NEXT_STATUS_SEQUENCE.length - 1) return null;
  return TYPICAL_NEXT_STATUS_SEQUENCE[idx + 1];
}

export function quickChangeOptionLabel(value: RepairStatusValue): string {
  return QUICK_CHANGE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export const STATUS_OPTIONS: Array<{ value: RepairStatusValue; label: string }> = [
  { value: "new", label: "Zgłoszenie przyjęte" },
  { value: "accepted", label: "Zgłoszenie przyjęte" },
  { value: "in_diagnostics", label: "W Diagnostyce" },
  { value: "diagnostics_done", label: "Diagnoza Ukończona" },
  { value: "quote_pending", label: "Diagnoza Ukończona" },
  { value: "quote_sent", label: "Wycena Wysłana" },
  { value: "quote_accepted", label: "W naprawie" },
  { value: "quote_rejected", label: "Anulowane" },
  { value: "waiting_for_parts", label: "Oczekiwanie na Części" },
  { value: "in_repair", label: "W naprawie" },
  { value: "repair_done", label: "Naprawa Zakończona" },
  { value: "in_testing", label: "W naprawie" },
  { value: "testing_passed", label: "Naprawa Zakończona" },
  { value: "testing_failed", label: "W naprawie" },
  { value: "ready_for_pickup", label: "Gotowe Do Odbioru" },
  { value: "picked_up", label: "Odebrane" },
  { value: "shipped", label: "Wysłane" },
  { value: "delivered", label: "Odebrane" },
  { value: "cancelled", label: "Anulowane" },
  { value: "unrepairable", label: "Naprawa Nieopłacalna" },
  { value: "abandoned", label: "Porzucone przez klienta" },
];
