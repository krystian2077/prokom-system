/**
 * Formatowanie dat i tekstu — panel klienta PRO-KOM.
 */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "12.01.2025, godz. 09:14" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, godz. ${timePart}`;
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}
