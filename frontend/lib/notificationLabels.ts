const TYPE_LABELS: Record<string, string> = {
  repair_assigned: "Przypisano naprawę",
  task_assigned: "Przypisano zadanie",
  task_comment: "Komentarz do zadania",
  task_due_changed: "Zmieniono termin zadania",
  quote_accepted: "Zaakceptowano wycenę",
  quote_rejected: "Odrzucono wycenę",
  repair_due_soon: "Termin naprawy wkrótce",
  sla_exceeded: "Przekroczono SLA",
  sla_warning: "Ostrzeżenie SLA",
  complaint_warranty_assigned: "Przypisano reklamację/gwarancję",
  complaint_warranty_awaiting_decision: "Reklamacja/gwarancja czeka na decyzję",
  quick_accept_incomplete: "Niepełne szybkie przyjęcie",
  unassigned_queue_note: "Notatka w kolejce nieprzypisanych",
  new_unassigned: "Nowe nieprzypisane zgłoszenie",
  complaint: "Reklamacja",
  part_arrived: "Dotarła część",
  client_message: "Wiadomość od klienta",
  new_message: "Nowa wiadomość",
  note_added: "Dodano notatkę",
  mentioned: "Wzmianka",
  status_changed: "Zmiana statusu",
  system: "Powiadomienie systemowe",
};

const STATUS_LABELS: Record<string, string> = {
  unread: "Nieprzeczytane",
  read: "Przeczytane",
  archived: "Zarchiwizowane",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niski",
  standard: "Standardowy",
  important: "Ważny",
  urgent: "Pilny",
};

function fallbackLabel(value: string): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return "-";
  const withSpaces = normalized.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function notificationTypeLabel(type: string | null | undefined): string {
  const key = (type ?? "").toLowerCase();
  return TYPE_LABELS[key] ?? fallbackLabel(type ?? "");
}

export function notificationStatusLabel(status: string | null | undefined): string {
  const key = (status ?? "").toLowerCase();
  return STATUS_LABELS[key] ?? fallbackLabel(status ?? "");
}

export function notificationPriorityLabel(priority: string | null | undefined): string {
  const key = (priority ?? "").toLowerCase();
  return PRIORITY_LABELS[key] ?? fallbackLabel(priority ?? "");
}

