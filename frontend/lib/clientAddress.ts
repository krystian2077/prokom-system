/** Adres z API (ClientAddressSerializer) — spójny z backendem. */
export interface ClientAddressPayload {
  id?: string;
  label?: string | null;
  street?: string;
  /** Osobno od ulicy (nowe zgłoszenia online). */
  house_number?: string | null;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string | null;
  additional_info?: string | null;
  is_default?: boolean;
}

export interface ClientAddressRows {
  postal_code: string;
  city: string;
  street: string;
  house_number: string;
}

/** Rozbicie adresu do wierszy w panelu (kod, miasto, ulica, numer). */
export function clientAddressRows(addr: ClientAddressPayload | string | null | undefined): ClientAddressRows {
  if (addr == null || addr === "") {
    return { postal_code: "—", city: "—", street: "—", house_number: "—" };
  }
  if (typeof addr === "string") {
    const s = addr.trim();
    if (/^[0-9a-f-]{36}$/i.test(s)) {
      return { postal_code: "—", city: "—", street: "—", house_number: "—" };
    }
    return { postal_code: "—", city: "—", street: s, house_number: "—" };
  }
  const pc = (addr.postal_code ?? "").trim() || "—";
  const city = (addr.city ?? "").trim() || "—";
  const st = (addr.street ?? "").trim() || "—";
  const hn = (addr.house_number ?? "").trim();
  return {
    postal_code: pc,
    city,
    street: st,
    house_number: hn || "—",
  };
}

/** Jedna linia (podsumowanie / tooltip). */
export function formatClientAddressLine(addr: ClientAddressPayload | string | null | undefined): string {
  if (addr == null || addr === "") return "—";
  if (typeof addr === "string") {
    const s = addr.trim();
    if (/^[0-9a-f-]{36}$/i.test(s)) return "—";
    return s || "—";
  }
  const hn = (addr.house_number ?? "").trim();
  const st = (addr.street ?? "").trim();
  const streetPart = [st, hn].filter(Boolean).join(" ");
  const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(" ");
  const bits = [streetPart, cityLine, (addr.country ?? "").trim()].filter(Boolean);
  const main = bits.join(", ");
  const extra = (addr.additional_info ?? "").trim();
  if (!main && !extra) return "—";
  return extra ? `${main} — ${extra}` : main;
}
