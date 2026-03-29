import { STATUS_OPTIONS } from "@/lib/repairStatusOptions";

const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Etykieta statusu publicznego (klient + serwis) — zgodna z panelem pracownika / API.
 */
export function repairStatusPublicLabel(code: string | null | undefined): string {
  if (code == null || code === "") return "—";
  return LABEL_BY_CODE[code] ?? code;
}
