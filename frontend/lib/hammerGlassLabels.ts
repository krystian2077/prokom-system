/** Zgodne z RepairRequest.HAMMER_GLASS_CHOICES (backend). */
const MAP: Record<string, string> = {
  yes: "Tak, proszę o ofertę",
  no: "Nie",
  ask_later: "Zapytam później",
  free_with_quote: "Gratis przy wycenie",
};

export function hammerGlassInterestLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  return MAP[v] ?? v;
}
