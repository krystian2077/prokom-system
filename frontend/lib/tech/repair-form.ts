/**
 * Content and small pure helpers of the repair form (TD3 PR 2). The contract itself
 * (payload, validation, errors) is in ./contract.ts.
 */
import { courierService, type PointKey } from "@/config/prokom";
import type { DeviceIcon } from "./nav";
import type { DeviceCategory, RepairFormState } from "./contract";
import { lowerFirst, wizardDevices } from "./wizard-data";

export const FORM_STEPS = [
  { n: 1, title: "Urządzenie", long: "Urządzenie i usterka", sub: "Rodzaj, marka, model i opis usterki" },
  { n: 2, title: "Dostarczenie", long: "Dostarczenie i zwrot", sub: "Osobiście w punkcie albo kurierem · zwrot: odbiór osobisty albo kurier" },
  { n: 3, title: "Dodatki", long: "Folia Hammer Glass i kopia danych", sub: "Folia ochronna wycięta pod Twój model, kopia danych przed naprawą · opcjonalnie" },
  { n: 4, title: "Twoje dane", long: "Twoje dane", sub: "Imię, nazwisko, e-mail, telefon · wolisz kontakt: telefon, SMS albo e-mail" },
  { n: 5, title: "Podsumowanie", long: "Podsumowanie i wysłanie", sub: "Uwagi dla serwisu, zgoda, numer zgłoszenia do śledzenia naprawy" },
] as const;
export type StepNo = 1 | 2 | 3 | 4 | 5;

/** Icons of the device chips (design T.Zgloszenie). `null` = three dots ("Inne"). */
export const CATEGORY_ICON: Record<DeviceCategory, DeviceIcon | null> = {
  phone: "phone",
  tablet: "tablet",
  smartwatch: "watch",
  laptop: "laptop",
  desktop: "pc",
  printer: "printer",
  console: "console",
  data_recovery: "data",
  other: null,
};

/** Quick additions to the fault description (design: "+ nie ładuje" …). */
export const QUICK_FAULTS = ["nie ładuje", "szybko się rozładowuje", "po zalaniu", "nie włącza się", "brak dźwięku"] as const;

/** True when the description already mentions the fault (case-insensitive). */
export function hasFault(problem: string, fault: string): boolean {
  return problem.toLocaleLowerCase("pl").includes(fault.toLocaleLowerCase("pl"));
}

/** Appends a quick fault to the description without duplicating it. */
export function appendFault(problem: string, fault: string): string {
  const cur = problem.trim();
  if (hasFault(cur, fault)) return problem;
  if (!cur) return fault.charAt(0).toLocaleUpperCase("pl") + fault.slice(1);
  return `${cur.replace(/[.,;]+$/, "")}, ${fault}`;
}

/**
 * Fault suggestions under "Co się dzieje?": the wizard's faults of the chosen device
 * (lib/tech/wizard-data.ts, same names as on the home page), else the general quick list.
 * Returned in lower case, ready for appendFault.
 */
export function faultSuggestions(category: DeviceCategory | null): string[] {
  const device = category ? wizardDevices.find((d) => d.category === category) : undefined;
  if (!device) return [...QUICK_FAULTS];
  return device.faults.filter((f) => f !== "Inny problem").map((f) => lowerFirst(f));
}

/** Placeholders for brand / model per category. */
export const DEVICE_HINTS: Partial<Record<DeviceCategory, { brand: string; model: string }>> = {
  phone: { brand: "np. Apple, Samsung, Xiaomi", model: "np. iPhone 13, Galaxy S23" },
  tablet: { brand: "np. Apple, Samsung, Lenovo", model: "np. iPad 9, Galaxy Tab A8" },
  smartwatch: { brand: "np. Apple, Samsung, Garmin", model: "np. Watch Series 7" },
  laptop: { brand: "np. Lenovo, HP, Dell, ASUS", model: "np. ThinkPad T14, Pavilion 15" },
  desktop: { brand: "np. Dell, HP albo „składak”", model: "np. OptiPlex 3080 albo opis zestawu" },
  printer: { brand: "np. HP, Brother, Canon, Epson", model: "np. LaserJet M110" },
  console: { brand: "np. Sony, Microsoft, Nintendo", model: "np. PS5, Xbox Series S, Switch" },
  data_recovery: { brand: "np. dysk, pendrive, karta pamięci", model: "np. WD Blue 1 TB, SanDisk 64 GB" },
  other: { brand: "np. producent", model: "np. nazwa z naklejki albo pudełka" },
};

/**
 * "Who pays" lines of the courier option, from config/prokom.ts courierService.
 * A null value = the sentence is not shown (SPEC §12.10). Texts accepted on 15.11.2026.
 */
type Payer = "client" | "service" | null;
export function courierLines(c: { inboundPaidBy: Payer; returnPaidBy: Payer; returnIfDeclined: Payer } = courierService): string[] {
  const out: string[] = [];
  if (c.inboundPaidBy === "client") out.push("Wysyłkę do serwisu opłacasz Ty.");
  else if (c.inboundPaidBy === "service") out.push("Wysyłkę do serwisu opłacamy my.");
  if (c.returnPaidBy === "service") out.push("Odesłanie sprzętu po naprawie — na nasz koszt.");
  else if (c.returnPaidBy === "client") out.push("Odesłanie sprzętu po naprawie opłacasz Ty.");
  if (c.returnIfDeclined === "service") out.push("Gdy zrezygnujesz po wycenie, odeślemy sprzęt na nasz koszt.");
  else if (c.returnIfDeclined === "client") out.push("Gdy zrezygnujesz po wycenie, odesłanie sprzętu opłacasz Ty.");
  return out;
}

/** Point chosen for the success card: drop-off point, else pick-up point. */
export function chosenPoint(f: Pick<RepairFormState, "dropoff" | "returnMethod" | "pickupPoint">): PointKey | null {
  if (f.dropoff && f.dropoff !== "courier") return f.dropoff;
  if (f.returnMethod === "in_person" && f.pickupPoint) return f.pickupPoint;
  return null;
}

/**
 * "Before you come" (SPEC §12.3, 4 most important points per device). Accepted on 15.11.2026.
 */
export function prepChecklist(category: DeviceCategory | null): string[] {
  switch (category) {
    case "phone":
    case "tablet":
      return [
        "Zrób kopię zapasową (iCloud, Google albo na komputer).",
        "Przygotuj kod odblokowania albo wzór — podasz go przy przyjęciu.",
        "Wyjmij kartę SIM i kartę pamięci.",
        "Zdejmij etui i szkło ochronne.",
      ];
    case "smartwatch":
      return [
        "Zsynchronizuj zegarek z telefonem (kopia danych).",
        "Przygotuj kod odblokowania zegarka.",
        "Weź ładowarkę do zegarka.",
        "Zdejmij pasek, jeśli jest nietypowy.",
      ];
    case "laptop":
    case "desktop":
      return [
        "Zrób kopię ważnych plików, jeśli komputer działa.",
        "Przygotuj hasło do konta w systemie.",
        "Weź ładowarkę (laptop).",
        "Zapisz, kiedy usterka występuje.",
      ];
    case "console":
      return ["Weź pada i przewód zasilający, jeśli usterka ich dotyczy.", "Zapisz, kiedy usterka występuje.", "Wyjmij płytę z napędu.", "Znaj login do konta (PSN, Xbox, Nintendo)."];
    default:
      return ["Zapisz, kiedy usterka występuje.", "Weź zasilacz albo przewody, jeśli są potrzebne.", "Zrób kopię danych, jeśli to możliwe.", "Przy gwarancji weź dowód zakupu."];
  }
}
