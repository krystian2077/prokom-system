/**
 * Short "kto płaci" lines for the courier option (SPEC §12.10) — wizard and form step 2.
 * Built only from `courierService`; a `null` field means the line is not shown.
 */
import { courierService } from "@/config/prokom";

type Payer = "client" | "service";
const who = (p: Payer) => (p === "client" ? "na Twój koszt" : "na nasz koszt");

export function courierPaysLines(service: typeof courierService = courierService): string[] {
  const out: string[] = [];
  if (service.inboundPaidBy) out.push(`Wysyłka do serwisu ${who(service.inboundPaidBy)}`);
  if (service.returnPaidBy) out.push(`odesłanie po naprawie ${who(service.returnPaidBy)}`);
  if (service.returnIfDeclined) out.push(`odesłanie po rezygnacji ${who(service.returnIfDeclined)}`);
  return out;
}

/** One sentence, e.g. "Wysyłka do serwisu na Twój koszt, odesłanie po naprawie na nasz koszt." */
export function courierPaysText(service: typeof courierService = courierService): string | null {
  const lines = courierPaysLines(service);
  return lines.length ? `${lines.join(", ")}.` : null;
}

/** The "Jak to działa?" link appears only once the courier page is published. */
export function courierPageHref(service: typeof courierService = courierService): string | null {
  return service.published ? "/naprawa-kurierem" : null;
}
