/**
 * PRO-KOM — centralny klient API do backendu Django.
 * Bazowy URL z NEXT_PUBLIC_API_URL (np. http://localhost:8000).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  method?: ApiMethod;
  token?: string | null;
}

/** Bezpieczne parsowanie JSON — nigdy nie rzuca wyjątku. */
function safeJsonParse<T = unknown>(text: string): T | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (trimmed[0] !== "{" && trimmed[0] !== "[") return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Etykiety pól dla komunikatów błędów (formularz zgłoszenia i inne). */
const ERROR_FIELD_LABELS: Record<string, string> = {
  detail: "",
  message: "",
  non_field_errors: "",
  client: "Dane kontaktowe",
  "client.first_name": "Imię",
  "client.last_name": "Nazwisko",
  "client.email": "E-mail",
  "client.phone": "Telefon",
  "client.street": "Ulica",
  "client.city": "Miasto",
  "client.postal_code": "Kod pocztowy",
  "client.country": "Kraj",
  device: "Urządzenie",
  "device.category": "Kategoria urządzenia",
  "device.model_name": "Model urządzenia",
  "device.problem_description": "Opis problemu",
  "device.imei": "IMEI",
  "device.serial_number": "Numer seryjny",
  delivery_method: "Sposób dostawy",
  return_method: "Sposób zwrotu",
  delivery_street: "Ulica (dostawa)",
  delivery_city: "Miasto (dostawa)",
  delivery_postal_code: "Kod pocztowy (dostawa)",
  delivery_country: "Kraj (dostawa)",
  delivery: "Dostawa",
  device_model: "Model urządzenia",
};

/** Formatuje zagnieżdżone błędy walidacji w jeden czytelny tekst. */
function formatValidationErrors(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  function walk(o: Record<string, unknown>, path = ""): void {
    for (const key of Object.keys(o)) {
      const val = o[key];
      const fullPath = path ? `${path}.${key}` : key;
      if (val === null || val === undefined) continue;
      if (Array.isArray(val) && val.length > 0) {
        const label = ERROR_FIELD_LABELS[fullPath] || fullPath.replace(/_/g, " ");
        const msg = val.map((m) => (typeof m === "string" ? m : String(m))).join(". ");
        parts.push(label ? `${label}: ${msg}` : msg);
        continue;
      }
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        walk(val as Record<string, unknown>, fullPath);
      }
    }
  }
  walk(obj);
  return parts.filter(Boolean).join("\n");
}

/** Zwraca jeden lub wiele czytelnych komunikatów z odpowiedzi błędu API (DRF: detail, nested validation). */
export function getErrorMessageFromBody(errBody: string, fallback = "Wystąpił błąd. Spróbuj ponownie."): string {
  const j = safeJsonParse<Record<string, unknown>>(errBody);
  if (!j || typeof j !== "object") {
    if (errBody && errBody.length < 300 && !errBody.startsWith("{")) return errBody.trim();
    return fallback;
  }
  if (typeof j.detail === "string") return j.detail;
  if (typeof j.message === "string") return j.message;
  const nonField = j.non_field_errors;
  if (Array.isArray(nonField) && nonField.length > 0 && typeof nonField[0] === "string") return nonField[0];
  const formatted = formatValidationErrors(j);
  if (formatted) return formatted;
  if (errBody.length < 400) return errBody.trim();
  return fallback;
}

async function request<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", token, headers: customHeaders, ...rest } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Token ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_V1}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { method, headers, ...rest });

  if (!res.ok) {
    const errBody = await res.text();
    const message = getErrorMessageFromBody(errBody, `Błąd ${res.status}. Spróbuj ponownie.`);
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  const parsed = safeJsonParse<T>(text);
  return (parsed ?? undefined) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, token }),

  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, token }),

  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export { API_BASE, API_V1 };
