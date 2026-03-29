/** Etykieta numeru wyceny w UI (np. „Wycena 1”, nie „v1”). */
export function formatQuoteNumberLabel(version: unknown): string {
  if (version === null || version === undefined || version === "") return "—";
  const n = Number(version);
  if (Number.isFinite(n)) return `Wycena ${n}`;
  return `Wycena ${String(version)}`;
}

/** Kolumna „Wysłano e-mail” na liście wycen — data lub Nie/—. */
export function formatQuoteListEmailSentCell(status: unknown, lastEmailSentAt: string | null | undefined): string {
  if (String(status ?? "") === "draft") return "—";
  if (lastEmailSentAt) {
    const d = new Date(lastEmailSentAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    }
  }
  return "Nie";
}
