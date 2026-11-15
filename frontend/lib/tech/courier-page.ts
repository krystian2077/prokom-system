/**
 * /naprawa-kurierem data helpers (SPEC §12.10). Fields set to null hide their sentence/row.
 */
import { courierService, servicePoints, type ServicePoint } from "@/config/prokom";
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

/** The point parcels go to — only a published point. */
export function courierPoint(points: ServicePoint[] = servicePoints, service: Courier = courierService): ServicePoint | null {
  const p = points.find((x) => x.key === service.address);
  return p && p.published ? p : null;
}

const who = (p: "client" | "service") => (p === "client" ? "Ty" : "serwis");

/** "Kto płaci" table rows; a null field = no row. */
export function courierPayRows(service: Courier = courierService): { k: string; v: string }[] {
  const rows: { k: string; v: string }[] = [];
  if (service.inboundPaidBy) rows.push({ k: "Wysyłka do serwisu", v: who(service.inboundPaidBy) });
  if (service.returnPaidBy) rows.push({ k: "Odesłanie po naprawie", v: who(service.returnPaidBy) });
  if (service.returnIfDeclined) rows.push({ k: "Odesłanie po rezygnacji z naprawy", v: who(service.returnIfDeclined) });
  return rows;
}
