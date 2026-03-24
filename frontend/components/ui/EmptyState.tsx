"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = "📋", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-5xl opacity-40">{icon}</div>
      <div className="mb-2 font-display text-[15px] font-bold text-[var(--ink)]">{title}</div>
      {description && (
        <p className="max-w-[280px] text-[12.5px] leading-relaxed text-[var(--muted)]">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-[10px] border border-[var(--bb)] bg-[var(--bl)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--blue)] transition-colors hover:bg-[rgba(59,130,246,.18)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export const EMPTY_STATES = {
  myRepairs: {
    icon: "🔧",
    title: "Brak przypisanych napraw",
    description: "Nowe naprawy pojawią się tutaj gdy admin Cię przypisze.",
  },
  archive: {
    icon: "📦",
    title: "Brak zakończonych napraw",
    description: "Historia napraw pojawi się po ukończeniu pierwszego zlecenia.",
  },
  messages: {
    icon: "💬",
    title: "Brak wiadomości",
    description: "Klienci będą się kontaktować przez ten panel.",
  },
  tasks: {
    icon: "✓",
    title: "Wszystkie zadania ukończone",
    description: "Nowe zadania pojawią się tutaj.",
  },
  notifications: {
    icon: "🔔",
    title: "Brak powiadomień",
    description: "Powiadomienia systemowe pojawią się tutaj.",
  },
  parts: {
    icon: "⚙️",
    title: "Brak aktywnych części",
    description: "Zamówione części do Twoich napraw pojawią się tutaj.",
  },
  clients: {
    icon: "👥",
    title: "Brak klientów",
    description: "Klienci pojawią się po przyjęciu pierwszego zgłoszenia.",
  },
  search: {
    icon: "🔍",
    title: "Brak wyników",
    description: "Spróbuj zmienić zapytanie lub filtry.",
  },
  unassigned: {
    icon: "⏳",
    title: "Brak nieprzypisanych napraw",
    description: "Wszystkie naprawy mają przypisanych pracowników.",
  },
  calendar: {
    icon: "📅",
    title: "Brak zdarzeń",
    description: "Zdarzenia kalendarza pojawią się tutaj.",
  },
  claims: {
    icon: "🛡",
    title: "Brak reklamacji",
    description: "Reklamacje i gwarancje pojawią się tutaj.",
  },
  pickups: {
    icon: "📍",
    title: "Brak urządzeń do odbioru",
    description: "Gotowe urządzenia pojawią się tutaj.",
  },
} as const;
