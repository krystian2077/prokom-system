/**
 * /naprawa-kurierem data helpers (SPEC §12.10). Fields set to null hide their sentence/row.
 */
import { courierService } from "@/config/prokom";
import { isDraftMode } from "./points";

type Courier = typeof courierService;

/** Production: only when published. Staging (NEXT_PUBLIC_TECH_DRAFT=1): visible in a draft frame. */
export function courierPageVisible(service: Courier = courierService, draft: boolean = isDraftMode()): boolean {
  return service.published || draft;
}

/** In the sitemap only when published (never as a draft). */
export function courierInSitemap(service: Courier = courierService): boolean {
  return service.published;
}


const who = (p: "client" | "service") => (p === "client" ? "Ty" : "serwis");

export const TRANSFER_AFTER_APPROVAL = "przelew po diagnozie i akceptacji naprawy";

/**
 * How the client pays for a courier repair, as plain Polish; null when `payment` is not set.
 * Never cash on delivery — the sentence says so whenever payment is known.
 */
export function courierPaymentText(service: Courier = courierService): string | null {
  const methods = service.payment ?? [];
  if (!methods.length) return null;
  const how = methods.includes(TRANSFER_AFTER_APPROVAL)
    ? "Za naprawę płacisz przelewem — po diagnozie urządzenia i dopiero wtedy, gdy zaakceptujesz naprawę."
    : `Płatność za naprawę: ${methods.join(", ")}.`;
  return `${how} Nie wysyłamy za pobraniem.`;
}

/** "Kto płaci" table rows; a null field = no row. */
export function courierPayRows(service: Courier = courierService): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = [];
  if (service.inboundPaidBy) rows.push({ k: "Wysyłka do serwisu", v: who(service.inboundPaidBy) });
  if (service.returnPaidBy) rows.push({ k: "Odesłanie po naprawie", v: who(service.returnPaidBy) });
  if (service.returnIfDeclined) rows.push({ k: "Odesłanie po rezygnacji z naprawy", v: who(service.returnIfDeclined) });
  return rows;
}
