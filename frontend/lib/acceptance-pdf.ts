/**
 * Pobieranie protokołu przyjęcia (PDF) — endpoint zwraca binaria, nie JSON.
 */
import { getStoredToken } from "./auth-storage";
import { API_V1, getErrorMessageFromBody } from "./api";

/** Znaki niedozwolone w nazwie pliku pobierania */
function safeDownloadBasename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "plik";
}

/**
 * Otwiera blob w nowej karcie (podgląd / druk). Gdy przeglądarka blokuje wyskakujące okna,
 * pobiera plik — bez rzucania błędu (użytkownik może otworzyć z dysku i wydrukować).
 */
function openBlobInNewTabOrDownload(blob: Blob, fallbackDownloadName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const win = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = safeDownloadBasename(fallbackDownloadName);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}

export async function fetchAcceptanceProtocolPdf(repairId: string, token: string | null): Promise<Blob> {
  const t = token ?? getStoredToken();
  if (!t) {
    throw new Error("Brak sesji — zaloguj się ponownie.");
  }
  const url = `${API_V1}/documents/repair/${encodeURIComponent(repairId)}/acceptance-protocol/`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${t}`,
      // DRF negocjuje Accept przed wejściem do widoku — wyłącznie application/pdf nie ma
      // dopasowanego renderera i kończy się 406 („Nie można zaspokoić nagłówka Accept”).
      Accept: "*/*",
    },
  });

  const buf = await res.arrayBuffer();
  if (!res.ok) {
    const text = new TextDecoder().decode(buf);
    throw new Error(getErrorMessageFromBody(text, `Błąd ${res.status}`));
  }

  return new Blob([buf], { type: "application/pdf" });
}

/** PDF potwierdzenia przyjęcia reklamacji lub gwarancji. */
export async function fetchComplaintWarrantyIntakePdf(repairId: string, token: string | null): Promise<Blob> {
  const t = token ?? getStoredToken();
  if (!t) {
    throw new Error("Brak sesji — zaloguj się ponownie.");
  }
  const url = `${API_V1}/documents/repair/${encodeURIComponent(repairId)}/complaint-warranty-intake/`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${t}`,
      Accept: "*/*",
    },
  });

  const buf = await res.arrayBuffer();
  if (!res.ok) {
    const text = new TextDecoder().decode(buf);
    throw new Error(getErrorMessageFromBody(text, `Błąd ${res.status}`));
  }

  return new Blob([buf], { type: "application/pdf" });
}

export async function downloadComplaintWarrantyIntakePdf(
  repairId: string,
  repairNumber: string,
  token: string | null,
  kind: "reklamacja" | "gwarancja" = "reklamacja",
): Promise<void> {
  const blob = await fetchComplaintWarrantyIntakePdf(repairId, token);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `potwierdzenie-${kind}-${repairNumber}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

/** Otwiera PDF w nowej karcie (druk / podgląd). Przy blokadzie popupów — pobiera plik. */
export async function openAcceptanceProtocolPdf(repairId: string, token: string | null, repairNumber = "naprawa"): Promise<void> {
  const blob = await fetchAcceptanceProtocolPdf(repairId, token);
  openBlobInNewTabOrDownload(blob, `protokol-przyjecia-${safeDownloadBasename(repairNumber)}.pdf`);
}

/** Pobiera plik na dysk zamiast otwierać podgląd. */
export async function downloadAcceptanceProtocolPdf(
  repairId: string,
  repairNumber: string,
  token: string | null,
): Promise<void> {
  const blob = await fetchAcceptanceProtocolPdf(repairId, token);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `protokol-przyjecia-${repairNumber}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

/** Otwiera PNG z kodem QR (etykieta / śledzenie) w nowej karcie — do druku. */
export async function openRepairQrLabel(repairId: string, repairNumber: string, token: string | null): Promise<void> {
  const t = token ?? getStoredToken();
  if (!t) {
    throw new Error("Brak sesji — zaloguj się ponownie.");
  }
  const origin =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const trackUrl = `${origin}/track?ref=${encodeURIComponent(repairNumber)}`;
  const url = `${API_V1}/documents/repair/${encodeURIComponent(repairId)}/qr/?url=${encodeURIComponent(trackUrl)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${t}`,
      Accept: "*/*",
    },
  });
  const buf = await res.arrayBuffer();
  if (!res.ok) {
    const text = new TextDecoder().decode(buf);
    throw new Error(getErrorMessageFromBody(text, `Błąd ${res.status}`));
  }
  const blob = new Blob([buf], { type: "image/png" });
  openBlobInNewTabOrDownload(blob, `etykieta-qr-${safeDownloadBasename(repairNumber)}.png`);
}
