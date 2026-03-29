/**
 * PRO-KOM — centralny klient API do backendu Django.
 * Bazowy URL: NEXT_PUBLIC_API_URL + /api/v1/
 *
 * `api.*(path, token?, …)` — jawny token (kompatybilność wsteczna).
 * `authApi.*` — Token z localStorage (React Query / nowy panel).
 */

import {
  getStoredToken,
  clearStoredToken,
  clearStoredRole,
  clearSessionCookies,
} from "./auth-storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions extends RequestInit {
  method?: ApiMethod;
  token?: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body?: string;

  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function isPublicClientRoute(pathname: string): boolean {
  const pub = [
    "/client/login",
    "/client/rejestracja",
    "/client/forgot-password",
    "/client/reset-password",
    "/client/verify-email",
  ];
  return pub.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  clearStoredToken();
  clearStoredRole();
  clearSessionCookies();
  const p = window.location.pathname;
  if (p.startsWith("/admin-panel")) {
    window.location.assign("/panel/login");
    return;
  }
  if (p.startsWith("/panel") && !p.startsWith("/panel/login")) {
    window.location.assign("/panel/login");
    return;
  }
  if (p.startsWith("/client") && !isPublicClientRoute(p)) {
    window.location.assign("/client/login");
  }
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
  delivery_house_number: "Numer domu / lokalu (dostawa)",
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

/** Domyślny limit czasu HTTP — zapobiega „wiszącemu” przyciskowi przy zawieszonej odpowiedzi. */
const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;

async function request<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", token, headers: customHeaders, signal: _callerSignal, ...rest } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Token ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_V1}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { method, headers, signal: controller.signal, ...rest });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        "Przekroczono czas oczekiwania na odpowiedź serwera. Sprawdź połączenie lub odśwież stronę.",
        0,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errBody = await res.text();
    const message = getErrorMessageFromBody(errBody, `Błąd ${res.status}. Spróbuj ponownie.`);
    const hadAuth = Boolean(token);
    if (res.status === 401 && hadAuth) {
      handleUnauthorized();
    }
    throw new ApiError(message, res.status, errBody);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  const parsed = safeJsonParse<T>(text);
  return (parsed ?? undefined) as T;
}

function authToken(): string | null {
  return typeof window !== "undefined" ? getStoredToken() : null;
}

/** Żądania z nagłówkiem Authorization z aktualnego tokena (klient). */
export const authApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET", token: authToken() }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, token: authToken() }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, token: authToken() }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, token: authToken() }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE", token: authToken() }),
};

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),

  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, token }),

  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined, token }),

  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

/** Odpowiedź listy DRF z paginacją (next = pełny URL lub null). */
export type PaginatedList<T> = { count?: number; next?: string | null; previous?: string | null; results?: T[] };

/**
 * Pobiera wszystkie strony listy (np. parts-queue), podążając za `next`.
 * Pierwszy request: ścieżka względna `/api/v1/...` lub pełny URL; kolejne używają `next` z odpowiedzi.
 */
export async function fetchAllPages<T>(firstPath: string, token: string | null): Promise<T[]> {
  const all: T[] = [];
  let path: string | null = firstPath;
  while (path) {
    const res: T[] | PaginatedList<T> = await api.get<T[] | PaginatedList<T>>(path, token);
    const rows = Array.isArray(res) ? res : res?.results ?? [];
    all.push(...rows);
    path = Array.isArray(res) ? null : res.next ?? null;
  }
  return all;
}

export { API_BASE, API_V1 };
